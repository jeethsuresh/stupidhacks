'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FallingFile } from '../types';

interface FileFallingProps {
  files: FallingFile[];
  onFileComplete: (id: string) => void;
}

interface AnimatedFile extends FallingFile {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

export default function FileFalling({ files, onFileComplete }: FileFallingProps) {
  const [animatedFiles, setAnimatedFiles] = useState<AnimatedFile[]>([]);

  useEffect(() => {
    const newAnimatedFiles = files.map(file => {
      const existing = animatedFiles.find(af => af.id === file.id);
      if (existing) return existing;

      // Use provided start position, or default to random position at top
      const startX = file.startX ?? Math.random() * (window.innerWidth - 100);
      const startY = file.startY ?? -50;
      const targetX = window.innerWidth / 2; // Center of black hole
      const targetY = window.innerHeight * 0.85; // Black hole position

      return {
        ...file,
        startX,
        startY,
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
            x: file.startX,
            y: file.startY,
            scale: 1,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: [
              file.startX,
              file.startX + (file.targetX - file.startX) * 0.3 + 50 * Math.sin(0),
              file.startX + (file.targetX - file.startX) * 0.6 + 30 * Math.sin(Math.PI),
              file.targetX + 15 * Math.sin(2 * Math.PI),
              file.targetX,
            ],
            y: [
              file.startY,
              file.startY + (file.targetY - file.startY) * 0.3,
              file.startY + (file.targetY - file.startY) * 0.6,
              file.startY + (file.targetY - file.startY) * 0.9,
              file.targetY,
            ],
            scale: [1, 0.8, 0.6, 0.3, 0],
            opacity: [1, 0.9, 0.7, 0.4, 0],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 3,
            ease: "easeIn",
            times: [0, 0.3, 0.6, 0.9, 1],
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
