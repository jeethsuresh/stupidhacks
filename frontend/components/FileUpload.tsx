'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isConnected: boolean;
}

export default function FileUpload({ onFileUpload, isConnected }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        onFileUpload(target.files[0]);
      }
    };
    input.click();
  }, [onFileUpload]);

  return (
    <motion.div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragOver
          ? 'border-purple-400 bg-purple-900/20'
          : isConnected
          ? 'border-purple-500 bg-purple-900/10 hover:bg-purple-900/20'
          : 'border-gray-500 bg-gray-800/10'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={isConnected ? handleClick : undefined}
      whileHover={isConnected ? { scale: 1.02 } : {}}
      whileTap={isConnected ? { scale: 0.98 } : {}}
    >
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          className="text-6xl"
          animate={isDragOver ? { scale: 1.2 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🌌
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            {isConnected ? 'Drop files into the Black Hole' : 'Connecting to the void...'}
          </h3>
          
          {isConnected ? (
            <p className="text-gray-300">
              Click here or drag and drop files to share them anonymously
            </p>
          ) : (
            <p className="text-gray-400">
              Establishing connection to the cosmic network...
            </p>
          )}
        </div>

        {isDragOver && (
          <motion.div
            className="absolute inset-0 border-2 border-purple-400 rounded-lg bg-purple-400/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
    </motion.div>
  );
}
