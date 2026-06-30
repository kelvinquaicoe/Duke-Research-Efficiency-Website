import type { GameState } from '../game/types';
const slurmImg = '/snail.png';

interface HUDProps {
  state: GameState;
  onPause: () => void;
  onResume: () => void;
  onSpeed: (s: 1 | 2 | 4) => void;
  onMenu: () => void;
}

function MetricBox({ label, value, color, dimBg }: { label: string; value: string; color: string; dimBg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg"
      style={{ background: dimBg ?? '#080e1c', border: '1px solid #0f1e35', minWidth: '64px' }}>
      <span className="text-xs font-mono tracking-wider mb-0.5" style={{ color: '#3a5068' }}>{label}</span>
      <span className="text-sm font-black font-mono" style={{ color, textShadow: `0 0 8px ${color}88` }}>{value}</span>
    </div>
  );
}

export function HUD({ state, onPause, onResume, onSpeed, onMenu }: HUDProps) {
  const { score, efficiency, phase, speed, totalJobsCompleted, queue, queueCapacity, level } = state;

  const effColor = efficiency > 70 ? '#4afa7a' : efficiency > 40 ? '#ffcc44' : '#ff4444';
  const queueFill = queue.length / queueCapacity;
  const queueColor = queueFill > 0.8 ? '#ff4444' : queueFill > 0.5 ? '#ff8833' : '#53d5fd';

  const levelLabel = level === 1 ? 'BOOT SEQUENCE'
    : level < 4 ? 'CLUSTER ONLINE'
    : level < 7 ? 'PEAK LOAD'
    : 'CRITICAL MASS';

  return (
    <div className="flex items-center px-4 py-2 gap-3"
      style={{ background: '#040810', borderBottom: '1px solid #0a1525', fontFamily: 'monospace', height: '48px' }}>

      {/* Left: Logo + title */}
      <div className="flex items-center gap-2 mr-2">
        <img src={slurmImg} alt="Slurm-O" className="w-6 h-6 object-contain"
          style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 4px #53d5fd)' }} />
        <div>
          <div className="text-sm font-black tracking-wider leading-none" style={{ color: '#53d5fd', textShadow: '0 0 8px #53d5fd66' }}>
            CLUSTER COMMAND
          </div>
          <div className="text-xs leading-none mt-0.5" style={{ color: '#7040cc' }}>
            LVL {level} · {levelLabel}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Metric boxes */}
      <MetricBox label="SCORE" value={score >= 1000 ? `${(score / 1000).toFixed(1)}k` : String(score)} color="#d5ad4d" />
      <MetricBox label="EFFICIENCY" value={`${efficiency.toFixed(0)}%`} color={effColor} />
      <MetricBox label="JOBS DONE" value={String(totalJobsCompleted)} color="#4afa7a" />
      <MetricBox
        label="QUEUE"
        value={`${queue.length}/${queueCapacity}`}
        color={queueColor}
        dimBg={queueFill > 0.8 ? '#1a040411' : undefined}
      />

      {/* Controls */}
      <div className="flex items-center gap-1 ml-2">
        {([1, 2, 4] as const).map(s => (
          <button key={s} onClick={() => onSpeed(s)}
            className="px-2 py-1 text-xs font-mono rounded transition-all"
            style={{
              background: speed === s ? '#53d5fd18' : 'transparent',
              color: speed === s ? '#53d5fd' : '#2a3a50',
              border: `1px solid ${speed === s ? '#53d5fd55' : '#0f1e35'}`,
            }}>
            {s}x
          </button>
        ))}
        <button onClick={phase === 'playing' ? onPause : onResume}
          className="px-2 py-1 text-xs font-mono rounded ml-1 transition-all"
          style={{
            background: phase === 'paused' ? '#4afa7a11' : '#ff660011',
            color: phase === 'paused' ? '#4afa7a' : '#ff8833',
            border: `1px solid ${phase === 'paused' ? '#4afa7a44' : '#ff883344'}`,
          }}>
          {phase === 'paused' ? '▶' : '⏸'}
        </button>
        <button onClick={onMenu}
          className="px-2 py-1 text-xs font-mono rounded transition-all hover:opacity-70"
          style={{ color: '#2a3a50', border: '1px solid #0f1e35' }}>
          ⬡
        </button>
      </div>
    </div>
  );
}
