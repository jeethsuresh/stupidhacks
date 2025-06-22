'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface FileEmergingProps {
  filename: string;
  fileContent: string;
  onComplete: () => void;
}

export default function FileEmerging({ filename, fileContent, onComplete }: FileEmergingProps) {
  useEffect(() => {
    // Auto-download the file
    const downloadFile = () => {
      try {
        // Convert hex string back to binary
        const bytes = new Uint8Array(
          fileContent.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
        
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download file:', error);
      }
    };

    // Start download after animation begins
    const timer = setTimeout(downloadFile, 1000);
    
    return () => clearTimeout(timer);
  }, [filename, fileContent]);

  const blackHoleX = window.innerWidth / 2;
  const blackHoleY = window.innerHeight * 0.85;
  const targetX = Math.random() * (window.innerWidth - 200) + 100;
  const targetY = Math.random() * 200 + 50;

  return (
    <motion.div
      className="fixed z-20 pointer-events-none"
      initial={{
        x: blackHoleX,
        y: blackHoleY,
        scale: 0,
        opacity: 0,
      }}
      animate={{
        x: targetX,
        y: targetY,
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
      transition={{
        duration: 2,
        ease: "easeOut",
      }}
      onAnimationComplete={() => {
        // Keep visible for a moment then fade out
        setTimeout(() => onComplete(), 3000);
      }}
    >
      <motion.div
        className="bg-green-500/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-green-300"
        animate={{
          boxShadow: [
            '0 0 10px rgba(34, 197, 94, 0.5)',
            '0 0 20px rgba(34, 197, 94, 0.8)',
            '0 0 10px rgba(34, 197, 94, 0.5)',
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
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⭐
          </motion.span>
          <div className="text-sm font-medium text-white max-w-32 truncate">
            {filename}
          </div>
        </div>
        <div className="text-xs text-green-100 mt-1">
          Emerging from the void...
        </div>
      </motion.div>

      {/* Emerging particles */}
      <motion.div className="absolute inset-0 -z-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400 rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, (Math.cos(i * Math.PI / 4) * 30)],
              y: [0, (Math.sin(i * Math.PI / 4) * 30)],
              opacity: [1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
