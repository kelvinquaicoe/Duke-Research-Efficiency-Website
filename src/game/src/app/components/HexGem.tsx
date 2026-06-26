import React from 'react';
import { useDrag } from 'react-dnd';
import { motion } from 'framer-motion';
import { buildHexPoints } from './hex-points';

export interface Job {
  id: string;
  type: 'gpu' | 'cpu';
  power: number;
  timeLeft: number;
  maxTime: number;
  trait?: string;
}

interface HexGemProps {
  job: Job;
}

export function HexGem({ job }: HexGemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: { job },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const isGPU = job.type === 'gpu';
  const progress = Math.max(0, job.timeLeft / job.maxTime);
  const isUrgent = progress < 0.35;
  const isCritical = progress < 0.15;

  const cx = 50, cy = 50;
  const fillR = 38;
  const ringR = 44;
  const perimeter = 6 * ringR;
  const dashLen = progress * perimeter;

  const fillPoints = buildHexPoints(cx, cy, fillR);
  const ringPoints = buildHexPoints(cx, cy, ringR);
  const glowPoints = buildHexPoints(cx, cy, ringR + 5);

  const gpuColors = { primary: '#00d4ff', mid: '#0284c7', dark: '#062d45', glow: 'rgba(0,212,255,0.35)' };
  const cpuColors = { primary: '#f59e0b', mid: '#b45309', dark: '#3d2000', glow: 'rgba(245,158,11,0.35)' };
  const colors = isGPU ? gpuColors : cpuColors;
  const timerColor = isCritical ? '#ef4444' : isUrgent ? '#f97316' : colors.primary;

  const gradId = `g-${job.id}`;
  const glowId = `gw-${job.id}`;
  const innerGlowId = `ig-${job.id}`;

  const powerPips = Math.min(5, Math.ceil(job.power / 3));

  return (
    <motion.div
      ref={drag as any}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: isDragging ? 0.25 : 1 }}
      exit={{ scale: 0.3, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', display: 'inline-block' }}
      title={`${job.type.toUpperCase()} Job — Power: ${job.power}`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg viewBox="0 0 100 100" width={88} height={88} overflow="visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.95" />
            <stop offset="45%" stopColor={colors.mid} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.dark} stopOpacity="1" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={colors.glow} result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={innerGlowId}>
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ambient glow when urgent */}
        {isUrgent && (
          <polygon
            points={glowPoints}
            fill="none"
            stroke={timerColor}
            strokeWidth="8"
            opacity="0.12"
          />
        )}

        {/* Background ring track */}
        <polygon
          points={ringPoints}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="5"
        />

        {/* Timer ring */}
        <polygon
          points={ringPoints}
          fill="none"
          stroke={timerColor}
          strokeWidth="5"
          strokeDasharray={`${dashLen} ${perimeter}`}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 0.15s linear, stroke 0.3s' }}
          filter={`url(#${glowId})`}
        />

        {/* Main hex fill */}
        <polygon points={fillPoints} fill={`url(#${gradId})`} />

        {/* Inner gem shimmer — lighter facet on top-left */}
        <polygon
          points={buildHexPoints(cx - 4, cy - 6, 18)}
          fill={colors.primary}
          opacity="0.18"
        />

        {/* Hex inner border */}
        <polygon
          points={fillPoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Power number */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="19"
          fontWeight="700"
          fontFamily="Orbitron, monospace"
          filter={`url(#${innerGlowId})`}
          style={{ textShadow: `0 0 8px ${colors.primary}` }}
        >
          {job.power}
        </text>

        {/* Power pips row */}
        {Array.from({ length: powerPips }, (_, i) => (
          <circle
            key={i}
            cx={50 + (i - (powerPips - 1) / 2) * 7}
            cy={64}
            r={2.5}
            fill={colors.primary}
            opacity={0.85}
          />
        ))}
      </svg>

      {/* Type label badge */}
      <div
        style={{
          textAlign: 'center',
          marginTop: -4,
          fontSize: 9,
          fontFamily: 'Orbitron, monospace',
          letterSpacing: '0.12em',
          color: colors.primary,
          textShadow: `0 0 8px ${colors.glow}`,
          fontWeight: 700,
        }}
      >
        {job.type.toUpperCase()}
      </div>
    </motion.div>
  );
}
