'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function BlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawBlackHole = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.85; // Position near bottom
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;

      // Create spiral effect
      const spiralTurns = 3;
      const steps = 200;

      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const angle = rotation + progress * spiralTurns * Math.PI * 2;
        const radius = maxRadius * (1 - progress);
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * 0.3; // Flatten the spiral

        // Create gradient effect
        const opacity = 1 - progress;
        const hue = 280 + progress * 40; // Purple to blue
        
        ctx.save();
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillStyle = `hsl(${hue}, 80%, ${30 + progress * 20}%)`;
        ctx.beginPath();
        ctx.arc(x, y, (1 - progress) * 3 + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Create event horizon (center black circle)
      const eventHorizonRadius = maxRadius * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Add accretion disk glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, eventHorizonRadius,
        centerX, centerY, maxRadius
      );
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)'); // Purple
      gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.2)'); // Indigo
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      rotation += 0.005; // Slow rotation
      animationId = requestAnimationFrame(drawBlackHole);
    };

    resizeCanvas();
    drawBlackHole();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
}
