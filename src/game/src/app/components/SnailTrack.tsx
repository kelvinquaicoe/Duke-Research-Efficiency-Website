import React from 'react';
import { motion } from 'motion/react';
import { buildHexPoints } from './hex-points';

interface SnailTrackProps {
  progress: number; // 0-100
  efficiency: number; // 0-100
  level: number;
}

function SnailSVG({ mood }: { mood: 'happy' | 'stressed' | 'neutral' }) {
  const bodyColor = mood === 'happy' ? '#7ecfb3' : mood === 'stressed' ? '#e88c6c' : '#8ab4c0';
  const shellPrimary = mood === 'happy' ? '#a855f7' : mood === 'stressed' ? '#e85c5c' : '#7c3aed';
  const shellAccent = mood === 'happy' ? '#c084fc' : mood === 'stressed' ? '#fca5a5' : '#a78bfa';
  const eyeGlow = mood === 'happy' ? '#10b981' : mood === 'stressed' ? '#ef4444' : '#00d4ff';

  // Build hex shell points centered on the shell center (cx=30, cy=22)
  const sx = 30, sy = 22, sr = 16;
  const shellPoints = buildHexPoints(sx, sy, sr, { precision: 1 });
  const innerShellPoints = buildHexPoints(sx, sy, sr * 0.55, { precision: 1 });

  return (
    <svg viewBox="0 0 90 55" width={58} height={36}>
      <defs>
        <linearGradient id="shellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shellAccent} />
          <stop offset="100%" stopColor={shellPrimary} />
        </linearGradient>
        <filter id="snailGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Body */}
      <ellipse cx="52" cy="36" rx="22" ry="11" fill={bodyColor} />
      {/* Head */}
      <ellipse cx="72" cy="34" rx="11" ry="9" fill={bodyColor} />
      {/* Foot */}
      <ellipse cx="50" cy="44" rx="24" ry="5" fill={bodyColor} opacity="0.6" />

      {/* Antenna left */}
      <line x1="69" y1="27" x2="63" y2="14" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="63" cy="13" r="3" fill={eyeGlow} />
      {/* Antenna right */}
      <line x1="76" y1="26" x2="74" y2="13" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="74" cy="12" r="3" fill={eyeGlow} />

      {/* Eye */}
      <circle cx="76" cy="31" r="4" fill="#1a1a2e" />
      <circle cx="77" cy="30" r="1.5" fill="white" />

      {/* Hex shell */}
      <polygon
        points={shellPoints}
        fill="url(#shellGrad)"
        filter="url(#snailGlow)"
      />
      {/* Shell inner hex */}
      <polygon
        points={innerShellPoints}
        fill="none"
        stroke={shellAccent}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Shell center dot */}
      <circle cx={sx} cy={sy} r="3" fill={shellAccent} opacity="0.7" />

      {/* Smile when happy */}
      {mood === 'happy' && (
        <path d="M72 37 Q76 40 80 37" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SnailTrack({ progress, efficiency, level }: SnailTrackProps) {
  const mood = efficiency >= 70 ? 'happy' : efficiency < 40 ? 'stressed' : 'neutral';
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div style={{
      background: 'rgba(13,24,48,0.9)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      position: 'relative',
    }}>
      {/* Level label */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: 10,
        color: '#64748b',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        minWidth: 52,
      }}>
        LVL {level}
      </div>

      {/* Track */}
      <div style={{ flex: 1, position: 'relative', height: 40, display: 'flex', alignItems: 'center' }}>
        {/* Track line */}
        <div style={{
          position: 'absolute', left: 28, right: 28, height: 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #a855f7, #00d4ff)',
              borderRadius: 3,
              boxShadow: '0 0 8px rgba(168,85,247,0.6)',
            }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>

        {/* Start flag */}
        <div style={{ position: 'absolute', left: 0, fontSize: 18 }}>🏁</div>

        {/* Snail */}
        <motion.div
          style={{ position: 'absolute', bottom: 2 }}
          animate={{ left: `calc(${clampedProgress}% - 20px)` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        >
          <motion.div
            animate={mood === 'happy' ? { y: [0, -3, 0] } : mood === 'stressed' ? { rotate: [-2, 2, -2] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <SnailSVG mood={mood} />
          </motion.div>
        </motion.div>

        {/* End flag */}
        <div style={{ position: 'absolute', right: 0, fontSize: 18 }}>⭐</div>
      </div>

      {/* Progress % */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: 11,
        color: '#a855f7',
        fontWeight: 700,
        minWidth: 40,
        textAlign: 'right',
      }}>
        {Math.round(clampedProgress)}%
      </div>
    </div>
  );
}
