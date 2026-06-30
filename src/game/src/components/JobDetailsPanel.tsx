import type { Job, ResourceNode } from '../game/types';

interface JobDetailsPanelProps {
  job: Job | null;
  tick: number;
  nodes: ResourceNode[];
  onClose: () => void;
}

const TYPE_STYLE = {
  CPU: { main: '#d5ad4d', dim: '#d5ad4d33', text: '#ffebaf', bg: 'rgba(213,173,77,0.06)' },
  GPU: { main: '#53d5fd', dim: '#53d5fd33', text: '#b6eeff', bg: 'rgba(83,213,253,0.06)' },
};

const PRIORITY_COLOR = { high: '#ff6b6b', medium: '#ffcc44', low: '#6688aa' };
const PRIORITY_DOTS = { high: '★★★', medium: '★★☆', low: '★☆☆' };
const STATUS_COLOR = { queued: '#ffcc44', running: '#4afa7a', completed: '#53d5fd', failed: '#ff4444' };

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-xs font-mono mb-0.5" style={{ color: '#3f5568' }}>{label}</div>
      <div className="text-xs font-bold font-mono" style={{ color: color ?? '#aac0d0' }}>{value}</div>
    </div>
  );
}

export function JobDetailsPanel({ job, tick, nodes, onClose }: JobDetailsPanelProps) {
  if (!job) {
    return (
      <aside className="hidden lg:flex flex-col justify-center items-center text-center px-4"
        style={{ width: 260, background: 'rgba(5,8,18,0.55)', borderLeft: '1px solid #0f1e35' }}>
        <div className="text-2xl mb-2" style={{ color: '#1f3548' }}>⬡</div>
        <div className="text-xs font-bold font-mono mb-1" style={{ color: '#35526a' }}>JOB DETAILS</div>
        <p className="text-xs font-mono leading-relaxed" style={{ color: '#26394d' }}>
          Click any queued job gem, or a running job bar, to inspect its requirements and progress.
        </p>
      </aside>
    );
  }

  const type = TYPE_STYLE[job.requiredType];
  const assignedNode = job.assignedNodeId ? nodes.find(n => n.id === job.assignedNodeId) : null;
  const waitTicks = Math.max(0, tick - job.arrivalTick);
  const progress = job.status === 'running' && job.runtimeTicks > 0
    ? Math.min(100, (job.ticksElapsed / job.runtimeTicks) * 100)
    : job.status === 'completed'
    ? 100
    : 0;
  const timeRemainingTicks = Math.max(0, job.runtimeTicks - job.ticksElapsed);

  return (
    <aside className="flex-shrink-0 overflow-y-auto p-3 font-mono"
      style={{ width: 260, background: 'rgba(5,8,18,0.85)', borderLeft: '1px solid #0f1e35', scrollbarWidth: 'thin', scrollbarColor: '#0f1e35 transparent' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-xs font-bold tracking-widest mb-1" style={{ color: type.main }}>JOB DETAILS</div>
          <h2 className="text-sm font-black leading-tight" style={{ color: type.text }}>{job.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs rounded px-2 py-1 transition-opacity hover:opacity-70"
          style={{ color: '#6688aa', border: '1px solid #1a3148', background: 'transparent' }}
          aria-label="Close job details"
        >
          ×
        </button>
      </div>

      <div className="rounded-xl p-3 mb-3" style={{ background: type.bg, border: `1px solid ${type.dim}` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: type.dim, color: type.main, border: `1px solid ${type.main}55` }}>
            {job.requiredType}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${PRIORITY_COLOR[job.priority]}22`, color: PRIORITY_COLOR[job.priority], border: `1px solid ${PRIORITY_COLOR[job.priority]}44` }}>
            {PRIORITY_DOTS[job.priority]} {job.priority}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#7f98ad' }}>{job.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Stat label="Status" value={job.status.toUpperCase()} color={STATUS_COLOR[job.status]} />
        <Stat label="Reward" value={`+${job.reward} pts`} color="#d5ad4d" />
        <Stat label="Runtime" value={`${(job.runtimeTicks / 10).toFixed(0)}s`} />
        <Stat label="Waiting" value={`${(waitTicks / 10).toFixed(0)}s`} color={waitTicks > 70 ? '#ff6666' : '#aac0d0'} />
      </div>

      {job.status === 'queued' && (
        <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(255,204,68,0.05)', border: '1px solid rgba(255,204,68,0.16)' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#ffcc44' }}>ASSIGNMENT</div>
          <p className="text-xs leading-relaxed" style={{ color: '#6f8395' }}>
            This job needs a <span style={{ color: type.main }}>{job.requiredType} node</span>. With it selected, click a matching node or drag the gem onto one.
          </p>
        </div>
      )}

      {job.status === 'running' && (
        <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(74,250,122,0.05)', border: '1px solid rgba(74,250,122,0.16)' }}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: '#4afa7a' }}>RUNNING</span>
            <span style={{ color: '#6f8395' }}>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#102030' }}>
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: type.main, boxShadow: `0 0 6px ${type.main}` }} />
          </div>
          <div className="text-xs space-y-1" style={{ color: '#6f8395' }}>
            <div>Node: <span style={{ color: assignedNode?.type === job.requiredType ? '#4afa7a' : '#ff6666' }}>{assignedNode?.name ?? 'unknown'}</span></div>
            <div>Remaining: <span style={{ color: '#aac0d0' }}>{(timeRemainingTicks / 10).toFixed(0)}s</span></div>
          </div>
        </div>
      )}

      <div className="rounded-lg p-3" style={{ background: 'rgba(83,213,253,0.035)', border: '1px solid rgba(83,213,253,0.1)' }}>
        <div className="text-xs font-bold mb-1" style={{ color: '#53d5fd' }}>WHY IT MATTERS</div>
        <p className="text-xs leading-relaxed" style={{ color: '#5f7488' }}>
          Matching the required resource type gives bonus efficiency and score. Mismatches still run, but they reduce cluster efficiency.
        </p>
      </div>
    </aside>
  );
}
