import { useState, useRef, useEffect } from 'react';
import type { Job } from '../game/types';

interface JobQueueProps {
  queue: Job[];
  running: Job[];
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
  tick: number;
  queueCapacity: number;
  onDragStart: (jobId: string) => void;
  onDragEnd: () => void;
}

const TYPE_COLOR = {
  CPU: { main: '#d5ad4d', glow: '#d5ad4d', bg: '#1a1200', dim: '#d5ad4d33', text: '#ffebaf' },
  GPU: { main: '#53d5fd', glow: '#53d5fd', bg: '#001525', dim: '#53d5fd33', text: '#b6eeff' },
};

const PRIORITY_DOTS = { high: '★★★', medium: '★★☆', low: '★☆☆' };
const PRIORITY_COLOR = { high: '#ff6b6b', medium: '#ffcc44', low: '#6688aa' };

function useHoverDelay(delay = 450) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEnter = () => { timer.current = setTimeout(() => setShow(true), delay); };
  const onLeave = () => { if (timer.current) clearTimeout(timer.current); setShow(false); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { show, onEnter, onLeave };
}

function JobTooltip({ job }: { job: Job }) {
  const pc = PRIORITY_COLOR[job.priority];
  const tc = TYPE_COLOR[job.requiredType];
  return (
    <div
      className="absolute left-full top-0 ml-3 z-50 w-52 rounded-xl p-3 font-mono pointer-events-none"
      style={{
        background: '#09111f',
        border: `1px solid ${tc.main}88`,
        boxShadow: `0 4px 24px #000a, 0 0 12px ${tc.main}22`,
      }}
    >
      {/* Arrow */}
      <div className="absolute -left-2 top-4 w-0 h-0"
        style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${tc.main}88` }} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: tc.dim, color: tc.main, border: `1px solid ${tc.main}55` }}>
          {job.requiredType}
        </span>
        <span className="text-xs font-bold" style={{ color: '#dde8f0' }}>{job.name}</span>
      </div>

      <p className="text-xs leading-relaxed mb-2" style={{ color: '#7090b0' }}>{job.description}</p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div><span style={{ color: '#4a6070' }}>Priority</span><br />
          <span style={{ color: pc }}>{PRIORITY_DOTS[job.priority]} {job.priority}</span>
        </div>
        <div><span style={{ color: '#4a6070' }}>Runtime</span><br />
          <span style={{ color: '#aac0d0' }}>{(job.runtimeTicks / 10).toFixed(0)}s</span>
        </div>
        <div><span style={{ color: '#4a6070' }}>Reward</span><br />
          <span style={{ color: '#d5ad4d' }}>+{job.reward} pts</span>
        </div>
        <div><span style={{ color: '#4a6070' }}>Requires</span><br />
          <span style={{ color: tc.main }}>{job.requiredType} node</span>
        </div>
      </div>
    </div>
  );
}

function HexGem({ job, isSelected, onSelect, onDragStart, onDragEnd, tick, index }: {
  job: Job;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  tick: number;
  index: number;
}) {
  const tc = TYPE_COLOR[job.requiredType];
  const hover = useHoverDelay(450);
  const [isDragging, setIsDragging] = useState(false);

  const waitTicks = tick - job.arrivalTick;
  const urgency = Math.min(1, waitTicks / 200);
  const pulseColor = urgency > 0.7 ? '#ff4444' : urgency > 0.4 ? '#ffcc44' : tc.main;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('jobId', job.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  const borderColor = isSelected ? tc.main : urgency > 0.7 ? '#ff4444' : urgency > 0.4 ? '#ffcc44' : tc.main + 'cc';
  const fillColor   = isSelected ? tc.main + '44' : tc.bg;
  const glowSize    = isSelected ? 12 : urgency > 0.5 ? 8 : 4;

  return (
    <div
      className="relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
      onMouseEnter={hover.onEnter}
      onMouseLeave={hover.onLeave}
      style={{ opacity: isDragging ? 0.35 : 1 }}
    >
      {/* Glow wrapper — drop-shadow goes here so it wraps the clipped shape */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        className="transition-all duration-150"
        style={{
          filter: `drop-shadow(0 0 ${glowSize}px ${borderColor})`,
          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
        }}
      >
        {/* Outer hex — this IS the visible border */}
        <div style={{
          width: 58,
          height: 66,
          clipPath: HEX,
          background: borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Inner hex — dark fill, slightly smaller to expose outer as border */}
          <div style={{
            width: 50,
            height: 57,
            clipPath: HEX,
            background: fillColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}>
            <span style={{ color: tc.text, fontSize: '10px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
              {job.requiredType}
            </span>
            <span style={{ color: tc.main, fontSize: '8px', fontFamily: 'monospace', lineHeight: 1 }}>
              {PRIORITY_DOTS[job.priority]}
            </span>
            <span style={{ color: tc.main + 'bb', fontSize: '7px', fontFamily: 'monospace', lineHeight: 1 }}>
              #{index + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Urgency pulse ring — sits outside the hex */}
      {urgency > 0.6 && (
        <div className="absolute pointer-events-none animate-ping"
          style={{
            width: 62, height: 70,
            clipPath: HEX,
            background: urgency > 0.85 ? '#ff444422' : '#ffcc4418',
            top: 0,
          }}
        />
      )}

      {/* Tooltip */}
      {hover.show && <JobTooltip job={job} />}
    </div>
  );
}

export function JobQueue({ queue, running, selectedJobId, onSelectJob, tick, queueCapacity, onDragStart, onDragEnd }: JobQueueProps) {
  const sorted = [...queue].sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });

  const queueFill = queue.length / queueCapacity;
  const fillColor = queueFill > 0.8 ? '#ff4444' : queueFill > 0.5 ? '#ff8833' : '#53d5fd88';

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(5,8,18,0.7)', borderRight: '1px solid #0f1e35' }}>

      {/* Header */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #0f1e35' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold font-mono tracking-widest" style={{ color: '#53d5fd' }}>JOB QUEUE</span>
          <span className="text-xs font-mono" style={{ color: queueFill > 0.8 ? '#ff6666' : '#4a6070' }}>
            {queue.length}/{queueCapacity}
          </span>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#0f1e35' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, queueFill * 100)}%`, background: fillColor, boxShadow: queueFill > 0.7 ? `0 0 6px ${fillColor}` : 'none' }} />
        </div>
        {queueFill > 0.8 && (
          <div className="mt-1 text-center text-xs font-mono animate-pulse" style={{ color: '#ff5555' }}>⚠ overflow risk</div>
        )}
      </div>

      {/* Gems */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col items-center gap-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#0f1e35 transparent' }}>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-8 text-center">
            <div style={{ width: '40px', height: '44px', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: '#0f1e35' }} />
            <span className="text-xs mt-2" style={{ color: '#2a3a50' }}>empty</span>
          </div>
        )}

        {sorted.map((job, i) => (
          <HexGem
            key={job.id}
            job={job}
            index={i}
            isSelected={selectedJobId === job.id}
            onSelect={() => onSelectJob(selectedJobId === job.id ? null : job.id)}
            onDragStart={() => onDragStart(job.id)}
            onDragEnd={onDragEnd}
            tick={tick}
          />
        ))}

        {/* Running count */}
        {running.length > 0 && (
          <div className="w-full px-1 pt-2" style={{ borderTop: '1px solid #0f1e35' }}>
            <div className="text-center text-xs font-mono" style={{ color: '#4afa7a' }}>
              ▶ {running.length} running
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="px-2 py-2 text-center" style={{ borderTop: '1px solid #0f1e35' }}>
        {selectedJobId ? (
          <span className="text-xs font-mono animate-pulse" style={{ color: '#53d5fd' }}>click a node →</span>
        ) : (
          <span className="text-xs font-mono" style={{ color: '#2a3a50' }}>click or drag</span>
        )}
      </div>
    </div>
  );
}
