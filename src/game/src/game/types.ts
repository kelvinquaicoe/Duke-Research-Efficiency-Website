export type ResourceType = 'CPU' | 'GPU';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type NodeStatus = 'idle' | 'busy' | 'overloaded' | 'offline';
export type Priority = 'low' | 'medium' | 'high';
export type SlurmMood = 'happy' | 'neutral' | 'worried' | 'excited';
export type EventType = 'gpu_surge' | 'deadline' | 'maintenance' | 'node_failure' | 'cooling';
export type ClusterStatus = 'stable' | 'warning' | 'critical';

export interface ResourceNode {
  id: string;
  name: string;
  type: ResourceType;
  description: string;
  maxJobs: number;
  assignedJobIds: string[];
  status: NodeStatus;
  load: number;
  power: number;
  trait: string;
}

export interface Job {
  id: string;
  name: string;
  requiredType: ResourceType;
  priority: Priority;
  runtimeTicks: number;
  reward: number;
  description: string;
  status: JobStatus;
  assignedNodeId?: string;
  startTick?: number;
  ticksElapsed: number;
  arrivalTick: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  durationTicks: number;
  startTick: number;
  resolved: boolean;
}

export interface GameState {
  nodes: ResourceNode[];
  queue: Job[];
  running: Job[];
  completed: Job[];
  efficiency: number;
  score: number;
  level: number;
  slurmProgress: number;
  queueCapacity: number;
  selectedJobId: string | null;
  events: GameEvent[];
  slurmMessage: string;
  slurmMood: SlurmMood;
  clusterStatus: ClusterStatus;
  phase: 'menu' | 'playing' | 'paused' | 'gameover';
  tick: number;
  speed: 1 | 2 | 4;
  totalJobsCompleted: number;
  totalJobsFailed: number;
  mismatchPenalties: number;
  failureCause: string;
  failureAnalysis: string[];
}
