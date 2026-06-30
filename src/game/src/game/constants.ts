import type { ResourceNode, ResourceType, Priority } from './types';

export const INITIAL_NODES: ResourceNode[] = [
  {
    id: 'gpu-1',
    name: 'GPU-A',
    type: 'GPU',
    description: 'Top-tier A100 accelerator. Essential for deep learning and LLM training.',
    maxJobs: 2,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 16,
    trait: 'Overclocked',
  },
  {
    id: 'gpu-2',
    name: 'GPU-B',
    type: 'GPU',
    description: 'Stable H100 node. Optimized for sustained throughput and multi-job workloads.',
    maxJobs: 2,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 12,
    trait: 'Reliable',
  },
  {
    id: 'gpu-3',
    name: 'GPU-C',
    type: 'GPU',
    description: 'RTX visualization node. Best for rendering and imaging workloads.',
    maxJobs: 2,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 8,
    trait: 'Standard',
  },
  {
    id: 'cpu-1',
    name: 'CPU-A',
    type: 'CPU',
    description: 'High-frequency parallel processor. Fastest single-core for latency-sensitive jobs.',
    maxJobs: 3,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 14,
    trait: 'Fast',
  },
  {
    id: 'cpu-2',
    name: 'CPU-B',
    type: 'CPU',
    description: 'Balanced compute node. High memory bandwidth for genomics and data pipelines.',
    maxJobs: 2,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 10,
    trait: 'Reliable',
  },
  {
    id: 'cpu-3',
    name: 'CPU-C',
    type: 'CPU',
    description: 'General-purpose workhorse. Great for simulations and analysis.',
    maxJobs: 4,
    assignedJobIds: [],
    status: 'idle',
    load: 0,
    power: 7,
    trait: 'Standard',
  },
];

interface JobTemplate {
  name: string;
  requiredType: ResourceType;
  priority: Priority;
  runtimeTicks: number;
  reward: number;
  description: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  { name: 'AI Training', requiredType: 'GPU', priority: 'high', runtimeTicks: 30, reward: 150, description: 'Training a large language model on the A100 cluster.' },
  { name: 'Genomics Analysis', requiredType: 'CPU', priority: 'medium', runtimeTicks: 20, reward: 80, description: 'Analyzing whole-genome sequencing data for cancer research.' },
  { name: 'Climate Simulation', requiredType: 'CPU', priority: 'high', runtimeTicks: 40, reward: 200, description: 'Running a global climate model at high resolution.' },
  { name: 'Drug Discovery', requiredType: 'CPU', priority: 'medium', runtimeTicks: 25, reward: 100, description: 'Molecular dynamics simulation for protein folding.' },
  { name: 'Neural Net Inference', requiredType: 'GPU', priority: 'low', runtimeTicks: 15, reward: 60, description: 'Running inference on a deployed model checkpoint.' },
  { name: 'Data Preprocessing', requiredType: 'CPU', priority: 'low', runtimeTicks: 10, reward: 40, description: 'ETL pipeline to prepare raw sequencing data.' },
  { name: 'Image Segmentation', requiredType: 'GPU', priority: 'medium', runtimeTicks: 22, reward: 90, description: 'Segmenting medical imaging scans for pathology detection.' },
  { name: 'Fluid Dynamics', requiredType: 'CPU', priority: 'high', runtimeTicks: 35, reward: 180, description: 'CFD simulation for aeronautics research.' },
  { name: 'Deep Learning Training', requiredType: 'GPU', priority: 'high', runtimeTicks: 45, reward: 220, description: 'Multi-GPU training run on vision transformer architecture.' },
  { name: 'Monte Carlo Sim', requiredType: 'CPU', priority: 'low', runtimeTicks: 18, reward: 70, description: 'Statistical simulation for financial risk modeling.' },
  { name: 'LLM Fine-tuning', requiredType: 'GPU', priority: 'high', runtimeTicks: 50, reward: 250, description: 'Fine-tuning a foundation model on domain-specific corpus.' },
  { name: 'Protein Folding', requiredType: 'GPU', priority: 'high', runtimeTicks: 38, reward: 190, description: 'AlphaFold-style prediction on novel protein sequences.' },
  { name: 'Bioinformatics', requiredType: 'CPU', priority: 'medium', runtimeTicks: 28, reward: 110, description: 'Variant calling pipeline on whole-exome samples.' },
  { name: 'Render Farm', requiredType: 'GPU', priority: 'low', runtimeTicks: 20, reward: 80, description: 'Rendering high-fidelity visualizations for publication.' },
  { name: 'N-body Simulation', requiredType: 'CPU', priority: 'medium', runtimeTicks: 32, reward: 130, description: 'Astrophysics simulation of stellar cluster evolution.' },
];

export const SLURM_MESSAGES = {
  idle: [
    "Queue is empty — nice work, admin!",
    "All systems nominal. The cluster is yours.",
    "No jobs waiting. Enjoy the calm before the storm!",
  ],
  jobArrived: [
    "New job incoming! Get it assigned quickly.",
    "Looks like the researchers are busy today!",
    "Job waiting in queue — don't let it sit too long.",
  ],
  goodAssignment: [
    "Perfect match! That job is right at home.",
    "Excellent scheduling! I'm speeding up!",
    "That's what I'm talking about! Great placement.",
    "Textbook assignment. Watch me go!",
  ],
  wrongType: [
    "Uh oh! That job needs a different resource type!",
    "Wrong node! I'm slowing down because of that...",
    "Mismatch detected! You're slowing me down!",
    "That's like putting a diesel engine in an electric car!",
  ],
  nodeFull: [
    "That node is at capacity! Try another one.",
    "No room here — the node is fully loaded.",
    "Queue pressure rising — we need more capacity!",
  ],
  queueWarning: [
    "Queue is filling up! Speed up assignments.",
    "Researchers are waiting — clear that backlog!",
    "Queue pressure is increasing. I'm slowing down!",
  ],
  queueCritical: [
    "Queue overflow imminent! Emergency action required!",
    "We're approaching operational limits! Assign faster!",
    "CRITICAL: Queue near capacity — I'm going backwards!",
  ],
  efficiencyWarning: [
    "Efficiency dropping. I'm barely moving now.",
    "Poor scheduling is slowing me down. Fix those assignments!",
    "Idle nodes are killing our progress. Fill them up!",
  ],
  efficiencyCritical: [
    "EMERGENCY! I'm moving backwards! Fix the cluster NOW!",
    "Terrible efficiency — I'm losing ground! Assign those jobs!",
    "The cluster is in crisis. I'm reversing direction!",
  ],
  levelUp: [
    "Cluster expansion complete! Made it to the next level!",
    "I reached the end! New resources unlocked!",
    "Level up! The DCC trusts you with more nodes now!",
    "Excellent work! I'm starting the next track!",
  ],
  event: [
    "Heads up — a cluster event is incoming!",
    "Incident detected! Stay calm and adapt.",
    "The cluster needs your attention right now!",
  ],
};

export const TICKS_PER_SECOND = 10;
export const BASE_JOB_ARRIVAL_INTERVAL = 40;
export const EFFICIENCY_DRAIN_RATE = 0.3;
export const IDLE_NODE_PENALTY = 0.05;
export const QUEUE_PRESSURE_PENALTY = 0.1;
export const WRONG_TYPE_PENALTY = 15;
export const CORRECT_TYPE_BONUS = 5;
export const SLURM_BREAKEVEN = 30;
export const SLURM_SPEED_SCALE = 0.004;
export const QUEUE_CAPACITY_BASE = 2; /*change the base so whn it go over the que capcity it fails*/
export const QUEUE_CAPACITY_PER_LEVEL = 2;
