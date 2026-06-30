import { useState } from 'react';
import { useGameState } from './game/useGameState';
import { HUD } from './components/HUD';
import { JobQueue } from './components/JobQueue';
import { NodeGrid } from './components/NodeGrid';
import { JobDetailsPanel } from './components/JobDetailsPanel';
import { SlurmO } from './components/SlurmO';
import { SlurmOTrack } from './components/SlurmOTrack';
import { EventBanner } from './components/EventBanner';
const slurmImg = '/snail.png';

function MenuScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen relative overflow-hidden"
      style={{ background: '#02020a' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(83,213,253,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(83,213,253,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #53d5fd08 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d5ad4d08 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative z-10 text-center max-w-xl px-6">
        <div className="flex justify-center mb-4">
          <img src={slurmImg} alt="Slurm-O" className="w-24 h-24 object-contain"
            style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 16px #53d5fd)' }} />
        </div>
        <h1 className="text-5xl font-black tracking-widest mb-1 font-mono"
          style={{ color: '#53d5fd', textShadow: '0 0 20px #53d5fd, 0 0 40px #53d5fd66' }}>
          CLUSTER
        </h1>
        <h1 className="text-5xl font-black tracking-widest mb-3 font-mono"
          style={{ color: '#d5ad4d', textShadow: '0 0 20px #d5ad4d, 0 0 40px #d5ad4d66' }}>
          COMMAND
        </h1>
        <p className="text-sm font-mono text-gray-500 mb-1">Learn the Cluster. Master the Queue. Save the Research.</p>
        <p className="text-xs text-gray-700 mb-8 font-mono">Duke Compute Cluster · HPC Strategy Game</p>

        <button onClick={onStart}
          className="relative px-10 py-4 text-lg font-black font-mono tracking-widest rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #53d5fd22, #53d5fd11)', border: '2px solid #53d5fd', color: '#53d5fd', boxShadow: '0 0 20px #53d5fd44, inset 0 0 10px #53d5fd11' }}>
          ▶ INITIALIZE CLUSTER
        </button>

        <div className="mt-8 rounded-xl p-4 text-left font-mono"
          style={{ background: 'rgba(83,213,253,0.04)', border: '1px solid rgba(83,213,253,0.1)' }}>
          <div className="text-xs font-bold mb-3" style={{ color: '#53d5fd' }}>HOW TO PLAY</div>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex gap-2"><span style={{ color: '#d5ad4d' }}>①</span><span>Jobs arrive in the queue on the left</span></div>
            <div className="flex gap-2"><span style={{ color: '#d5ad4d' }}>②</span><span>Click a job to select it, then click a node to assign it</span></div>
            <div className="flex gap-2"><span style={{ color: '#53d5fd' }}>⬡</span><span><span style={{ color: '#ffebaf' }}>CPU jobs</span> → CPU nodes &nbsp;|&nbsp; <span style={{ color: '#b6eeff' }}>GPU jobs</span> → GPU nodes</span></div>
            <div className="flex gap-2"><span style={{ color: '#4afa7a' }}>🐌</span><span>Keep efficiency high — Slurm-O crawls faster and levels up the cluster</span></div>
            <div className="flex gap-2"><span style={{ color: '#ff4444' }}>!</span><span>Queue overflow or 0% efficiency = game over</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameOverScreen({ state, onRestart, onMenu }: {
  state: ReturnType<typeof useGameState>['state'];
  onRestart: () => void;
  onMenu: () => void;
}) {
  const isOverflow = state.failureCause === 'Queue Overflow';

  return (
    <div className="flex flex-col items-center justify-center h-screen relative overflow-hidden"
      style={{ background: '#020005' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,50,50,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,50,50,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 text-center max-w-lg px-6 w-full">
        <div className="text-5xl mb-3"></div>
        <h2 className="text-3xl font-black font-mono mb-1" style={{ color: '#ff4444', textShadow: '0 0 20px #ff444488' }}>
          {isOverflow ? 'QUEUE OVERFLOW' : 'CLUSTER DOWN'}
        </h2>
        <p className="text-sm font-mono mb-1" style={{ color: '#ff8888' }}>
          Cause: <span className="font-bold">{state.failureCause}</span>
        </p>
        <p className="text-xs text-gray-600 font-mono mb-5">{state.slurmMessage}</p>

        {/* Stats */}
        <div className="rounded-xl p-4 mb-4 font-mono" style={{ background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.15)' }}>
          <div className="grid grid-cols-4 gap-3 text-sm text-center">
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Score</div>
              <div className="text-lg font-bold" style={{ color: '#d5ad4d' }}>{state.score.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Level</div>
              <div className="text-lg font-bold" style={{ color: '#53d5fd' }}>{state.level}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Completed</div>
              <div className="text-lg font-bold text-green-400">{state.totalJobsCompleted}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-0.5">Failed</div>
              <div className="text-lg font-bold text-red-400">{state.totalJobsFailed}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 grid grid-cols-2 gap-3 text-xs text-center" style={{ borderTop: '1px solid rgba(255,50,50,0.1)' }}>
            <div>
              <span className="text-gray-600">Final efficiency: </span>
              <span style={{ color: '#ffaa44' }}>{state.efficiency.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Mismatches: </span>
              <span style={{ color: '#ff8888' }}>{state.mismatchPenalties}</span>
            </div>
          </div>
        </div>

        {/* Post-mortem */}
        {state.failureAnalysis.length > 0 && (
          <div className="rounded-xl p-4 mb-5 text-left font-mono" style={{ background: 'rgba(255,150,0,0.04)', border: '1px solid rgba(255,150,0,0.15)' }}>
            <div className="text-xs font-bold mb-2" style={{ color: '#ffaa44' }}>WHAT WENT WRONG</div>
            <ul className="space-y-1.5">
              {state.failureAnalysis.map((item, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-400">
                  <span style={{ color: '#ff6633', flexShrink: 0 }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={onRestart}
            className="px-8 py-3 font-black font-mono rounded-lg transition-all hover:scale-105"
            style={{ background: '#53d5fd22', border: '2px solid #53d5fd', color: '#53d5fd', boxShadow: '0 0 12px #53d5fd44' }}>
            ↺ TRY AGAIN
          </button>
          <button onClick={onMenu}
            className="px-6 py-3 font-mono rounded-lg transition-all hover:opacity-70"
            style={{ background: 'transparent', border: '1px solid #444', color: '#888' }}>
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function PausedOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="text-center rounded-xl p-8" style={{ background: '#0a0a15', border: '1px solid #53d5fd44' }}>
        <div className="text-4xl font-black font-mono mb-2" style={{ color: '#53d5fd' }}>PAUSED</div>
        <p className="text-gray-500 font-mono text-sm mb-4">The cluster is on standby</p>
        <button onClick={onResume}
          className="px-8 py-3 font-black font-mono rounded-lg"
          style={{ background: '#53d5fd22', border: '2px solid #53d5fd', color: '#53d5fd' }}>
          ▶ RESUME
        </button>
      </div>
    </div>
  );
}

export default function Game() {
  const { state, startGame, pauseGame, resumeGame, goMenu, selectJob, assignJob, setSpeed, dismissEvent } = useGameState();
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [inspectedJobId, setInspectedJobId] = useState<string | null>(null);

  if (state.phase === 'menu') return <MenuScreen onStart={startGame} />;
  if (state.phase === 'gameover') return <GameOverScreen state={state} onRestart={startGame} onMenu={goMenu} />;

  const handleNodeClick = (nodeId: string) => {
    if (state.selectedJobId) {
      setInspectedJobId(state.selectedJobId);
      assignJob(state.selectedJobId, nodeId);
    }
  };

  const handleDrop = (nodeId: string, jobId: string) => {
    assignJob(jobId, nodeId);
    setDraggedJobId(null);
    selectJob(null);
    setInspectedJobId(jobId);
  };

  const queueFill = state.queue.length / state.queueCapacity;
  const allJobs = [...state.queue, ...state.running, ...state.completed];
  const inspectedJob = inspectedJobId ? allJobs.find(job => job.id === inspectedJobId) ?? null : null;

  const handleSelectJob = (jobId: string | null) => {
    selectJob(jobId);
    setInspectedJobId(jobId);
  };

  const handleInspectJob = (jobId: string) => {
    setInspectedJobId(jobId);
  };

  const handleCloseJobDetails = () => {
    setInspectedJobId(null);
    selectJob(null);
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden"
      style={{ background: '#04070f', fontFamily: 'monospace' }}>

      {/* HUD */}
      <HUD state={state} onPause={pauseGame} onResume={resumeGame} onSpeed={setSpeed} onMenu={goMenu} />

      {/* Slurm-O Progress Track */}
      <SlurmOTrack
        level={state.level}
        progress={state.slurmProgress}
        efficiency={state.efficiency}
        clusterStatus={state.clusterStatus}
        queueFill={queueFill}
      />

      {/* Event banners */}
      {state.events.some(e => !e.resolved) && (
        <EventBanner events={state.events} onDismiss={dismissEvent} tick={state.tick} />
      )}

      {/* Main game area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Job Queue */}
        <div className="flex-shrink-0 flex flex-col overflow-hidden" style={{ width: '80px' }}>
          <JobQueue
            queue={state.queue}
            running={state.running}
            selectedJobId={state.selectedJobId}
            onSelectJob={handleSelectJob}
            tick={state.tick}
            queueCapacity={state.queueCapacity}
            onDragStart={(jobId) => { setDraggedJobId(jobId); selectJob(null); setInspectedJobId(jobId); }}
            onDragEnd={() => setDraggedJobId(null)}
          />
        </div>

        {/* Center: Node Grid */}
        <NodeGrid
          nodes={state.nodes}
          running={state.running}
          selectedJobId={state.selectedJobId}
          draggedJobId={draggedJobId}
          allJobs={allJobs}
          onAssign={handleNodeClick}
          onDrop={handleDrop}
          onInspectJob={handleInspectJob}
        />

        {/* Right: Job Details */}
        <JobDetailsPanel
          job={inspectedJob}
          tick={state.tick}
          nodes={state.nodes}
          onClose={handleCloseJobDetails}
        />
      </div>

      {/* Bottom: Slurm-O mascot */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid #090f1e', background: 'rgba(4,7,15,0.9)' }}>
        <SlurmO message={state.slurmMessage} mood={state.slurmMood} />
      </div>

      {state.phase === 'paused' && <PausedOverlay onResume={resumeGame} />}
    </div>
  );
}
