import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, Job, ResourceNode, GameEvent, ClusterStatus } from './types';
import {
  INITIAL_NODES, JOB_TEMPLATES, SLURM_MESSAGES,
  BASE_JOB_ARRIVAL_INTERVAL, EFFICIENCY_DRAIN_RATE,
  IDLE_NODE_PENALTY, QUEUE_PRESSURE_PENALTY,
  WRONG_TYPE_PENALTY, CORRECT_TYPE_BONUS,
  SLURM_BREAKEVEN, SLURM_SPEED_SCALE,
  QUEUE_CAPACITY_BASE, QUEUE_CAPACITY_PER_LEVEL,
  TICKS_PER_SECOND,
} from './constants';

const SCORE_TO_SLURM_PROGRESS = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function moveSlurmByScoreDelta(currentProgress: number, scoreDelta: number) {
  // Slurm-O now moves only when the score changes:
  // positive score delta moves forward, negative score delta moves backward.
  return clamp(currentProgress + scoreDelta * SCORE_TO_SLURM_PROGRESS, 0, 100);
}

const INITIAL_STATE: GameState = {
  nodes: INITIAL_NODES.map(n => ({ ...n })),
  queue: [],
  running: [],
  completed: [],
  efficiency: 75,
  score: 0,
  level: 1,
  slurmProgress: 0,
  queueCapacity: QUEUE_CAPACITY_BASE + QUEUE_CAPACITY_PER_LEVEL,
  selectedJobId: null,
  events: [],
  slurmMessage: "Welcome to Cluster Command! Assign jobs to nodes to keep the cluster running.",
  slurmMood: 'happy',
  clusterStatus: 'stable',
  phase: 'menu',
  tick: 0,
  speed: 1,
  totalJobsCompleted: 0,
  totalJobsFailed: 0,
  mismatchPenalties: 0,
  failureCause: '',
  failureAnalysis: [],
};

let jobIdCounter = 0;
let eventIdCounter = 0;

function makeJob(tick: number, level: number): Job {
  const templates = JOB_TEMPLATES.slice(0, Math.min(6 + level * 2, JOB_TEMPLATES.length));
  const template = templates[Math.floor(Math.random() * templates.length)];
  jobIdCounter += 1;
  return {
    id: `job-${jobIdCounter}`,
    name: template.name,
    requiredType: template.requiredType,
    priority: template.priority,
    runtimeTicks: Math.round(template.runtimeTicks * (0.8 + Math.random() * 0.4)),
    reward: template.reward,
    description: template.description,
    status: 'queued',
    ticksElapsed: 0,
    arrivalTick: tick,
  };
}

function getRandomMessage(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildFailureAnalysis(state: GameState, cause: string): string[] {
  const reasons: string[] = [];
  const totalJobs = state.totalJobsCompleted + state.totalJobsFailed;

  if (cause === 'Queue Overflow') {
    reasons.push(`Job queue reached capacity (${state.queueCapacity} jobs) — assignments couldn't keep up with demand.`);
  }
  if (cause === 'Efficiency Collapse') {
    reasons.push(`Cluster efficiency hit 0% — the system became too degraded to operate.`);
  }
  const idleNodes = state.nodes.filter(n => n.status === 'idle').length;
  if (idleNodes > 1) {
    reasons.push(`${idleNodes} nodes were idle — unused resources drain efficiency continuously.`);
  }
  if (state.mismatchPenalties > 3) {
    reasons.push(`${state.mismatchPenalties} resource mismatches — CPU jobs on GPU nodes (and vice versa) cost efficiency.`);
  }
  if (totalJobs > 0 && state.totalJobsFailed / totalJobs > 0.25) {
    reasons.push(`${state.totalJobsFailed} jobs expired in the queue — prioritize high-priority jobs first.`);
  }
  if (state.queue.length > state.queueCapacity * 0.5) {
    reasons.push(`Queue backlog was not cleared — let jobs expire or assign them faster.`);
  }
  if (reasons.length === 0) {
    reasons.push('The queue grew faster than the nodes could process it.');
    reasons.push('Keep nodes busy — idle compute is wasted efficiency.');
  }
  return reasons;
}

type Action =
  | { type: 'START_GAME' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK' }
  | { type: 'SELECT_JOB'; jobId: string | null }
  | { type: 'ASSIGN_JOB'; jobId: string; nodeId: string }
  | { type: 'SET_SPEED'; speed: 1 | 2 | 4 }
  | { type: 'DISMISS_EVENT'; eventId: string }
  | { type: 'GO_MENU' };

function gameOver(state: GameState, cause: string, extraFields: Partial<GameState> = {}): GameState {
  return {
    ...state,
    ...extraFields,
    phase: 'gameover',
    slurmMood: 'worried',
    failureCause: cause,
    failureAnalysis: buildFailureAnalysis({ ...state, ...extraFields }, cause),
    selectedJobId: null,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME': {
      jobIdCounter = 0;
      eventIdCounter = 0;
      const firstJob = makeJob(0, 1);
      return {
        ...INITIAL_STATE,
        nodes: INITIAL_NODES.map(n => ({ ...n, assignedJobIds: [] })),
        queue: [firstJob],
        phase: 'playing',
        slurmMessage: "Your first job just arrived! Click it, then click a node to assign it.",
        slurmMood: 'excited',
        tick: 0,
      };
    }
    case 'PAUSE':
      return { ...state, phase: 'paused' };
    case 'RESUME':
      return { ...state, phase: 'playing' };
    case 'GO_MENU':
      return { ...INITIAL_STATE };
    case 'SET_SPEED':
      return { ...state, speed: action.speed };
    case 'SELECT_JOB': {
      if (action.jobId === state.selectedJobId) return { ...state, selectedJobId: null };
      return { ...state, selectedJobId: action.jobId };
    }
    case 'ASSIGN_JOB': {
      const job = state.queue.find(j => j.id === action.jobId);
      const node = state.nodes.find(n => n.id === action.nodeId);
      if (!job || !node) return state;

      if (node.assignedJobIds.length >= node.maxJobs) {
        return { ...state, slurmMessage: getRandomMessage(SLURM_MESSAGES.nodeFull), slurmMood: 'worried', selectedJobId: null };
      }

      const isMatch = job.requiredType === node.type;
      const efficiencyDelta = isMatch ? CORRECT_TYPE_BONUS : -WRONG_TYPE_PENALTY;
      const newEfficiency = clamp(state.efficiency + efficiencyDelta, 0, 100);
      const scoreDelta = isMatch ? Math.round(job.reward * 0.1) : -Math.max(5, Math.round(job.reward * 0.1));
      const newScore = Math.max(0, state.score + scoreDelta);
      const actualScoreDelta = newScore - state.score;

      const updatedJob: Job = { ...job, status: 'running', assignedNodeId: node.id, startTick: state.tick, ticksElapsed: 0 };
      const updatedNode: ResourceNode = {
        ...node,
        assignedJobIds: [...node.assignedJobIds, job.id],
        status: node.assignedJobIds.length + 1 >= node.maxJobs ? 'overloaded' : 'busy',
        load: Math.min(100, ((node.assignedJobIds.length + 1) / node.maxJobs) * 100),
      };

      return {
        ...state,
        queue: state.queue.filter(j => j.id !== action.jobId),
        running: [...state.running, updatedJob],
        nodes: state.nodes.map(n => n.id === node.id ? updatedNode : n),
        efficiency: newEfficiency,
        score: newScore,
        slurmProgress: moveSlurmByScoreDelta(state.slurmProgress, actualScoreDelta),
        selectedJobId: null,
        slurmMessage: isMatch ? getRandomMessage(SLURM_MESSAGES.goodAssignment) : getRandomMessage(SLURM_MESSAGES.wrongType),
        slurmMood: isMatch ? 'happy' : 'worried',
        mismatchPenalties: isMatch ? state.mismatchPenalties : state.mismatchPenalties + 1,
      };
    }
    case 'DISMISS_EVENT':
      return { ...state, events: state.events.map(e => e.id === action.eventId ? { ...e, resolved: true } : e) };

    case 'TICK': {
      if (state.phase !== 'playing') return state;

      const newTick = state.tick + 1;
      let newEfficiency = state.efficiency;
      let newScore = state.score;
      let newSlurmMessage = state.slurmMessage;
      let newSlurmMood = state.slurmMood;
      let newNodes = [...state.nodes];
      let newRunning = [...state.running];
      let newQueue = [...state.queue];
      let newCompleted = [...state.completed];
      let totalCompleted = state.totalJobsCompleted;
      let totalFailed = state.totalJobsFailed;
      let newEvents = [...state.events];
      let newSlurmProgress = state.slurmProgress;
      let newLevel = state.level;
      let newQueueCapacity = state.queueCapacity;

      // ── Advance running jobs ──────────────────────────────────────────
      const completedThisTick: string[] = [];
      newRunning = newRunning.map(job => {
        const updated = { ...job, ticksElapsed: job.ticksElapsed + 1 };
        if (updated.ticksElapsed >= job.runtimeTicks) {
          completedThisTick.push(job.id);
          return { ...updated, status: 'completed' as const };
        }
        return updated;
      });

      if (completedThisTick.length > 0) {
        const completedJobs = newRunning.filter(j => completedThisTick.includes(j.id));
        newCompleted = [...newCompleted, ...completedJobs].slice(-50);
        newRunning = newRunning.filter(j => !completedThisTick.includes(j.id));
        totalCompleted += completedThisTick.length;

        completedJobs.forEach(job => {
          const node = newNodes.find(n => n.id === job.assignedNodeId);
          const isMatch = node ? job.requiredType === node.type : false;
          const multiplier = job.priority === 'high' ? 1.5 : job.priority === 'medium' ? 1.0 : 0.75;
          newScore += Math.round(job.reward * multiplier * (isMatch ? 1 : 0.4));
            newEfficiency = clamp(newEfficiency + (isMatch ? 3 : 0), 0, 100);
        });

        newNodes = newNodes.map(node => {
          const remaining = node.assignedJobIds.filter(id => !completedThisTick.includes(id));
          const load = remaining.length === 0 ? 0 : (remaining.length / node.maxJobs) * 100;
          return { ...node, assignedJobIds: remaining, load, status: remaining.length === 0 ? 'idle' : remaining.length >= node.maxJobs ? 'overloaded' : 'busy' };
        });
      }

      // ── Efficiency drains ─────────────────────────────────────────────
      const idleNodeCount = newNodes.filter(n => n.status === 'idle').length;
      const queueFill = Math.min(1, newQueue.length / newQueueCapacity);
      newEfficiency -= EFFICIENCY_DRAIN_RATE / TICKS_PER_SECOND;
      newEfficiency -= idleNodeCount * IDLE_NODE_PENALTY / TICKS_PER_SECOND;
      newEfficiency -= queueFill * QUEUE_PRESSURE_PENALTY / TICKS_PER_SECOND;
      newEfficiency = clamp(newEfficiency, 0, 100);

      const runningCount = newRunning.length;
      newEfficiency = clamp(newEfficiency + (runningCount * 0.15) / TICKS_PER_SECOND, 0, 100);

      // ── Expire jobs that waited too long ──────────────────────────────
      const waitLimit = Math.max(100, 200 - state.level * 10);
      const expiredJobs = newQueue.filter(j => newTick - j.arrivalTick > waitLimit);
      if (expiredJobs.length > 0) {
        newQueue = newQueue.filter(j => newTick - j.arrivalTick <= waitLimit);
        totalFailed += expiredJobs.length;
        newEfficiency = Math.max(0, newEfficiency - expiredJobs.length * 8);
        const expiredPenalty = expiredJobs.reduce((total, job) => total + Math.max(10, Math.round(job.reward * 0.25)), 0);
        newScore = Math.max(0, newScore - expiredPenalty);
      }

      // ── Arrive new jobs (NO soft cap — queue can overflow) ────────────
      const arrivalInterval = Math.max(12, BASE_JOB_ARRIVAL_INTERVAL - state.level * 3);
      if (newTick % arrivalInterval === 0) {
        newQueue = [...newQueue, makeJob(newTick, state.level)];
      }

      // ── Slurm-O movement ──────────────────────────────────────────────
      // Slurm-O only moves when points change. Completing jobs moves forward;
      // penalties such as expired jobs move backward. No score change means no movement.
      newSlurmProgress = moveSlurmByScoreDelta(newSlurmProgress, newScore - state.score);

      // ── Level up when Slurm-O reaches 100 ────────────────────────────
      if (newSlurmProgress >= 100) {
        newLevel += 1;
        newSlurmProgress = 0;
        newQueueCapacity = QUEUE_CAPACITY_BASE + newLevel * QUEUE_CAPACITY_PER_LEVEL;
        newSlurmMessage = getRandomMessage(SLURM_MESSAGES.levelUp);
        newSlurmMood = 'excited';
        // Add a new node every 2 levels
        if (newLevel % 2 === 0 && newNodes.length < 6) {
          const isGpu = newLevel % 4 === 0;
          const extras = isGpu
            ? { id: `gpu-${newLevel}`, name: `GPU-${String.fromCharCode(65 + newNodes.filter(n => n.type === 'GPU').length)}`, type: 'GPU' as const, description: 'High-throughput GPU for accelerated workloads.', maxJobs: 2, power: 10, trait: 'Standard' }
            : { id: `cpu-${newLevel}`, name: `CPU-${String.fromCharCode(65 + newNodes.filter(n => n.type === 'CPU').length)}`, type: 'CPU' as const, description: 'Additional parallel compute capacity.', maxJobs: 3, power: 9, trait: 'Standard' };
          newNodes = [...newNodes, { ...extras, assignedJobIds: [], status: 'idle' as const, load: 0 }];
        }
      }

      // ── Cluster status + Slurm-O commentary ──────────────────────────
      const queuePct = newQueue.length / newQueueCapacity;
      let clusterStatus: ClusterStatus = 'stable';
      if (newEfficiency < 30 || queuePct > 0.8) clusterStatus = 'critical';
      else if (newEfficiency < 55 || queuePct > 0.55) clusterStatus = 'warning';

      // Periodic commentary (every 50 ticks)
      if (newTick % 50 === 0) {
        if (clusterStatus === 'critical' && newEfficiency < 20) {
          newSlurmMessage = getRandomMessage(SLURM_MESSAGES.efficiencyCritical);
          newSlurmMood = 'worried';
        } else if (clusterStatus === 'critical' && queuePct > 0.8) {
          newSlurmMessage = getRandomMessage(SLURM_MESSAGES.queueCritical);
          newSlurmMood = 'worried';
        } else if (clusterStatus === 'warning') {
          newSlurmMessage = queuePct > 0.55
            ? getRandomMessage(SLURM_MESSAGES.queueWarning)
            : getRandomMessage(SLURM_MESSAGES.efficiencyWarning);
          newSlurmMood = 'neutral';
        }
      }

      // ── Random events ─────────────────────────────────────────────────
      const eventChance = 0.002 + newLevel * 0.0005;
      if (Math.random() < eventChance && newEvents.filter(e => !e.resolved).length === 0) {
        eventIdCounter += 1;
        const eventTypes = ['gpu_surge', 'deadline', 'cooling'] as const;
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const eventDefs = {
          gpu_surge: { title: 'GPU Demand Surge', description: 'AI researchers submitted a wave of GPU jobs. Prioritize GPU assignments!' },
          deadline: { title: 'Research Deadline', description: 'High-priority jobs flagged for emergency processing. Keep efficiency up!' },
          cooling: { title: 'Cooling Warning', description: 'Data center temps rising. Reduce overloaded nodes to prevent shutdowns.' },
        };
        const def = eventDefs[eventType];
        newEvents = [...newEvents, { id: `event-${eventIdCounter}`, type: eventType, title: def.title, description: def.description, durationTicks: 150, startTick: newTick, resolved: false }];
        newSlurmMessage = getRandomMessage(SLURM_MESSAGES.event);
        newSlurmMood = 'worried';
      }

      newEvents = newEvents.map(e => (!e.resolved && newTick - e.startTick > e.durationTicks) ? { ...e, resolved: true } : e);

      const nextState: GameState = {
        ...state,
        nodes: newNodes,
        queue: newQueue,
        running: newRunning,
        completed: newCompleted,
        efficiency: newEfficiency,
        score: newScore,
        level: newLevel,
        slurmProgress: newSlurmProgress,
        queueCapacity: newQueueCapacity,
        events: newEvents,
        slurmMessage: newSlurmMessage,
        slurmMood: newSlurmMood,
        clusterStatus,
        tick: newTick,
        totalJobsCompleted: totalCompleted,
        totalJobsFailed: totalFailed,
      };

      // ── Game over conditions ──────────────────────────────────────────
      const gameOverLimit = newQueueCapacity * 2;
      if (newQueue.length >= gameOverLimit) {
        return gameOver(nextState, 'Queue Overflow', {
          slurmMessage: `Queue reached ${newQueue.length}/${gameOverLimit}. The cluster has been overwhelmed.`,
        });
      }
      if (newEfficiency <= 0) {
        return gameOver(nextState, 'Efficiency Collapse', {
          slurmMessage: 'Efficiency hit zero. The cluster has collapsed.',
        });
      }

      return nextState;
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  useEffect(() => {
    if (state.phase === 'playing') {
      stopTick();
      const interval = Math.round((1000 / TICKS_PER_SECOND) / state.speed);
      tickRef.current = setInterval(() => dispatch({ type: 'TICK' }), interval);
    } else {
      stopTick();
    }
    return stopTick;
  }, [state.phase, state.speed, stopTick]);

  const startGame  = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const pauseGame  = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resumeGame = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const goMenu     = useCallback(() => dispatch({ type: 'GO_MENU' }), []);
  const selectJob  = useCallback((jobId: string | null) => dispatch({ type: 'SELECT_JOB', jobId }), []);
  const assignJob  = useCallback((jobId: string, nodeId: string) => dispatch({ type: 'ASSIGN_JOB', jobId, nodeId }), []);
  const setSpeed   = useCallback((speed: 1 | 2 | 4) => dispatch({ type: 'SET_SPEED', speed }), []);
  const dismissEvent = useCallback((eventId: string) => dispatch({ type: 'DISMISS_EVENT', eventId }), []);

  return { state, startGame, pauseGame, resumeGame, goMenu, selectJob, assignJob, setSpeed, dismissEvent };
}
