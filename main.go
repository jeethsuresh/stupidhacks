package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	trashPath     = "/Users/brark/.Trash" // <- replace
	backupFolder  = "./TrashBackup"
	pollInterval  = 1 * time.Second
	serverAddress = ":8080"
)

var (
	seen     = make(map[string]struct{})
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow connections from any origin
		},
	}
	clients = make(map[*websocket.Conn]bool)
	mu      sync.Mutex
)

func main() {
	go monitorTrash()

	http.HandleFunc("/", listFilesHandler)
	http.HandleFunc("/api/tree", fileTreeHandler)

	// Add CORS middleware to file server
	fileServer := http.StripPrefix("/files/", http.FileServer(http.Dir(backupFolder)))
	http.Handle("/files/", corsMiddleware(fileServer))
	http.HandleFunc("/ws", wsHandler)

	fmt.Printf("Serving at http://localhost%s\n", serverAddress)
	http.ListenAndServe(serverAddress, nil)
}

func monitorTrash() {
	_ = os.MkdirAll(backupFolder, 0755)

	for {
		files, err := os.ReadDir(trashPath)
		if err != nil {
			time.Sleep(pollInterval)
			continue
		}

		for _, file := range files {
			path := filepath.Join(trashPath, file.Name())

			if _, exists := seen[path]; !exists {
				backupPath := filepath.Join(backupFolder, file.Name())
				err := copyFileOrDir(path, backupPath)
				if err == nil {
					seen[path] = struct{}{}
					broadcastNewFile(file.Name())
				}
			}
		}
		time.Sleep(pollInterval)
	}
}

func broadcastNewFile(fileName string) {
	mu.Lock()
	defer mu.Unlock()
	for conn := range clients {
		err := conn.WriteMessage(websocket.TextMessage, []byte(fileName))
		if err != nil {
			conn.Close()
			delete(clients, conn)
		}
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	mu.Lock()
	clients[conn] = true
	mu.Unlock()
}

func listFilesHandler(w http.ResponseWriter, r *http.Request) {
	files, _ := os.ReadDir(backupFolder)

	tmpl := `
	<!DOCTYPE html>
	<html>
	<head>
		<title>Trash Backup</title>
		<style>
			body {
				margin: 0;
				font-family: sans-serif;
				display: flex;
				height: 100vh;
			}
			.sidebar {
				width: 220px;
				background: #222;
				color: white;
				padding: 20px;
			}
			.sidebar h2 {
				font-size: 18px;
				margin-top: 0;
			}
			.main {
				flex-grow: 1;
				padding: 20px;
				overflow-y: auto;
			}
			.grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
				gap: 20px;
			}
			.file-card {
				background: #f9f9f9;
				border: 1px solid #ddd;
				border-radius: 8px;
				padding: 10px;
				text-align: center;
				box-shadow: 1px 1px 3px rgba(0,0,0,0.1);
			}
			.file-card a {
				text-decoration: none;
				color: #333;
				font-size: 14px;
				word-break: break-all;
			}
			.file-icon {
				font-size: 32px;
				margin-bottom: 8px;
			}
		</style>
		<script>
			let ws = new WebSocket("ws://" + location.host + "/ws");
			ws.onmessage = function(event) {
				const grid = document.getElementById("grid");
				const card = document.createElement("div");
				card.className = "file-card";
				card.innerHTML =
					'<div class="file-icon">📄</div>' +
					'<a href="/files/' + event.data + '" target="_blank">' + event.data + '</a>';
				grid.appendChild(card);
			};
		</script>
	</head>
	<body>
		<div class="sidebar">
			<h2>Folders</h2>
			<ul>
				<li>🗑 Trash</li>
				<li>📁 Backup</li>
			</ul>
		</div>
		<div class="main">
			<h1>Backed Up Trash Files</h1>
			<div class="grid" id="grid">
				{{range .}}
					<div class="file-card">
						<div class="file-icon">📄</div>
						<a href="/files/{{.}}" target="_blank">{{.}}</a>
					</div>
				{{end}}
			</div>
		</div>
	</body>
	</html>
	`

	var fileNames []string
	for _, f := range files {
		fileNames = append(fileNames, f.Name())
	}
	t := template.Must(template.New("index").Parse(tmpl))
	t.Execute(w, fileNames)
}

func copyFileOrDir(src, dst string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return copyDir(src, dst)
	}
	return copyFile(src, dst)
}

func copyFile(src, dst string) error {
	from, err := os.Open(src)
	if err != nil {
		return err
	}
	defer from.Close()

	to, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer to.Close()

	_, err = io.Copy(to, from)
	return err
}

func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

type FileNode struct {
	Name     string     `json:"name"`
	IsDir    bool       `json:"isDir"`
	Children []FileNode `json:"children,omitempty"`
}

func buildFileTree(rootPath string) (FileNode, error) {
	info, err := os.Stat(rootPath)
	if err != nil {
		return FileNode{}, err
	}

	node := FileNode{
		Name:  info.Name(),
		IsDir: info.IsDir(),
	}

	if info.IsDir() {
		entries, err := os.ReadDir(rootPath)
		if err != nil {
			return node, err
		}

		for _, entry := range entries {
			childPath := filepath.Join(rootPath, entry.Name())
			childNode, err := buildFileTree(childPath)
			if err != nil {
				continue // skip unreadable children
			}
			node.Children = append(node.Children, childNode)
		}
	}

	return node, nil
}

func fileTreeHandler(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	tree, err := buildFileTree(backupFolder)
	if err != nil {
		http.Error(w, "Failed to build file tree", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
