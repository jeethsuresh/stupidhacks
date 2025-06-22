# Cosmic File Portal

A React Next.js frontend that combines a file browser for Go backend trash monitoring with a black hole-themed anonymous file sharing system.

## Features

### File Browser (Left Panel)
- **Trash Backup Browser**: View files backed up from trash monitoring
- **Real-time Updates**: Files appear as they're detected in trash
- **File Downloads**: Click any file to download it
- **Tree Navigation**: Expand folders to browse directory structure
- **Backend**: Go server at `localhost:8080`

### Black Hole Portal (Right Panel)  
- **Anonymous File Sharing**: Upload files to share with random users
- **Cosmic Animations**: Files fall into the black hole when uploaded
- **File Reception**: Receive files from other users emerging from the void
- **WebSocket Connection**: Real-time file delivery
- **Backend**: Separate upload/download server at `localhost:8000`

## Setup

1. **Install Dependencies**:
   ```bash
   cd stupidhacks/frontend
   npm install
   ```

2. **Start the Go Backend** (Terminal 1):
   ```bash
   cd stupidhacks
   go run main.go
   ```
   - Serves at `localhost:8080`
   - Provides file tree API and file downloads
   - Monitors trash folder for new files

3. **Start the Black Hole Backend** (Terminal 2):
   - Start the separate upload/download server at `localhost:8000`
   - Provides session management, file upload, and WebSocket delivery
   - (This backend is not in this codebase - see API documentation)

4. **Start the Frontend** (Terminal 3):
   ```bash
   cd stupidhacks/frontend
   npm run dev
   ```
   - Serves at `localhost:3000`
   - Connects to both backends

## API Integration

### Go Backend (localhost:8080)
- `GET /api/tree` - File tree structure
- `GET /files/{filename}` - Download files
- `WebSocket /ws` - File notifications

### Black Hole Backend (localhost:8000)
- `POST /connect` - Create session
- `POST /upload` - Upload files
- `WebSocket /ws/{session_id}` - File delivery
- `DELETE /disconnect/{session_id}` - End session

## Visual Features

- **Star Field Background**: Animated twinkling stars
- **Rotating Black Hole**: Spiraling accretion disk at bottom of screen
- **File Animations**: 
  - Upload: Files fall into black hole
  - Download: Files emerge from black hole
- **Dark Space Theme**: Purple/blue cosmic gradient
- **Glass Morphism UI**: Semi-transparent panels with blur effects

## Future Enhancements

- Drag files from file browser to black hole for upload
- File preview capabilities
- Enhanced particle effects
- Mobile responsiveness improvements
- File type icons and previews

## Configuration

Update backend URLs in:
- `hooks/useBlackHoleSession.ts` - Black hole backend URL
- `hooks/useFileTree.ts` - Go backend URL
- `main.go` - Trash folder path (line 18)

## Technology Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **WebSockets**: Native WebSocket API
- **File Handling**: File API, Blob downloads
- **Backend**: Go (file monitoring), Separate backend (file sharing)


## Kanwar— Need to integrate frontend  + backend

### Requirements
- move the templated Go HTML to React Code, call backend for the necessary information
- combine Minimal blackhole effect with the trash server
- Blackhole and Trash server are TWO SEPARATE BACKENDS
    - trash server is per device: webpage must connect to local server
    - blackhole is central: webpage must connect to central server
