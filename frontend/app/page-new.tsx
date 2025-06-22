'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Stars from '../components/Stars';
import BlackHole from '../components/BlackHole';
import FileTree from '../components/FileTree';
import FileUpload from '../components/FileUpload';
import FileFalling from '../components/FileFalling';
import FileEmerging from '../components/FileEmerging';
import ErrorPopup from '../components/ErrorPopup';
import { useBlackHoleSession } from '../hooks/useBlackHoleSession';
import { useFileTree } from '../hooks/useFileTree';
import { FallingFile, EmergingFile } from '../types';

export default function Home() {
  const { 
    sessionId, 
    isConnected, 
    error, 
    uploadFile, 
    clearError, 
    setFileReceivedCallback 
  } = useBlackHoleSession();
  
  const { 
    fileTree, 
    loading: treeLoading, 
    error: treeError, 
    getFileUrl 
  } = useFileTree();

  const [fallingFiles, setFallingFiles] = useState<FallingFile[]>([]);
  const [emergingFiles, setEmergingFiles] = useState<EmergingFile[]>([]);

  // Handle files received from the black hole
  const handleFileReceived = useCallback((filename: string, fileContent: string) => {
    const emergingFile: EmergingFile = {
      id: Math.random().toString(36).substr(2, 9),
      filename,
      fileContent,
    };
    setEmergingFiles(prev => [...prev, emergingFile]);
  }, []);

  // Set up the file received callback
  useEffect(() => {
    setFileReceivedCallback(handleFileReceived);
  }, [setFileReceivedCallback, handleFileReceived]);

  // Handle file upload to black hole
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // Add file to falling animation
      const fallingFile: FallingFile = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        startTime: Date.now(),
      };
      
      setFallingFiles(prev => [...prev, fallingFile]);
      
      // Upload file to black hole backend
      await uploadFile(file);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Upload failed:', err);
    }
  }, [uploadFile]);

  const handleFileComplete = useCallback((id: string) => {
    setFallingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleEmergingFileComplete = useCallback((id: string) => {
    setEmergingFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <Stars />
      <BlackHole />
      
      {/* Main Content */}
      <main className="relative z-30 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Cosmic File Portal
            </h1>
            <p className="text-lg text-gray-300 mb-4">
              Browse Trash Backup Files & Share Through the Black Hole
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>{isConnected ? 'Black Hole Connected' : 'Connecting to Void...'}</span>
              </div>
              <div className={`flex items-center space-x-2 ${!treeLoading ? 'text-blue-400' : 'text-yellow-400'}`}>
                <div className={`w-2 h-2 rounded-full ${!treeLoading ? 'bg-blue-400' : 'bg-yellow-400'}`} />
                <span>{!treeLoading ? 'File System Ready' : 'Loading Files...'}</span>
              </div>
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - File Browser */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="mr-3">🗂️</span>
                  Trash Backup Browser
                </h2>
                
                {treeLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading file tree...</p>
                  </div>
                )}
                
                {treeError && (
                  <div className="text-red-400 text-center py-8">
                    <p>Failed to load file tree: {treeError}</p>
                  </div>
                )}
                
                {fileTree && !treeLoading && (
                  <FileTree tree={fileTree} getFileUrl={getFileUrl} />
                )}
              </div>

              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-300">
                <h3 className="font-semibold mb-2">File Browser Features:</h3>
                <ul className="space-y-1">
                  <li>• Click files to download</li>
                  <li>• Expand folders to browse contents</li>
                  <li>• Real-time updates from trash monitoring</li>
                  <li>• Future: Drag files to Black Hole</li>
                </ul>
              </div>
            </motion.div>

            {/* Right Column - Black Hole Portal */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <span className="mr-3">🌌</span>
                  Black Hole Portal
                </h2>
                
                <FileUpload onFileUpload={handleFileUpload} isConnected={isConnected} />
              </div>

              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-300">
                <h3 className="font-semibold mb-2">Black Hole Features:</h3>
                <ul className="space-y-1">
                  <li>• Anonymous file sharing network</li>
                  <li>• Files are randomly distributed</li>
                  <li>• Receive files from other users</li>
                  <li>• Max file size: 100MB</li>
                </ul>
              </div>

              {sessionId && (
                <div className="bg-purple-900/20 backdrop-blur-sm rounded-lg p-4 text-xs text-purple-200">
                  <p><strong>Session ID:</strong> {sessionId.substring(0, 8)}...</p>
                  <p><strong>Status:</strong> {isConnected ? 'Connected to cosmic network' : 'Establishing connection...'}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

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

      {/* Error Popup */}
      <ErrorPopup error={error || treeError} onClose={clearError} />
    </div>
  );
}
