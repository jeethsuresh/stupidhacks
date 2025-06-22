package main

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const (
	trashPath     = "/Users/jeeth/.Trash" // <- replace YOUR_USERNAME
	backupFolder  = "./TrashBackup"
	pollInterval  = 1 * time.Second
	serverAddress = ":8080"
)

var seen = make(map[string]struct{})

func main() {
	// Start monitoring in background
	go monitorTrash()

	// Start HTTP server
	http.HandleFunc("/", listFilesHandler)
	http.Handle("/files/", http.StripPrefix("/files/", http.FileServer(http.Dir(backupFolder))))

	fmt.Printf("Serving backed-up files at http://localhost%s\n", serverAddress)
	if err := http.ListenAndServe(serverAddress, nil); err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}

func monitorTrash() {
	fmt.Println("Monitoring Trash folder...")

	if err := os.MkdirAll(backupFolder, 0755); err != nil {
		fmt.Printf("Error creating backup folder: %v\n", err)
		return
	}

	for {
		files, err := os.ReadDir(trashPath)
		if err != nil {
			fmt.Printf("Error reading Trash folder: %v\n", err)
			time.Sleep(pollInterval)
			continue
		}

		for _, file := range files {
			path := filepath.Join(trashPath, file.Name())

			if _, exists := seen[path]; !exists {
				fmt.Printf("New file in Trash: %s\n", file.Name())

				backupPath := filepath.Join(backupFolder, file.Name())
				err := copyFileOrDir(path, backupPath)
				if err != nil {
					fmt.Printf("Failed to copy: %v\n", err)
				} else {
					seen[path] = struct{}{}
				}
			}
		}

		time.Sleep(pollInterval)
	}
}

// Web handler: list backed up files
func listFilesHandler(w http.ResponseWriter, r *http.Request) {
	files, err := os.ReadDir(backupFolder)
	if err != nil {
		http.Error(w, "Unable to read backup folder", http.StatusInternalServerError)
		return
	}

	tmpl := `
	<!DOCTYPE html>
	<html>
	<head><title>Trash Backup</title></head>
	<body>
		<h1>Backed Up Trash Files</h1>
		<ul>
			{{range .}}
				<li><a href="/files/{{.}}">{{.}}</a></li>
			{{end}}
		</ul>
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

// File/directory copy helpers
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
