import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error';
  onClose?: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border text-xs font-semibold',
            type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300',
          )}
        >
          {type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message}</span>
          {onClose && (
            <button onClick={onClose} className="mr-2 p-0.5 hover:opacity-70 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
