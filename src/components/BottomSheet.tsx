import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent background scrolling when bottom sheet is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Translucent Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm lg:hidden"
          />

          {/* Swipe-to-Dismiss Bottom Sheet Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.18}
            onDragEnd={(e, info) => {
              // Dismiss if swiped down past threshold or swiped fast
              if (info.offset.y > 120 || info.velocity.y > 350) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-theme-sidebar border-t border-theme-border rounded-xl-t-3xl flex flex-col max-h-[85vh] shadow-[0_-12px_36px_rgba(0,0,0,0.18)] pb-safe lg:hidden"
          >
            {/* Native Android Bottom Sheet Style Drag Handle Tab */}
            <div className="w-12 h-1.5 bg-theme-border rounded-xl mx-auto mt-3.5 mb-2 shrink-0 opacity-80" />

            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-theme-border shrink-0">
              <h3 className="text-xs font-bold text-theme-text uppercase tracking-widest">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Inner content block */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
