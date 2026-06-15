import React from 'react';
import { buildHexPoints } from './hex-points';

export function GameLogo({ size = 'normal' }: { size?: 'normal' | 'large' }) {
  const scale = size === 'large' ? 1.6 : 1;
  const w = Math.round(48 * scale);
  const h = Math.round(48 * scale);

  // Hex shell centered at (24, 22), R=18
  const sx = 24, sy = 22, sr = 18;
  const shellPoints = buildHexPoints(sx, sy, sr, { precision: 1 });
  const innerPoints = buildHexPoints(sx, sy, sr * 0.5, { precision: 1 });

  return (
    <svg viewBox="0 0 48 48" width={w} height={h}>
      <defs>
        <linearGradient id="logoShell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="logoBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7ecfb3" />
          <stop offset="100%" stopColor="#4fa89e" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Hex shell */}
      <polygon points={shellPoints} fill="url(#logoShell)" filter="url(#logoGlow)" />
      <polygon points={innerPoints} fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.5" />
      <circle cx={sx} cy={sy} r="3.5" fill="#c084fc" opacity="0.8" />

      {/* Body peeking out from shell right side */}
      <ellipse cx="37" cy="33" rx="9" ry="7" fill="url(#logoBody)" />
      {/* Head */}
      <ellipse cx="43" cy="31" rx="6" ry="5.5" fill="url(#logoBody)" />
      {/* Foot */}
      <ellipse cx="36" cy="38" rx="11" ry="4" fill="url(#logoBody)" opacity="0.6" />

      {/* Antenna left */}
      <line x1="41" y1="27" x2="37" y2="19" stroke="#7ecfb3" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="37" cy="18" r="2" fill="#00d4ff" />
      {/* Antenna right */}
      <line x1="45" y1="27" x2="44" y2="19" stroke="#7ecfb3" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="44" cy="18" r="2" fill="#00d4ff" />

      {/* Eye */}
      <circle cx="46" cy="30" r="3" fill="#0d1424" />
      <circle cx="47" cy="29" r="1" fill="white" />
    </svg>
  );
}
