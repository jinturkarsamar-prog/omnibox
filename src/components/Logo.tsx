import React from 'react';
import omniboxLogo from '../assets/omnibox-logo.png';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Renders the bundled OmniBox PNG emblem.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={omniboxLogo}
        alt="OmniBox"
        width={size}
        height={size}
        draggable={false}
        className="w-full h-full object-contain drop-shadow-[0_3px_10px_rgba(59,130,246,0.28)] transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
};
