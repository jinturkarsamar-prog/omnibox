import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'motion/react';
import { Trash2, FolderOpen } from 'lucide-react';

interface SwipeableItemProps {
  id: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  id,
  onSwipeLeft,
  onSwipeRight,
  children,
  disabled = false,
}) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const triggerThreshold = 120; // Threshold in pixels to activate the swipe trigger
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Transform scale/opacity of the backdrops based on the horizontal displacement
  const leftBgOpacity = useTransform(x, [0, triggerThreshold], [0, 1]);
  const rightBgOpacity = useTransform(x, [-triggerThreshold, 0], [1, 0]);

  const hasVibratedRef = useRef(false);

  const handleDrag = () => {
    const currentX = x.get();
    if (currentX > 30) {
      setSwipeDirection('right');
    } else if (currentX < -30) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }

    // Trigger haptic feedback vibration when crossing triggerThreshold
    if (Math.abs(currentX) >= triggerThreshold) {
      if (!hasVibratedRef.current) {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          try {
            window.navigator.vibrate(40); // 40ms light satisfying vibration haptic tick
          } catch (e) {
            // Ignored if browser blocks automatic vibration
          }
        }
        hasVibratedRef.current = true;
      }
    } else {
      hasVibratedRef.current = false;
    }
  };

  const handleDragEnd = async (event: any, info: any) => {
    const finalX = info.offset.x;
    hasVibratedRef.current = false;

    if (finalX > triggerThreshold) {
      // Swiped right -> Folder Selection / Archive action
      await controls.start({ x: '100%', opacity: 0, transition: { duration: 0.2 } });
      onSwipeRight();
      // Snap back for future rendering
      controls.set({ x: 0, opacity: 1 });
    } else if (finalX < -triggerThreshold) {
      // Swiped left -> Move to Trash
      await controls.start({ x: '-100%', opacity: 0, transition: { duration: 0.2 } });
      onSwipeLeft();
      // Snap back for future rendering
      controls.set({ x: 0, opacity: 1 });
    } else {
      // No threshold met, bounce back
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', damping: 20, stiffness: 200 } });
    }
    setSwipeDirection(null);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-xl w-full break-inside-avoid">
      {/* Slide Underlays */}
      {/* Left Underlay (revealed on Swipe Right) */}
      <motion.div
        style={{ opacity: leftBgOpacity }}
        className="absolute inset-0 bg-emerald-600 dark:bg-emerald-700 flex items-center justify-start pl-5 text-white rounded-xl pointer-events-none z-0"
      >
        <div className="flex items-center space-x-2.5 font-bold text-xs uppercase tracking-wider">
          <FolderOpen size={16} className="animate-bounce" />
          <span>Assign Folder</span>
        </div>
      </motion.div>

      {/* Right Underlay (revealed on Swipe Left) */}
      <motion.div
        style={{ opacity: rightBgOpacity }}
        className="absolute inset-0 bg-rose-600 dark:bg-rose-700 flex items-center justify-end pr-5 text-white rounded-xl pointer-events-none z-0"
      >
        <div className="flex items-center space-x-2.5 font-bold text-xs uppercase tracking-wider">
          <span>Trash Item</span>
          <Trash2 size={16} className="animate-bounce" />
        </div>
      </motion.div>

      {/* Draggable Foreground */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.4, right: 0.4 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="relative z-10 w-full touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
