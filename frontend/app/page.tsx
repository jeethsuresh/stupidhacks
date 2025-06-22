'use client';

import { useState, useEffect, useCallback } from 'react';
import Stars from '../components/Stars';
import BlackHole from '../components/BlackHole';
import FileFalling from '../components/FileFalling';
import FileEmerging from '../components/FileEmerging';
import { useBlackHoleSession } from '../hooks/useBlackHoleSession';
import { FallingFile, EmergingFile } from '../types';

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<string[]>([]);
  
  const { uploadFile, setFileReceivedCallback } = useBlackHoleSession();
  const [fallingFiles, setFallingFiles] = useState<FallingFile[]>([]);
  const [emergingFiles, setEmergingFiles] = useState<EmergingFile[]>([]);

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
    const emergingFile: EmergingFile = {
      id: Math.random().toString(36).substr(2, 9),
      filename,
      fileContent,
    };
    setEmergingFiles(prev => [...prev, emergingFile]);
  }, []);

  useEffect(() => {
    setFileReceivedCallback(handleFileReceived);
  }, [setFileReceivedCallback, handleFileReceived]);

  // Handle drag and drop for black hole upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      
      // Add falling animation
      const fallingFile: FallingFile = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        startTime: Date.now(),
      };
      setFallingFiles(prev => [...prev, fallingFile]);
      
      // Upload to black hole
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [uploadFile]);

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
    >
      {/* Background Effects */}
      <Stars />
      <BlackHole />
      
      {/* Sidebar - exactly like Go template */}
      <div className="w-[220px] bg-[#222] text-white p-5 relative z-20">
        <h2 className="text-lg mt-0 mb-4">Folders</h2>
        <ul className="list-none p-0 m-0">
          <li className="mb-2">🗑 Trash</li>
          <li className="mb-2">📁 Backup</li>
          <li className="mb-2 mt-6 text-purple-300">🌌 Black Hole Portal</li>
          <li className="text-sm text-gray-400">Drop files anywhere to upload</li>
        </ul>
      </div>

      {/* Main content - exactly like Go template */}
      <div className="flex-grow p-5 overflow-y-auto relative z-20">
        <h1 className="text-black text-2xl mb-5">Backed Up Trash Files</h1>
        
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-5" id="grid">
          {(() => {
            console.log('Rendering files:', files.length, files);
            return files.map((fileName, index) => (
              <div key={index} className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-2.5 text-center shadow-sm">
                <div className="text-[32px] mb-2">📄</div>
                <a 
                  href={`http://localhost:8080/files/${fileName}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="no-underline text-[#333] text-sm break-all hover:text-blue-600"
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
        />
      ))}
    </div>
  );
}
