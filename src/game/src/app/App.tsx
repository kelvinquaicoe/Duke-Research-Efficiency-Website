import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { HexGem } from './components/HexGem';
import { NodeCard } from './components/NodeCard';
import type { Job } from './components/HexGem';
import type { Node } from './components/NodeCard';
import { SnailTrack } from './components/SnailTrack';
import { GameLogo } from './components/GameLogo';

let confettiSafe: any = null;

// ─── Types ───────────────────────────────────────────────────────────────────

type GamePhase = 'start' | 'playing' | 'levelup' | 'gameover';
interface AppProps {
  embedded?: boolean;
}

interface GameEvent {
  id: string;
  type: 'gpu_failure' | 'queue_surge' | 'maintenance' | 'power_crisis';
  message: string;
  icon: string;
  color: string;
  endsAt: number;
  nodeIds?: string[];
}

interface LevelConfig {
  name: string;
  subtitle: string;
  spawnMs: number;
  jobMaxTimeMs: number;
  maxQueueSize: number;
  eventChance: number;
  theme: 'normal' | 'failure' | 'surge' | 'crisis';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVELS: LevelConfig[] = [
  { name: 'Boot Sequence',    subtitle: 'Learn the cluster',         spawnMs: 4200, jobMaxTimeMs: 16000, maxQueueSize: 4, eventChance: 0,    theme: 'normal'  },
  { name: 'Warming Up',       subtitle: 'Queues are filling fast',   spawnMs: 3400, jobMaxTimeMs: 13000, maxQueueSize: 5, eventChance: 0.15, theme: 'normal'  },
  { name: 'Hardware Failure', subtitle: 'Nodes are going offline!',  spawnMs: 3200, jobMaxTimeMs: 11000, maxQueueSize: 5, eventChance: 0.5,  theme: 'failure' },
  { name: 'Queue Nightmare',  subtitle: 'Jobs never stop coming',    spawnMs: 2400, jobMaxTimeMs: 9000,  maxQueueSize: 6, eventChance: 0.3,  theme: 'surge'   },
  { name: 'Power Crisis',     subtitle: 'Reduced capacity cluster',  spawnMs: 2800, jobMaxTimeMs: 10000, maxQueueSize: 6, eventChance: 0.4,  theme: 'crisis'  },
  { name: 'Total Chaos',      subtitle: 'All systems critical!',     spawnMs: 1900, jobMaxTimeMs: 7000,  maxQueueSize: 6, eventChance: 0.65, theme: 'failure' },
];

const BASE_NODES: Node[] = [
  { id: 'g1', name: 'GPU-A', type: 'gpu', maxPower: 16, currentPower: 16, status: 'idle', busyUntil: 0, trait: 'Overclocked', traitColor: '#a855f7' },
  { id: 'g2', name: 'GPU-B', type: 'gpu', maxPower: 12, currentPower: 12, status: 'idle', busyUntil: 0, trait: 'Reliable',    traitColor: '#10b981' },
  { id: 'g3', name: 'GPU-C', type: 'gpu', maxPower: 8,  currentPower: 8,  status: 'idle', busyUntil: 0, trait: 'Standard',    traitColor: '#64748b' },
  { id: 'c1', name: 'CPU-A', type: 'cpu', maxPower: 14, currentPower: 14, status: 'idle', busyUntil: 0, trait: 'Fast',        traitColor: '#f59e0b' },
  { id: 'c2', name: 'CPU-B', type: 'cpu', maxPower: 10, currentPower: 10, status: 'idle', busyUntil: 0, trait: 'Reliable',    traitColor: '#10b981' },
  { id: 'c3', name: 'CPU-C', type: 'cpu', maxPower: 7,  currentPower: 7,  status: 'idle', busyUntil: 0, trait: 'Standard',    traitColor: '#64748b' },
];

let jobCounter = 0;

function genJobId(): string {
  return `job-${++jobCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateJob(level: number, config: LevelConfig): Job {
  const types: ('gpu' | 'cpu')[] = ['gpu', 'cpu'];
  const type = types[Math.floor(Math.random() * 2)];
  const minPower = 2 + Math.floor(level / 2);
  const maxPower = Math.min(16, 6 + level * 2);
  const power = minPower + Math.floor(Math.random() * (maxPower - minPower + 1));
  const jitter = 0.8 + Math.random() * 0.4;
  const maxTime = Math.round(config.jobMaxTimeMs * jitter);
  return { id: genJobId(), type, power, timeLeft: maxTime, maxTime };
}

function freshNodes(): Node[] {
  return BASE_NODES.map(n => ({ ...n, status: 'idle', busyUntil: 0, currentPower: n.maxPower }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function App({ embedded = false }: AppProps) {
  const [phase, setPhase]           = useState<GamePhase>('start');
  const [level, setLevel]           = useState(1);
  const [score, setScore]           = useState(0);
  const [snailProgress, setSnailProgress] = useState(0);
  const [efficiency, setEfficiency] = useState(75);
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [nodes, setNodes]           = useState<Node[]>(freshNodes());
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [showLevelBanner, setShowLevelBanner] = useState(false);
  const [assignCount, setAssignCount] = useState(0);

  const spawnTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef       = useRef(level);
  const phaseRef       = useRef(phase);
  levelRef.current     = level;
  phaseRef.current     = phase;

  const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  const gameViewportHeight = embedded ? '100%' : '100vh';
  const gameOverlayPosition = embedded ? 'absolute' : 'fixed';

  // ─── Start game ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    jobCounter = 0;
    setPhase('playing');
    setLevel(1);
    setScore(0);
    setSnailProgress(0);
    setEfficiency(75);
    setJobs([]);
    setNodes(freshNodes());
    setActiveEvent(null);
    setAssignCount(0);
  }, []);

  // ─── Game tick (100ms): timers + node release + event expiry ──────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    tickTimerRef.current = setInterval(() => {
      const now = Date.now();

      // Release finished busy nodes
      setNodes(prev => prev.map(n =>
        n.status === 'busy' && n.busyUntil > 0 && now >= n.busyUntil
          ? { ...n, status: 'idle', busyUntil: 0 }
          : n
      ));

      // Expire event
      setActiveEvent(prev => {
        if (!prev) return null;
        if (now >= prev.endsAt) {
          // Restore failed/maintenance nodes
          setNodes(ns => ns.map(n =>
            (n.status === 'failed' || n.status === 'maintenance') && prev.nodeIds?.includes(n.id)
              ? { ...n, status: 'idle' }
              : n
          ));
          return null;
        }
        return prev;
      });

      // Tick job timers; penalize snail for expirations
      setJobs(prev => {
        const updated = prev.map(j => ({ ...j, timeLeft: j.timeLeft - 100 }));
        const expired = updated.filter(j => j.timeLeft <= 0).length;
        if (expired > 0) {
          setSnailProgress(p => Math.max(0, p - expired * 4));
          setEfficiency(e => Math.max(0, e - expired * 6));
        }
        return updated.filter(j => j.timeLeft > 0);
      });
    }, 100);

    return () => { if (tickTimerRef.current) clearInterval(tickTimerRef.current); };
  }, [phase]);

  // ─── Job spawner ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = LEVELS[Math.min(level - 1, LEVELS.length - 1)];

    // Spawn first job immediately on level start
    setJobs(prev => {
      if (prev.length < cfg.maxQueueSize) return [...prev, generateJob(level, cfg)];
      return prev;
    });

    spawnTimerRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      const lv = levelRef.current;
      const c = LEVELS[Math.min(lv - 1, LEVELS.length - 1)];
      setJobs(prev => {
        if (prev.length >= c.maxQueueSize) return prev;
        return [...prev, generateJob(lv, c)];
      });
    }, cfg.spawnMs);

    return () => { if (spawnTimerRef.current) clearInterval(spawnTimerRef.current); };
  }, [phase, level]);

  // ─── Random events ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    if (cfg.eventChance === 0) return;

    eventTimerRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      const lv = levelRef.current;
      const c = LEVELS[Math.min(lv - 1, LEVELS.length - 1)];
      if (Math.random() > c.eventChance) return;

      const eventTypes = ['gpu_failure', 'queue_surge', 'maintenance', 'power_crisis'] as const;
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const now = Date.now();
      let ev: GameEvent;
      const affectedNodeIds: string[] = [];

      if (type === 'gpu_failure') {
        // Pick 1-2 GPU nodes to fail
        const gpuNodes = ['g1', 'g2', 'g3'];
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const id = gpuNodes[Math.floor(Math.random() * gpuNodes.length)];
          if (!affectedNodeIds.includes(id)) affectedNodeIds.push(id);
        }
        setNodes(prev => prev.map(n =>
          affectedNodeIds.includes(n.id) && n.status === 'idle' ? { ...n, status: 'failed' } : n
        ));
        ev = { id: `ev-${now}`, type, message: `GPU node${affectedNodeIds.length > 1 ? 's' : ''} went offline!`, icon: '⚡', color: '#ef4444', endsAt: now + 8000, nodeIds: affectedNodeIds };
      } else if (type === 'queue_surge') {
        // Flood 2-3 extra jobs
        const lv2 = levelRef.current;
        const c2 = LEVELS[Math.min(lv2 - 1, LEVELS.length - 1)];
        const surge = 2 + Math.floor(Math.random() * 2);
        setJobs(prev => {
          const newJobs = Array.from({ length: surge }, () => generateJob(lv2, c2));
          return [...prev, ...newJobs].slice(0, c2.maxQueueSize + 2);
        });
        ev = { id: `ev-${now}`, type, message: `Queue surge! ${surge} jobs incoming!`, icon: '🌊', color: '#f97316', endsAt: now + 3000 };
      } else if (type === 'maintenance') {
        const allIds = ['g1', 'g2', 'g3', 'c1', 'c2', 'c3'];
        const id = allIds[Math.floor(Math.random() * allIds.length)];
        affectedNodeIds.push(id);
        setNodes(prev => prev.map(n =>
          n.id === id && n.status === 'idle' ? { ...n, status: 'maintenance' } : n
        ));
        ev = { id: `ev-${now}`, type, message: `${id.toUpperCase()} taken for maintenance`, icon: '🔧', color: '#f59e0b', endsAt: now + 6000, nodeIds: affectedNodeIds };
      } else {
        // Power crisis: reduce all node powers
        setNodes(prev => prev.map(n => ({ ...n, currentPower: Math.max(2, Math.round(n.maxPower * 0.6)) })));
        setTimeout(() => {
          setNodes(prev => prev.map(n => ({ ...n, currentPower: n.maxPower })));
        }, 10000);
        ev = { id: `ev-${now}`, type, message: 'Power crisis! Node capacity reduced 40%', icon: '🔋', color: '#a855f7', endsAt: now + 10000 };
      }

      setActiveEvent(ev);
    }, 12000);

    return () => { if (eventTimerRef.current) clearInterval(eventTimerRef.current); };
  }, [phase, level]);

  // ─── Level-up check ────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || snailProgress < 100) return;

    setPhase('levelup');
    setShowLevelBanner(true);

    confetti({
      particleCount: 180,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#00d4ff', '#a855f7', '#f59e0b', '#10b981', '#ffffff'],
    });

    setTimeout(() => {
      if (level >= LEVELS.length) {
        setPhase('gameover');
      } else {
        setLevel(l => l + 1);
        setSnailProgress(0);
        setJobs([]);
        setNodes(freshNodes());
        setActiveEvent(null);
        setShowLevelBanner(false);
        setPhase('playing');
      }
    }, 2800);
  }, [snailProgress, phase, level]);

  

  // ─── Assign job to node ────────────────────────────────────────────────────

  const handleAssign = useCallback((job: Job, node: Node) => {
    if (node.status !== 'idle') return;

    const typeMatch = job.type === node.type;
    const powerRatio = Math.min(job.power, node.currentPower) / Math.max(job.power, node.currentPower);
    const baseEff = typeMatch ? Math.round(50 + powerRatio * 50) : Math.round(powerRatio * 35);
    const eff = Math.max(5, baseEff);

    // Busy duration: proportional to job power / node power, 2-6 seconds
    const busyMs = Math.round(2000 + (job.power / node.currentPower) * 2500);
    const busyUntil = Date.now() + busyMs;

    setJobs(prev => prev.filter(j => j.id !== job.id));
    setNodes(prev => prev.map(n =>
      n.id === node.id ? { ...n, status: 'busy', busyUntil } : n
    ));
    setScore(prev => prev + eff);
    setAssignCount(prev => prev + 1);
    setEfficiency(prev => Math.round(prev * 0.72 + eff * 0.28));
    setSnailProgress(prev => Math.min(100, prev + eff / (typeMatch ? 7 : 14)));
  }, []);

  // ─── Render helpers ────────────────────────────────────────────────────────

  const gpuNodes = nodes.filter(n => n.type === 'gpu');
  const cpuNodes = nodes.filter(n => n.type === 'cpu');

  const effColor = efficiency >= 70 ? '#10b981' : efficiency >= 40 ? '#f59e0b' : '#ef4444';

  const levelThemeColors: Record<string, string> = {
    normal:  '#00d4ff',
    failure: '#ef4444',
    surge:   '#f97316',
    crisis:  '#a855f7',
  };
  const themeColor = levelThemeColors[config.theme] ?? '#00d4ff';

  // ─── Start screen ──────────────────────────────────────────────────────────

  if (phase === 'start') {
    return (
      <DndProvider backend={HTML5Backend}>
        <div style={{
          minHeight: "90vh", background: '#050a14',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          backgroundImage: 'radial-gradient(ellipse 70% 50% at 30% 40%, #0d2044 0%, #050a14 65%)',
          overflow: 'hidden', position: 'relative',
        }}>
          <StarField />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ textAlign: 'center', zIndex: 10 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ marginBottom: 24 }}
            >
              <GameLogo size="large" />
            </motion.div>

            <h1 style={{
              fontFamily: 'Orbitron, monospace', fontSize: 44, fontWeight: 900,
              background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.04em', marginBottom: 8, textShadow: 'none',
            }}>
              CLUSTER COMMAND
            </h1>

            <p style={{ color: '#64748b', fontSize: 14, letterSpacing: '0.12em', marginBottom: 48 }}>
              SCHEDULE JOBS · SURVIVE CHAOS · HELP SLURM THE SNAIL
            </p>

            {/* Legend */}
            <div style={{
              display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 48,
            }}>
              <LegendPill color="#00d4ff" label="GPU JOB" />
              <LegendPill color="#f59e0b" label="CPU JOB" />
              <LegendPill color="#10b981" label="MATCH BONUS" />
            </div>

            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,212,255,0.5)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0284c7)',
                border: 'none', borderRadius: 10, padding: '16px 48px',
                fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 700,
                color: '#050a14', cursor: 'pointer', letterSpacing: '0.08em',
              }}
            >
              START CLUSTER
            </motion.button>

            <div style={{ marginTop: 24, color: '#334155', fontSize: 12, letterSpacing: '0.08em' }}>
              DRAG JOBS → DROP ON MATCHING NODES
            </div>
          </motion.div>
        </div>
      </DndProvider>
    );
  }

  // ─── Game over ─────────────────────────────────────────────────────────────

  if (phase === 'gameover') {
    return (
      <DndProvider backend={HTML5Backend}>
        <div style={{
          minHeight: gameViewportHeight, background: '#050a14',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, #1a0d3c 0%, #050a14 65%)',
        }}>
          <StarField />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ textAlign: 'center', zIndex: 10 }}
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
            <h1 style={{
              fontFamily: 'Orbitron, monospace', fontSize: 36, fontWeight: 900,
              color: '#a855f7', letterSpacing: '0.06em', marginBottom: 8,
            }}>
              CLUSTER MASTERED
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, letterSpacing: '0.1em', marginBottom: 8 }}>
              ALL {LEVELS.length} LEVELS COMPLETE
            </p>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: 32, fontWeight: 900,
              color: '#f59e0b', marginBottom: 32,
              textShadow: '0 0 20px rgba(245,158,11,0.6)',
            }}>
              {score.toLocaleString()} PTS
            </div>
            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none', borderRadius: 10, padding: '14px 40px',
                fontFamily: 'Orbitron, monospace', fontSize: 14, fontWeight: 700,
                color: 'white', cursor: 'pointer', letterSpacing: '0.08em',
              }}
            >
              PLAY AGAIN
            </motion.button>
          </motion.div>
        </div>
      </DndProvider>
    );
  }

  // ─── Main game UI ──────────────────────────────────────────────────────────

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        height: gameViewportHeight, background: '#050a14', display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif', overflow: 'hidden',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 30%, #0d2044 0%, #050a14 60%)',
        position: 'relative',
      }}>
        <StarField />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 20, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GameLogo />
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: 16, fontWeight: 900,
                background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                letterSpacing: '0.06em', lineHeight: 1.1,
              }}>
                CLUSTER COMMAND
              </div>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: 8, color: themeColor,
                letterSpacing: '0.15em', marginTop: 1,
              }}>
                LVL {level} · {config.name.toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <StatChip label="SCORE" value={score.toLocaleString()} color="#f59e0b" />
          <StatChip label="EFFICIENCY" value={`${Math.round(efficiency)}%`} color={effColor} />
          <StatChip label="JOBS DONE" value={assignCount} color="#a855f7" />
          <StatChip label="QUEUE" value={`${jobs.length}/${config.maxQueueSize}`} color={jobs.length >= config.maxQueueSize ? '#ef4444' : '#64748b'} />
        </header>

        {/* ── Event Banner ────────────────────────────────────────────── */}
        <AnimatePresence>
          {activeEvent && (
            <motion.div
              key={activeEvent.id}
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: `${activeEvent.color}22`,
                borderBottom: `1px solid ${activeEvent.color}55`,
                padding: '8px 24px',
                display: 'flex', alignItems: 'center', gap: 10,
                zIndex: 15, flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18 }}>{activeEvent.icon}</span>
              <span style={{
                fontFamily: 'Orbitron, monospace', fontSize: 11, fontWeight: 700,
                color: activeEvent.color, letterSpacing: '0.1em',
              }}>
                {activeEvent.message.toUpperCase()}
              </span>
              <div style={{
                flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginLeft: 12,
              }}>
                <motion.div
                  style={{ height: '100%', background: activeEvent.color, borderRadius: 2 }}
                  animate={{ width: '0%' }}
                  initial={{ width: '100%' }}
                  transition={{ duration: (activeEvent.endsAt - Date.now()) / 1000, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Area ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', zIndex: 10 }}>

          {/* Job Queue */}
          <aside style={{
            width: 150, flexShrink: 0, padding: '16px 12px',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto',
            background: 'rgba(13,24,48,0.4)',
          }}>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontSize: 9, color: '#334155',
              letterSpacing: '0.15em', marginBottom: 8, paddingLeft: 4,
            }}>
              JOB QUEUE
            </div>
            <AnimatePresence>
              {jobs.map(job => (
                <motion.div key={job.id} layout style={{ marginBottom: 6 }}>
                  <HexGem job={job} />
                </motion.div>
              ))}
            </AnimatePresence>
            {jobs.length === 0 && (
              <div style={{ color: '#1e293b', fontSize: 11, textAlign: 'center', marginTop: 24, letterSpacing: '0.1em' }}>
                IDLE
              </div>
            )}
          </aside>

          {/* Cluster Nodes */}
          <main style={{
            flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24,
          }}>
            {/* GPU Section */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#00d4ff', boxShadow: '0 0 8px #00d4ff',
                }} />
                <span style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 10,
                  color: '#00d4ff', letterSpacing: '0.12em', fontWeight: 700,
                }}>
                  GPU NODES
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,212,255,0.12)' }} />
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {gpuNodes.map(node => (
                  <NodeCard key={node.id} node={node} onAssign={handleAssign} />
                ))}
              </div>
            </section>

            {/* CPU Section */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#f59e0b', boxShadow: '0 0 8px #f59e0b',
                }} />
                <span style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 10,
                  color: '#f59e0b', letterSpacing: '0.12em', fontWeight: 700,
                }}>
                  CPU NODES
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.12)' }} />
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {cpuNodes.map(node => (
                  <NodeCard key={node.id} node={node} onAssign={handleAssign} />
                ))}
              </div>
            </section>

            {/* How to play hint (level 1 only) */}
            {level === 1 && assignCount === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                style={{
                  border: '1px dashed rgba(0,212,255,0.2)',
                  borderRadius: 10, padding: '14px 18px',
                  color: '#334155', fontSize: 12, lineHeight: 1.7,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span style={{ color: '#00d4ff', fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: '0.1em' }}>
                  HOW TO PLAY
                </span>
                <br />
                🔷 <b style={{ color: '#94a3b8' }}>Drag GPU gems</b> onto GPU nodes &nbsp;·&nbsp;
                🟨 <b style={{ color: '#94a3b8' }}>Drag CPU gems</b> onto CPU nodes
                <br />
                <span style={{ color: '#475569' }}>Match types for bonus points · Don't let gems expire · Move Slurm to the finish line!</span>
              </motion.div>
            )}
          </main>
        </div>

        {/* ── Snail Track ─────────────────────────────────────────────── */}
        <SnailTrack progress={snailProgress} efficiency={efficiency} level={level} />

        {/* ── Level-up Banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showLevelBanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: gameOverlayPosition, inset: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(6px)',
              }}
            >
              <motion.div
                initial={{ scale: 0.5, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                style={{ textAlign: 'center' }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6 }}
                  style={{ fontSize: 72, marginBottom: 16 }}
                >
                  🐌
                </motion.div>
                <div style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 13, color: '#10b981',
                  letterSpacing: '0.2em', marginBottom: 8,
                }}>
                  LEVEL COMPLETE
                </div>
                <div style={{
                  fontFamily: 'Orbitron, monospace', fontSize: 36, fontWeight: 900,
                  background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.06em', marginBottom: 12,
                }}>
                  LEVEL {level}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 14, letterSpacing: '0.06em' }}>
                  {level < LEVELS.length ? `Next: ${LEVELS[level].name}` : 'Final level cleared!'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}

// ─── Small helper components ─────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '6px 14px', minWidth: 72,
    }}>
      <div style={{ fontSize: 8, fontFamily: 'Orbitron, monospace', color: '#334155', letterSpacing: '0.1em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontFamily: 'Orbitron, monospace', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: `${color}14`,
      border: `1px solid ${color}44`,
      borderRadius: 20, padding: '6px 14px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, color, letterSpacing: '0.1em' }}>
        {label}
      </span>
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 1.5,
    opacity: 0.1 + Math.random() * 0.4,
    duration: 2 + Math.random() * 4,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.map(s => (
        <motion.div
          key={s.id}
          animate={{ opacity: [s.opacity, s.opacity * 0.3, s.opacity] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: Math.random() * 3 }}
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: 'white',
          }}
        />
      ))}
    </div>
  );
}
