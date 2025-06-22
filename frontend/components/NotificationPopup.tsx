'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface NotificationPopupProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationPopup({ notifications, onDismiss }: NotificationPopupProps) {
  useEffect(() => {
    notifications.forEach(notification => {
      const duration = notification.duration ?? 3000; // Default 3 seconds
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, onDismiss]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`
              ${getColors(notification.type)}
              px-4 py-3 border rounded-lg shadow-lg backdrop-blur-sm
              min-w-64 max-w-80 cursor-pointer
              hover:scale-105 transition-transform duration-200
            `}
            onClick={() => onDismiss(notification.id)}
          >
            <div className="flex items-start space-x-3">
              <span className="text-lg flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Click to dismiss
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
