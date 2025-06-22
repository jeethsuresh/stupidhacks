'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ErrorPopupProps {
  error: string | null;
  onClose: () => void;
}

export default function ErrorPopup({ error, onClose }: ErrorPopupProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Error Modal */}
          <motion.div
            className="relative bg-red-900/90 backdrop-blur-sm border border-red-500 rounded-lg p-6 max-w-md w-full shadow-2xl"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Cosmic Disturbance Detected
                </h3>
                <p className="text-red-100 text-sm leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <motion.button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Acknowledge
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
