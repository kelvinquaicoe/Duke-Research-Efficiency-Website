import type { ClusterStatus } from '../game/types';

const slurmImg = '/snail.png';

interface SlurmOTrackProps {
  level: number;
  progress: number; // 0–100
  efficiency: number;
  clusterStatus: ClusterStatus;
  queueFill: number; // 0–1
}

const HEX_NODES = 16;

function getTrackColor(efficiency: number, clusterStatus: ClusterStatus) {
  if (clusterStatus === 'critical') return { main: '#ff4444', glow: '#ff444466', dim: '#ff222233' };
  if (clusterStatus === 'warning') return { main: '#ffaa33', glow: '#ffaa3366', dim: '#ff880022' };
  if (efficiency > 70) return { main: '#53d5fd', glow: '#53d5fd66', dim: '#53d5fd22' };
  return { main: '#d5ad4d', glow: '#d5ad4d66', dim: '#d5ad4d22' };
}

function getSlurmSpeed(efficiency: number) {
  if (efficiency > 70) return 'fast';
  if (efficiency > 45) return 'normal';
  if (efficiency > 30) return 'slow';
  return 'backwards';
}

export function SlurmOTrack({ level, progress, efficiency, clusterStatus, queueFill }: SlurmOTrackProps) {
  const color = getTrackColor(efficiency, clusterStatus);
  const speed = getSlurmSpeed(efficiency);
  const isBackwards = speed === 'backwards';

  const statusLabels: Record<ClusterStatus, string> = {
    stable: 'STABLE',
    warning: 'WARNING',
    critical: 'CRITICAL',
  };

  return (
    <div
      className="relative flex items-center px-4 gap-3 select-none"
      style={{
        height: '52px',
        background: 'rgba(5,5,15,0.85)',
        borderBottom: `1px solid ${color.dim}`,
        borderTop: `1px solid ${color.dim}`,
      }}
    >
      {/* Level label */}
      <div className="flex-shrink-0 text-center w-16">
        <div className="text-xs font-mono text-gray-600">LVL</div>
        <div className="text-base font-black font-mono leading-none" style={{ color: color.main, textShadow: `0 0 6px ${color.glow}` }}>
          {level}
        </div>
      </div>

      {/* Track */}
      <div className="relative flex-1 flex items-center" style={{ height: '36px' }}>
        {/* Track line */}
        <div
          className="absolute inset-y-0 left-0 right-0 flex items-center"
          style={{ top: '50%', transform: 'translateY(-50%)', height: '2px' }}
        >
          {/* Filled portion */}
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${color.dim}, ${color.main})`,
              boxShadow: `0 0 6px ${color.glow}`,
            }}
          />
          {/* Unfilled portion */}
          <div
            className="h-full flex-1 rounded-full"
            style={{ background: '#1a2535' }}
          />
        </div>

        {/* Hex tick marks */}
        {Array.from({ length: HEX_NODES }, (_, i) => {
          const pct = ((i + 1) / HEX_NODES) * 100;
          const isPassed = progress >= pct;
          return (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: '10px',
                height: '10px',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  background: isPassed ? color.main : '#1a2535',
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  boxShadow: isPassed ? `0 0 4px ${color.glow}` : 'none',
                  transition: 'background 0.3s',
                }}
              />
            </div>
          );
        })}

        {/* Slurm-O snail */}
        <div
          className="absolute z-10 flex flex-col items-center"
          style={{
            left: `${Math.max(0, Math.min(98, progress))}%`,
            transform: 'translateX(-50%)',
            transition: 'left 0.2s linear',
            bottom: 0,
          }}
        >
          <img
            src={slurmImg}
            alt="Slurm-O"
            style={{
              width: '28px',
              height: '28px',
              imageRendering: 'pixelated',
              transform: isBackwards ? 'scaleX(-1)' : 'scaleX(1)',
              filter: `drop-shadow(0 0 4px ${color.main})`,
              transition: 'transform 0.3s',
            }}
          />
        </div>
      </div>

      {/* Level-up label */}
      <div className="flex-shrink-0 text-center w-20">
        <div className="text-xs font-mono text-gray-600">LVL UP</div>
        <div className="text-sm font-black font-mono leading-none" style={{ color: '#d5ad4d', opacity: 0.6 }}>
          {level + 1}
        </div>
      </div>

      {/* Status + speed indicator */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5 w-20">
        <span
          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${clusterStatus === 'critical' ? 'animate-pulse' : ''}`}
          style={{
            color: color.main,
            background: color.dim,
            border: `1px solid ${color.main}44`,
          }}
        >
          {statusLabels[clusterStatus]}
        </span>
        <span className="text-xs font-mono" style={{ color: '#555' }}>
          {isBackwards ? '◄ reversing' : speed === 'slow' ? '► crawling' : speed === 'normal' ? '►► moving' : '►► speeding'}
        </span>
      </div>

      {/* Queue fill warning */}
      {queueFill > 0.5 && (
        <div
          className="flex-shrink-0 text-xs font-mono px-2 py-0.5 rounded"
          style={{
            background: queueFill > 0.8 ? '#ff000022' : '#ff880011',
            color: queueFill > 0.8 ? '#ff6666' : '#ff9944',
            border: `1px solid ${queueFill > 0.8 ? '#ff333355' : '#ff880033'}`,
            animation: queueFill > 0.8 ? 'pulse 1s infinite' : 'none',
          }}
        >
          {queueFill > 0.8 ? '⚠ OVERFLOW' : '⚠ QUEUE'}
        </div>
      )}
    </div>
  );
}
