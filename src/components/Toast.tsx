import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, X } from 'lucide-react';

interface ToastProps {
  toast: { message: string, type: 'success' | 'error' } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 border ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-red-500 text-white border-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckSquare size={20} /> : <X size={20} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
