import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import type { Job } from './HexGem';

export interface Node {
  id: string;
  name: string;
  type: 'gpu' | 'cpu';
  maxPower: number;
  currentPower: number;
  status: 'idle' | 'busy' | 'failed' | 'maintenance';
  busyUntil: number;
  trait: string;
  traitColor: string;
}

interface EfficiencyFlash {
  value: number;
  good: boolean;
}

interface NodeCardProps {
  node: Node;
  onAssign: (job: Job, node: Node) => void;
}

export function NodeCard({ node, onAssign }: NodeCardProps) {
  const [flash, setFlash] = useState<EfficiencyFlash | null>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'JOB',
    canDrop: () => node.status === 'idle',
    drop: (item: { job: Job }) => {
      const typeMatch = item.job.type === node.type;
      const powerRatio = Math.min(item.job.power, node.currentPower) / Math.max(item.job.power, node.currentPower);
      const eff = typeMatch ? Math.round(50 + powerRatio * 50) : Math.round(powerRatio * 35);
      setFlash({ value: eff, good: eff >= 60 });
      setTimeout(() => setFlash(null), 1400);
      onAssign(item.job, node);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isGPU = node.type === 'gpu';
  const typeColor = isGPU ? '#00d4ff' : '#f59e0b';
  const typeGlow = isGPU ? 'rgba(0,212,255,0.2)' : 'rgba(245,158,11,0.2)';
  const typeDark = isGPU ? 'rgba(0,212,255,0.06)' : 'rgba(245,158,11,0.06)';

  const statusColor =
    node.status === 'idle' ? '#10b981' :
    node.status === 'busy' ? '#f59e0b' :
    node.status === 'failed' ? '#ef4444' :
    '#f97316';

  const statusLabel =
    node.status === 'idle' ? 'READY' :
    node.status === 'busy' ? 'BUSY' :
    node.status === 'failed' ? 'FAILED' :
    'MAINT';

  const isActive = isOver && canDrop;
  const isBadDrop = isOver && !canDrop;

  const borderColor = isActive ? typeColor : isBadDrop ? '#ef4444' : 'rgba(255,255,255,0.08)';
  const bgColor = isActive ? typeGlow : isBadDrop ? 'rgba(239,68,68,0.08)' : typeDark;

  const powerPct = node.currentPower / node.maxPower;
  const powerBars = 5;

  return (
    <motion.div
      ref={drop as any}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        borderRadius: 12,
        padding: '14px 16px',
        width: 190,
        minHeight: 160,
        position: 'relative',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: isActive ? `0 0 20px ${typeGlow}, inset 0 0 20px ${typeGlow}` : 'none',
        cursor: node.status === 'idle' ? 'default' : 'not-allowed',
        overflow: 'hidden',
      }}
    >
      {/* Ambient corner glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 60, height: 60,
        background: `radial-gradient(circle at top right, ${typeGlow}, transparent)`,
        borderRadius: '0 12px 0 0', pointerEvents: 'none',
      }} />

      {/* Node name + type badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 12,
          fontWeight: 700,
          color: '#e2e8f0',
          letterSpacing: '0.05em',
        }}>
          {node.name}
        </span>
        <span style={{
          background: isGPU ? 'rgba(0,212,255,0.15)' : 'rgba(245,158,11,0.15)',
          border: `1px solid ${typeColor}44`,
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 9,
          fontFamily: 'Orbitron, monospace',
          color: typeColor,
          letterSpacing: '0.1em',
          fontWeight: 700,
        }}>
          {node.type.toUpperCase()}
        </span>
      </div>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
          animation: node.status === 'idle' ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: 10, fontFamily: 'Orbitron, monospace', color: statusColor, letterSpacing: '0.1em' }}>
          {statusLabel}
        </span>
      </div>

      {/* Power bars */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>POWER</span>
          <span style={{ fontSize: 11, fontFamily: 'Orbitron, monospace', color: typeColor, fontWeight: 700 }}>
            {node.currentPower}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: powerBars }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                background: i < Math.round(powerPct * powerBars)
                  ? typeColor
                  : 'rgba(255,255,255,0.08)',
                boxShadow: i < Math.round(powerPct * powerBars) ? `0 0 4px ${typeColor}` : 'none',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Trait badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: `${node.traitColor}18`,
        border: `1px solid ${node.traitColor}44`,
        borderRadius: 6,
        padding: '3px 8px',
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: node.traitColor }} />
        <span style={{ fontSize: 10, color: node.traitColor, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          {node.trait}
        </span>
      </div>

      {/* Drop hint when hovering */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute', inset: 0, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${typeGlow}`,
            backdropFilter: 'blur(2px)',
          }}
        >
          <span style={{
            fontFamily: 'Orbitron, monospace', fontSize: 12, fontWeight: 700,
            color: typeColor, letterSpacing: '0.08em',
          }}>
            DROP JOB
          </span>
        </motion.div>
      )}

      {/* Busy progress overlay */}
      {node.status === 'busy' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 12px 12px',
          background: 'rgba(245,158,11,0.15)',
          overflow: 'hidden',
        }}>
          <motion.div
            style={{ height: '100%', background: '#f59e0b', borderRadius: '0 0 12px 12px' }}
            animate={{ width: ['100%', '0%'] }}
            transition={{ duration: (node.busyUntil - Date.now()) / 1000, ease: 'linear' }}
          />
        </div>
      )}

      {/* Efficiency flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              fontFamily: 'Orbitron, monospace',
              fontSize: 20,
              fontWeight: 900,
              color: flash.good ? '#10b981' : '#f97316',
              textShadow: flash.good ? '0 0 16px #10b981' : '0 0 16px #f97316',
              pointerEvents: 'none',
              letterSpacing: '0.05em',
            }}
          >
            +{flash.value}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Failed overlay */}
      {node.status === 'failed' && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: 'rgba(239,68,68,0.08)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontFamily: 'Orbitron, monospace', fontSize: 11,
            color: '#ef4444', letterSpacing: '0.1em', fontWeight: 700,
          }}>⚠ NODE FAILED</span>
        </div>
      )}
    </motion.div>
  );
}
