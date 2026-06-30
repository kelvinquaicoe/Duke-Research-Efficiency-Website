import { useState, useRef, useEffect } from 'react';
import type { ResourceNode, Job } from '../game/types';

interface NodeGridProps {
  nodes: ResourceNode[];
  running: Job[];
  selectedJobId: string | null;
  draggedJobId: string | null;
  allJobs: Job[];
  onAssign: (nodeId: string) => void;
  onDrop: (nodeId: string, jobId: string) => void;
  onInspectJob: (jobId: string) => void;
}

const TYPE_STYLE = {
  CPU: { main: '#d5ad4d', dim: '#d5ad4d44', glow: '#d5ad4daa', bg: '#09090e', cardBg: '#0d0c00', badge: '#d5ad4d', badgeDim: '#d5ad4d22', text: '#ffebaf', dot: '#1a3000' },
  GPU: { main: '#53d5fd', dim: '#53d5fd44', glow: '#53d5fdaa', bg: '#07090f', cardBg: '#00080f', badge: '#53d5fd', badgeDim: '#53d5fd22', text: '#b6eeff', dot: '#001530' },
};

const STATUS = {
  idle:       { color: '#4afa7a', label: 'READY' },
  busy:       { color: '#53d5fd', label: 'BUSY' },
  overloaded: { color: '#ff8833', label: 'OVERLOADED' },
  offline:    { color: '#ff3333', label: 'OFFLINE' },
};

const TRAIT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  Overclocked: { bg: '#ff220011', text: '#ff6644', border: '#ff332233' },
  Reliable:    { bg: '#00aa4411', text: '#44cc88', border: '#00884433' },
  Standard:    { bg: '#22334411', text: '#6688aa', border: '#33445533' },
  Fast:        { bg: '#aa440011', text: '#ffaa44', border: '#aa550033' },
};

const MAX_POWER = 16;

function useHoverDelay(delay = 450) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEnter = () => { timer.current = setTimeout(() => setShow(true), delay); };
  const onLeave = () => { if (timer.current) clearTimeout(timer.current); setShow(false); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { show, onEnter, onLeave };
}

function PowerBar({ power, type }: { power: number; type: 'CPU' | 'GPU' }) {
  const ts = TYPE_STYLE[type];
  const filled = Math.round((power / MAX_POWER) * MAX_POWER);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono" style={{ color: '#3a5060', width: '42px' }}>POWER</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: MAX_POWER }, (_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-sm transition-all duration-300"
            style={{ background: i < filled ? ts.main : '#0f1e30', boxShadow: i < filled ? `0 0 3px ${ts.main}88` : 'none' }} />
        ))}
      </div>
      <span className="text-xs font-mono font-bold" style={{ color: ts.main, width: '16px', textAlign: 'right' }}>{power}</span>
    </div>
  );
}

function RunningJobBar({ job, nodeType, onInspect }: { job: Job; nodeType: 'CPU' | 'GPU'; onInspect: () => void }) {
  const ts = TYPE_STYLE[nodeType];
  const pct = job.runtimeTicks > 0 ? (job.ticksElapsed / job.runtimeTicks) * 100 : 0;
  const isMatch = job.requiredType === nodeType;
  const barColor = isMatch ? ts.main : '#ff4444';

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onInspect(); }}
      className="relative rounded overflow-hidden w-full text-left transition-all hover:scale-[1.01]"
      style={{ background: isMatch ? `${ts.main}0a` : '#ff000011', border: `1px solid ${barColor}33`, height: '22px', cursor: 'pointer' }}>
      <div className="absolute inset-y-0 left-0 transition-all duration-300 opacity-20"
        style={{ width: `${pct}%`, background: barColor }} />
      <div className="relative flex items-center justify-between px-1.5 h-full">
        <span className="text-xs font-mono truncate" style={{ color: isMatch ? ts.text : '#ff9999', maxWidth: '80px', fontSize: '10px' }}>{job.name}</span>
        <span className="text-xs font-mono" style={{ color: '#3a5060', fontSize: '10px' }}>{pct.toFixed(0)}%</span>
      </div>
    </button>
  );
}

function NodeTooltip({ node, runningJobs }: { node: ResourceNode; runningJobs: Job[] }) {
  const ts = TYPE_STYLE[node.type];
  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl p-3 font-mono pointer-events-none"
      style={{ background: '#09111f', border: `1px solid ${ts.main}88`, boxShadow: `0 4px 24px #000c, 0 0 12px ${ts.main}22` }}>
      <div className="absolute -bottom-2 left-6 w-0 h-0"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${ts.main}88` }} />
      <div className="font-bold text-xs mb-1" style={{ color: ts.text }}>{node.name} — {node.type} Node</div>
      <p className="text-xs mb-2" style={{ color: '#5a7080' }}>{node.description}</p>
      <div className="text-xs space-y-0.5">
        <div><span style={{ color: '#3a5060' }}>Slots: </span><span style={{ color: '#aac0d0' }}>{node.assignedJobIds.length}/{node.maxJobs} used</span></div>
        <div><span style={{ color: '#3a5060' }}>Trait: </span><span style={{ color: ts.main }}>{node.trait}</span></div>
        {runningJobs.length > 0 && (
          <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid #0f1e30' }}>
            <div className="text-xs mb-1" style={{ color: '#3a5060' }}>Running:</div>
            {runningJobs.map(j => (
              <div key={j.id} className="text-xs" style={{ color: j.requiredType === node.type ? '#88ccdd' : '#ff9999' }}>• {j.name}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NodeCard({ node, runningJobs, selectedJobId, draggedJobId, allJobs, onAssign, onDrop, onInspectJob }: {
  node: ResourceNode;
  runningJobs: Job[];
  selectedJobId: string | null;
  draggedJobId: string | null;
  allJobs: Job[];
  onAssign: () => void;
  onDrop: (jobId: string) => void;
  onInspectJob: (jobId: string) => void;
}) {
  const ts = TYPE_STYLE[node.type];
  const hover = useHoverDelay(450);
  const [isDragOver, setIsDragOver] = useState(false);
  const status = STATUS[node.status];
  const isFull = node.assignedJobIds.length >= node.maxJobs;

  const draggedJob = draggedJobId ? allJobs.find(j => j.id === draggedJobId) : null;
  const isDragCompatible = draggedJob ? draggedJob.requiredType === node.type : false;
  const isDragIncompatible = draggedJob ? draggedJob.requiredType !== node.type : false;

  const clickable = selectedJobId !== null && node.status !== 'offline' && !isFull;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFull) { e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId && !isFull) onDrop(jobId);
  };

  const trait = TRAIT_COLOR[node.trait] ?? TRAIT_COLOR.Standard;

  return (
    <div
      className="relative rounded-xl transition-all duration-200"
      style={{
        background: ts.cardBg,
        border: `1px solid ${
          isDragOver && !isFull ? ts.main
          : isDragCompatible && !isFull ? ts.main + '88'
          : isDragIncompatible ? '#ff333333'
          : clickable ? ts.main + '88'
          : ts.dim
        }`,
        boxShadow: isDragOver && !isFull
          ? `0 0 20px ${ts.glow}, 0 0 6px ${ts.main}`
          : isDragCompatible && !isFull && draggedJobId
          ? `0 0 10px ${ts.main}55`
          : clickable ? `0 0 8px ${ts.main}33` : 'none',
        cursor: clickable ? 'pointer' : isDragCompatible && !isFull ? 'copy' : 'default',
        opacity: node.status === 'offline' ? 0.4 : isDragIncompatible ? 0.6 : 1,
        transform: (isDragOver || clickable) && !isFull ? 'scale(1.01)' : 'scale(1)',
      }}
      onClick={clickable ? onAssign : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={hover.onEnter}
      onMouseLeave={hover.onLeave}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold font-mono" style={{ color: ts.text }}>{node.name}</span>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded"
            style={{ background: ts.badgeDim, color: ts.badge, border: `1px solid ${ts.main}44` }}>
            {node.type}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: status.color, boxShadow: `0 0 4px ${status.color}` }} />
          <span className="text-xs font-mono font-bold" style={{ color: status.color }}>{status.label}</span>
          {!isFull && <span className="text-xs font-mono" style={{ color: '#2a3a4a' }}>({node.assignedJobIds.length}/{node.maxJobs})</span>}
          {isFull && <span className="text-xs font-mono" style={{ color: '#ff6633' }}>FULL</span>}
        </div>

        {/* Power bar */}
        <div className="mb-2">
          <PowerBar power={node.power} type={node.type} />
        </div>

        {/* Running jobs */}
        {runningJobs.length > 0 && (
          <div className="space-y-1 mb-2">
            {runningJobs.map(job => <RunningJobBar key={job.id} job={job} nodeType={node.type} onInspect={() => onInspectJob(job.id)} />)}
          </div>
        )}

        {/* Trait tag */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ background: trait.bg, color: trait.text, border: `1px solid ${trait.border}` }}>
            • {node.trait}
          </span>
          {isDragCompatible && !isFull && draggedJobId && (
            <span className="text-xs font-mono animate-pulse" style={{ color: ts.main }}>drop here</span>
          )}
          {clickable && (
            <span className="text-xs font-mono animate-pulse" style={{ color: ts.main }}>← assign</span>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {hover.show && <NodeTooltip node={node} runningJobs={runningJobs} />}
    </div>
  );
}

export function NodeGrid({ nodes, running, selectedJobId, draggedJobId, allJobs, onAssign, onDrop, onInspectJob }: NodeGridProps) {
  const gpuNodes = nodes.filter(n => n.type === 'GPU');
  const cpuNodes = nodes.filter(n => n.type === 'CPU');

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0f1e30 transparent' }}>

      {/* GPU Nodes */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#53d5fd', boxShadow: '0 0 6px #53d5fd' }} />
          <span className="text-xs font-bold font-mono tracking-widest" style={{ color: '#53d5fd99' }}>GPU NODES</span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {gpuNodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              runningJobs={running.filter(j => node.assignedJobIds.includes(j.id))}
              selectedJobId={selectedJobId}
              draggedJobId={draggedJobId}
              allJobs={allJobs}
              onAssign={() => onAssign(node.id)}
              onDrop={(jobId) => onDrop(node.id, jobId)}
              onInspectJob={onInspectJob}
            />
          ))}
        </div>
      </div>

      {/* CPU Nodes */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#d5ad4d', boxShadow: '0 0 6px #d5ad4d' }} />
          <span className="text-xs font-bold font-mono tracking-widest" style={{ color: '#d5ad4d99' }}>CPU NODES</span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {cpuNodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              runningJobs={running.filter(j => node.assignedJobIds.includes(j.id))}
              selectedJobId={selectedJobId}
              draggedJobId={draggedJobId}
              allJobs={allJobs}
              onAssign={() => onAssign(node.id)}
              onDrop={(jobId) => onDrop(node.id, jobId)}
              onInspectJob={onInspectJob}
            />
          ))}
        </div>
      </div>

      {/* How to play footer */}
      <div className="pb-1 pt-2" style={{ borderTop: '1px dashed #0f1e30' }}>
        <p className="text-xs font-mono text-center mb-0.5" style={{ color: '#2a3a50' }}>
          <span style={{ color: '#53d5fd88' }}>◈</span> Drag GPU gems onto GPU nodes &nbsp;·&nbsp;
          <span style={{ color: '#d5ad4d88' }}>⬡</span> Drag CPU gems onto CPU nodes
        </p>
        <p className="text-xs font-mono text-center" style={{ color: '#1a2a3a' }}>
          Match types for bonus points · Don't let gems expire · Move Slurm to the finish line!
        </p>
      </div>
    </div>
  );
}
