import { motion } from 'motion/react';
import livexLogoUrl from '../assets/livex-logo.png';

export function SpotlightLogo({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-[220px] aspect-square cursor-pointer touch-manipulation flex items-center justify-center select-none"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onClick?.()}
      role="button"
      tabIndex={0}
      aria-label="Livex"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <img
        src={livexLogoUrl}
        alt="Livex"
        width={220}
        height={220}
        className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
        draggable={false}
      />
    </motion.div>
  );
}
