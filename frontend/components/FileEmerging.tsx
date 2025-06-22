'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FileEmergingProps {
  filename: string;
  fileContent: string;
  onComplete: () => void;
  onSaveSuccess?: (filename: string) => void;
  onSaveError?: (filename: string, error: string) => void;
}

export default function FileEmerging({ 
  filename, 
  fileContent, 
  onComplete, 
  onSaveSuccess, 
  onSaveError 
}: FileEmergingProps) {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'success' | 'error'>('saving');

  useEffect(() => {
    // Save file to Go backend immediately
    const saveFileToBackend = async () => {
      try {
        console.log('💾 Starting file save to Go backend');
        console.log('💾 Filename:', filename);
        console.log('💾 File content length:', fileContent.length);
        console.log('💾 File content preview (first 50 chars):', fileContent.substring(0, 50));
        
        const requestBody = {
          filename: filename,
          fileContent: fileContent,
        };
        
        console.log('💾 Request body:', requestBody);
        
        const response = await fetch('http://localhost:8080/api/save-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('💾 Response status:', response.status);
        console.log('💾 Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('💾 Error response body:', errorText);
          throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
        }

        const result = await response.json();
        console.log('💾 File saved successfully:', result);
        
        setSaveStatus('success');
        onSaveSuccess?.(filename);
      } catch (error) {
        console.error('💾 Failed to save file:', error);
        setSaveStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Save failed';
        onSaveError?.(filename, errorMessage);
      }
    };

    // Start saving after a brief delay
    const timer = setTimeout(saveFileToBackend, 500);
    
    return () => clearTimeout(timer);
  }, [filename, fileContent, onSaveSuccess, onSaveError]);

  // Black hole position (center bottom)
  const blackHoleX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  const blackHoleY = typeof window !== 'undefined' ? window.innerHeight * 0.85 : 600;
  
  // Random target position (spiral out from black hole)
  const angle = Math.random() * Math.PI * 2;
  const distance = 200 + Math.random() * 300;
  const targetX = blackHoleX + Math.cos(angle) * distance;
  const targetY = blackHoleY + Math.sin(angle) * distance * 0.5; // Flatten vertically

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving': return 'bg-blue-500/90 border-blue-300';
      case 'success': return 'bg-green-500/90 border-green-300';
      case 'error': return 'bg-red-500/90 border-red-300';
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Materializing...';
      case 'success': return 'Saved to backup!';
      case 'error': return 'Save failed!';
    }
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving': return '🌀';
      case 'success': return '📁';
      case 'error': return '⚠️';
    }
  };

  return (
    <motion.div
      className="fixed z-20 pointer-events-none"
      initial={{
        x: blackHoleX,
        y: blackHoleY,
        scale: 0,
        opacity: 0,
        rotate: 0,
      }}
      animate={{
        x: [
          blackHoleX,
          blackHoleX + (targetX - blackHoleX) * 0.3 + 30 * Math.sin(0),
          blackHoleX + (targetX - blackHoleX) * 0.6 + 20 * Math.sin(Math.PI),
          blackHoleX + (targetX - blackHoleX) * 0.9 + 10 * Math.sin(2 * Math.PI),
          targetX,
        ],
        y: [
          blackHoleY,
          blackHoleY + (targetY - blackHoleY) * 0.3,
          blackHoleY + (targetY - blackHoleY) * 0.6,
          blackHoleY + (targetY - blackHoleY) * 0.9,
          targetY,
        ],
        scale: [0, 0.5, 0.8, 1, 1],
        opacity: [0, 0.7, 0.9, 1, 1],
        rotate: [0, 90, 180, 270, 360],
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
      transition={{
        duration: 3,
        ease: "easeOut",
        times: [0, 0.3, 0.6, 0.9, 1],
      }}
      onAnimationComplete={() => {
        // Keep visible for a moment then fade out
        setTimeout(() => onComplete(), 2000);
      }}
    >
      <motion.div
        className={`${getStatusColor()} backdrop-blur-sm rounded-lg p-3 shadow-lg`}
        animate={{
          boxShadow: [
            '0 0 10px rgba(147, 51, 234, 0.5)',
            '0 0 20px rgba(147, 51, 234, 0.8)',
            '0 0 10px rgba(147, 51, 234, 0.5)',
          ],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      >
        <div className="flex items-center space-x-2">
          <motion.span
            className="text-2xl"
            animate={{ 
              rotate: saveStatus === 'saving' ? [0, 360] : 0,
              scale: saveStatus === 'success' ? [1, 1.2, 1] : 1,
            }}
            transition={{ 
              duration: saveStatus === 'saving' ? 1 : 0.5, 
              repeat: saveStatus === 'saving' ? Infinity : 0 
            }}
          >
            {getStatusIcon()}
          </motion.span>
          <div className="text-sm font-medium text-white max-w-32 truncate">
            {filename}
          </div>
        </div>
        <div className="text-xs text-white/80 mt-1">
          {getStatusText()}
        </div>
      </motion.div>

      {/* Emerging particles */}
      <motion.div className="absolute inset-0 -z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, (Math.cos(i * Math.PI / 3) * 40)],
              y: [0, (Math.sin(i * Math.PI / 3) * 40)],
              opacity: [1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
