'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FallingFile } from '../types';

interface FileFallingProps {
  files: FallingFile[];
  onFileComplete: (id: string) => void;
}

interface AnimatedFile extends FallingFile {
  x: number;
  targetX: number;
  targetY: number;
}

export default function FileFalling({ files, onFileComplete }: FileFallingProps) {
  const [animatedFiles, setAnimatedFiles] = useState<AnimatedFile[]>([]);

  useEffect(() => {
    const newAnimatedFiles = files.map(file => {
      const existing = animatedFiles.find(af => af.id === file.id);
      if (existing) return existing;

      // Random starting position at top of screen
      const x = Math.random() * (window.innerWidth - 100);
      const targetX = window.innerWidth / 2; // Center of black hole
      const targetY = window.innerHeight * 0.85; // Black hole position

      return {
        ...file,
        x,
        targetX,
        targetY,
      };
    });

    setAnimatedFiles(newAnimatedFiles);
  }, [files, animatedFiles]);

  return (
    <AnimatePresence>
      {animatedFiles.map((file) => (
        <motion.div
          key={file.id}
          className="fixed z-20 pointer-events-none"
          initial={{
            x: file.x,
            y: -50,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: file.targetX,
            y: file.targetY,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 3,
            ease: "easeIn",
          }}
          onAnimationComplete={() => onFileComplete(file.id)}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-purple-300">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📄</span>
              <div className="text-sm font-medium text-gray-800 max-w-32 truncate">
                {file.filename}
              </div>
            </div>
          </div>
          
          {/* Trailing particles */}
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-400 rounded-full"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${40 + i * 20}%`,
                }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [1, 0, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
