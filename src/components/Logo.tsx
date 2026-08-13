import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)] select-none hover:scale-105 transition-transform duration-300"
      >
        <defs>
          {/* Neon Gradients */}
          <linearGradient id="infinityGrad" x1="16" y1="54" x2="84" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" /> {/* Electric Neon Blue */}
            <stop offset="50%" stopColor="#a855f7" /> {/* Cyber Purple */}
            <stop offset="100%" stopColor="#f43f5e" /> {/* Cyber Pink/Rose */}
          </linearGradient>

          <linearGradient id="cubeTopGrad" x1="24" y1="18" x2="76" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="cubeLeftGrad" x1="24" y1="33" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="cubeRightGrad" x1="50" y1="48" x2="76" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9d174d" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.1" />
          </linearGradient>

          {/* Glowing Filter */}
          <filter id="neonGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 3D CUBE CONTAINER */}
        {/* Cube Faces with translucent glassmorphism fill */}
        {/* Top Face */}
        <polygon
          points="50,45 76,30 50,15 24,30"
          fill="url(#cubeTopGrad)"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeOpacity="0.4"
          className="animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        {/* Left Face */}
        <polygon
          points="50,45 24,30 24,64 50,79"
          fill="url(#cubeLeftGrad)"
          stroke="#1d4ed8"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* Right Face */}
        <polygon
          points="50,45 76,30 76,64 50,79"
          fill="url(#cubeRightGrad)"
          stroke="#be185d"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* 3D Wireframe inner glowing lines */}
        <line x1="50" y1="45" x2="50" y2="79" stroke="url(#infinityGrad)" strokeWidth="1.2" strokeOpacity="0.45" />
        <line x1="50" y1="45" x2="24" y2="30" stroke="url(#infinityGrad)" strokeWidth="1.2" strokeOpacity="0.35" />
        <line x1="50" y1="45" x2="76" y2="30" stroke="url(#infinityGrad)" strokeWidth="1.2" strokeOpacity="0.35" />

        {/* Outer glowing hexagonal silhouette */}
        <polygon
          points="50,15 76,30 76,64 50,79 24,64 24,30"
          fill="none"
          stroke="url(#infinityGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />

        {/* CUBE TOP: Small Video Play Icon */}
        <g transform="translate(43.4, 21.4) scale(0.55)" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85">
          <polygon points="6 4 18 12 6 20 6 4" fill="#3b82f6" fillOpacity="0.3" />
        </g>

        {/* THE INFINITY SYMBOL OVERLAY (The Neon Glass Tube) */}
        {/* Thick Outer Glow Path */}
        <path
          d="M 50 54 C 34 32, 16 32, 16 54 C 16 76, 34 76, 50 54 C 66 32, 84 32, 84 54 C 84 76, 66 76, 50 54 Z"
          fill="none"
          stroke="url(#infinityGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonGlow)"
          opacity="0.85"
        />
        {/* White neon center core light */}
        <path
          d="M 50 54 C 34 32, 16 32, 16 54 C 16 76, 34 76, 50 54 C 66 32, 84 32, 84 54 C 84 76, 66 76, 50 54 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* INFINITY LEFT LOOP CENTER: Link Icon */}
        <g transform="translate(23.4, 47.4) scale(0.55)" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </g>

        {/* INFINITY RIGHT LOOP CENTER: Image/Gallery Icon */}
        <g transform="translate(63.4, 47.4) scale(0.55)" stroke="#ffe4e6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </g>
      </svg>
    </div>
  );
};
