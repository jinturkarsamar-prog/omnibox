import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Check, Sparkles, AlertCircle, X, RotateCcw, ExternalLink } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'quick-save' | 'enriched' | 'info' | 'error';
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  onUndo?: () => void;
  duration?: number; // ms
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'quick-save':
        return <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20 animate-pulse" />;
      case 'enriched':
        return <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Check className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="pointer-events-auto relative overflow-hidden rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl p-4 text-white font-sans flex flex-col gap-2"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5 leading-tight">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(toast.onAction || toast.onUndo) && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/80">
          {toast.onUndo && (
            <button
              onClick={() => {
                toast.onUndo?.();
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          )}
          {toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
              className="px-3 py-1 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1"
            >
              {toast.actionText || 'View'}
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Progress Bar Animation */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-amber-500 opacity-60"
      />
    </motion.div>
  );
};
