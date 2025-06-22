'use client';

import { useState, useEffect, useCallback } from 'react';
import Stars from '../components/Stars';
import BlackHole from '../components/BlackHole';
import FileFalling from '../components/FileFalling';
import FileEmerging from '../components/FileEmerging';
import NotificationPopup, { Notification } from '../components/NotificationPopup';
import { useBlackHoleSession } from '../hooks/useBlackHoleSession';
import { FallingFile, EmergingFile } from '../types';

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<string[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedFileName, setDraggedFileName] = useState<string | null>(null);
  const [isOverBlackHole, setIsOverBlackHole] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const { uploadFile, setFileReceivedCallback } = useBlackHoleSession();
  const [fallingFiles, setFallingFiles] = useState<FallingFile[]>([]);
  const [emergingFiles, setEmergingFiles] = useState<EmergingFile[]>([]);

  // Notification helpers
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      duration,
    };
    setNotifications(prev => [...prev, notification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch files from Go backend
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        console.log('Fetching file tree from Go backend...');
        const response = await fetch('http://localhost:8080/api/tree', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const tree = await response.json();
        
        console.log('Received file tree from Go backend:', tree);
        console.log('Tree structure - name:', tree.name, 'isDir:', tree.isDir, 'children count:', tree.children?.length);
        
        // Extract file names from tree structure
        const extractFiles = (node: any): string[] => {
          let files: string[] = [];
          if (!node.isDir) {
            files.push(node.name);
            console.log('Found file:', node.name);
          }
          if (node.children) {
            console.log(`Processing ${node.children.length} children for directory: ${node.name}`);
            node.children.forEach((child: any) => {
              files = files.concat(extractFiles(child));
            });
          }
          return files;
        };
        const fileList = extractFiles(tree);
        
        console.log('Extracted file list:', fileList);
        console.log('File count:', fileList.length);
        setFiles(fileList);
        console.log('Files state updated');
      } catch (error) {
        console.error('Failed to fetch files:', error);
      }
    };

    fetchFiles();
  }, []);

  // WebSocket for real-time file updates from Go backend
  useEffect(() => {
    console.log('Connecting to Go backend WebSocket...');
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected to Go backend');
    };
    
    ws.onmessage = (event) => {
      const fileName = event.data;
      console.log('Received new file notification from Go backend:', fileName);
      setNewFiles(prev => [...prev, fileName]);
      setFiles(prev => [...prev, fileName]);
    };

    ws.onclose = () => {
      console.log('WebSocket connection to Go backend closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      console.log('Closing WebSocket connection to Go backend');
      ws.close();
    };
  }, []);

  // Handle files received from black hole
  const handleFileReceived = useCallback((filename: string, fileContent: string) => {
    console.log('🌌 BLACK HOLE FILE RECEIVED:', filename);
    console.log('File content length:', fileContent.length);
    console.log('File content preview:', fileContent.substring(0, 100) + '...');
    
    // Show notification immediately
    addNotification(`🌌 File emerging from black hole: ${filename}`, 'info', 4000);
    
    const emergingFile: EmergingFile = {
      id: Math.random().toString(36).substr(2, 9),
      filename,
      fileContent,
    };
    setEmergingFiles(prev => [...prev, emergingFile]);
  }, [addNotification]);

  // Handle file save success
  const handleFileSaveSuccess = useCallback((filename: string) => {
    console.log('💾 File saved successfully to backup:', filename);
    addNotification(`✅ ${filename} saved to backup folder!`, 'success');
    
    // Add file to the list
    setFiles(prev => {
      if (!prev.includes(filename)) {
        return [...prev, filename];
      }
      return prev;
    });
  }, [addNotification]);

  // Handle file save error
  const handleFileSaveError = useCallback((filename: string, error: string) => {
    console.error('💾 File save failed:', filename, error);
    addNotification(`❌ Failed to save ${filename}: ${error}`, 'error');
  }, [addNotification]);

  useEffect(() => {
    setFileReceivedCallback(handleFileReceived);
  }, [setFileReceivedCallback, handleFileReceived]);

  // Handle file drag start
  const handleFileDragStart = useCallback((e: React.DragEvent, fileName: string) => {
    console.log('Starting drag for file:', fileName);
    setIsDraggingFile(true);
    setDraggedFileName(fileName);
    e.dataTransfer.setData('text/plain', fileName);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add some visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.7';
  }, []);

  // Handle file drag end
  const handleFileDragEnd = useCallback((e: React.DragEvent) => {
    console.log('Ending drag');
    setIsDraggingFile(false);
    setDraggedFileName(null);
    setIsOverBlackHole(false);
    
    // Reset visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  }, []);

  // Enhanced drag and drop for black hole upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isDraggingFile ? 'move' : 'copy';
    
    // Check if we're over the black hole area (bottom half of screen)
    const isInBlackHoleArea = e.clientY > window.innerHeight * 0.6;
    setIsOverBlackHole(isInBlackHoleArea && (isDraggingFile || e.dataTransfer.types.includes('Files')));
  }, [isDraggingFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if it's a file from our file browser
    const fileName = e.dataTransfer.getData('text/plain');
    if (fileName && isDraggingFile) {
      console.log('Dropping file from browser:', fileName);
      
      // Get drop position for animation
      const dropX = e.clientX;
      const dropY = e.clientY;
      
      try {
        // Fetch file from Go backend
        console.log('Fetching file content from Go backend:', fileName);
        const response = await fetch(`http://localhost:8080/files/${fileName}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });
        
        // Check file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
          throw new Error('File size exceeds 100MB limit');
        }
        
        // Add falling animation from drop position
        const fallingFile: FallingFile = {
          id: Math.random().toString(36).substr(2, 9),
          filename: fileName,
          startTime: Date.now(),
          startX: dropX,
          startY: dropY,
        };
        setFallingFiles(prev => [...prev, fallingFile]);
        
        // Upload to black hole
        await uploadFile(file);
        
        // Remove file from list after successful upload
        setFiles(prev => prev.filter(f => f !== fileName));
        
        // Show success notification
        addNotification(`${fileName} uploaded to black hole successfully!`, 'success');
        
        console.log('File successfully uploaded and removed from list');
      } catch (error) {
        console.error('File upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        addNotification(`Failed to upload ${fileName}: ${errorMessage}`, 'error');
      }
    } else {
      // Handle regular file drop (from file system)
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      if (droppedFiles.length > 0) {
        const file = droppedFiles[0];
        
        // Add falling animation
        const fallingFile: FallingFile = {
          id: Math.random().toString(36).substr(2, 9),
          filename: file.name,
          startTime: Date.now(),
          startX: e.clientX,
          startY: e.clientY,
        };
        setFallingFiles(prev => [...prev, fallingFile]);
        
        // Upload to black hole
        try {
          await uploadFile(file);
          addNotification(`${file.name} uploaded to black hole successfully!`, 'success');
        } catch (error) {
          console.error('Upload failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          addNotification(`Failed to upload ${file.name}: ${errorMessage}`, 'error');
        }
      }
    }
    
    setIsDraggingFile(false);
    setDraggedFileName(null);
    setIsOverBlackHole(false);
  }, [uploadFile, isDraggingFile]);

  const handleFileComplete = useCallback((id: string) => {
    setFallingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleEmergingFileComplete = useCallback((id: string) => {
    setEmergingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <div 
      className="flex h-screen relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={(e) => {
        // Only reset if we're leaving the main container
        if (e.currentTarget === e.target) {
          setIsOverBlackHole(false);
        }
      }}
    >
      {/* Background Effects */}
      <Stars />
      <BlackHole isHighlighted={isOverBlackHole} />
      
      {/* Sidebar - exactly like Go template */}
      <div className="w-[220px] bg-[#222] text-white p-5 relative z-20">
        <h2 className="text-lg mt-0 mb-4">Folders</h2>
        <ul className="list-none p-0 m-0">
          <li className="mb-2">🗑 Trash</li>
          <li className="mb-2">📁 Backup</li>
          <li className="mb-2 mt-6 text-purple-300">🌌 Black Hole Portal</li>
          <li className="text-sm text-gray-400">Drop files to upload</li>
          <li className="text-sm text-gray-400">Files emerge from cosmic network</li>
          {process.env.NODE_ENV === 'development' && (
            <li className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Go backend connection...');
                    const response = await fetch('http://localhost:8080/api/test');
                    const result = await response.json();
                    console.log('🧪 Go backend test result:', result);
                    addNotification(`✅ Go backend: ${result.message}`, 'success');
                  } catch (error) {
                    console.error('🧪 Go backend test failed:', error);
                    addNotification(`❌ Go backend test failed: ${error}`, 'error');
                  }
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded block w-full mb-1"
              >
                🧪 Test Go Backend
              </button>
              <button
                onClick={() => {
                  // Test file emergence with proper hex content
                  console.log('🧪 Generating test file...');
                  
                  // Create some test content (simple text "Hello from black hole!")
                  const testText = 'Hello from black hole! This is a test file.';
                  const testContent = Array.from(testText)
                    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('');
                  
                  console.log('🧪 Test text:', testText);
                  console.log('🧪 Test hex content:', testContent);
                  console.log('🧪 Hex content length:', testContent.length);
                  
                  const filename = `test-file-${Date.now()}.txt`;
                  console.log('🧪 Test filename:', filename);
                  
                  handleFileReceived(filename, testContent);
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded block w-full"
              >
                🧪 Test File Emerge
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Main content - exactly like Go template */}
      <div className="flex-grow p-5 overflow-y-auto relative z-20">
        <h1 className="text-black text-2xl mb-5">Backed Up Trash Files</h1>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-5" id="grid">
          {(() => {
            console.log('Rendering files:', files.length, files);
            return files.map((fileName, index) => (
              <div 
                key={index} 
                className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-2.5 text-center shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200"
                draggable={true}
                onDragStart={(e) => handleFileDragStart(e, fileName)}
                onDragEnd={handleFileDragEnd}
              >
                <div className="text-[32px] mb-2">📄</div>
                <a 
                  href={`http://localhost:8080/files/${fileName}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="no-underline text-[#333] text-sm break-all hover:text-blue-600 pointer-events-none"
                >
                  {fileName}
                </a>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Animations */}
      <FileFalling files={fallingFiles} onFileComplete={handleFileComplete} />

      {emergingFiles.map((file) => (
        <FileEmerging
          key={file.id}
          filename={file.filename}
          fileContent={file.fileContent}
          onComplete={() => handleEmergingFileComplete(file.id)}
          onSaveSuccess={handleFileSaveSuccess}
          onSaveError={handleFileSaveError}
        />
      ))}

      {/* Notifications */}
      <NotificationPopup 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
    </div>
  );
}
