export type GpuUser = {
  user: string;
  avgUtilPct: number | null;
  gpuHoursAlloc: number | null;
  gpuHoursEffective: number | null;
  gpuHoursWasted?: number | null;
};

export type SortKey = 'eff-desc' | 'eff-asc' | 'gpu-desc' | 'effhrs-desc' | 'name-asc';

export const rankEmoji = (rank: number) =>
  rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank);

export const rankPalette = (rank: number, maxRank: number) => {
  // Match leader/loser board bar styling:
  // - top 5: teal
  // - bottom 5: red
  // - everyone else: gold
  if (rank <= 5) return { text: '#53d5fd', a: '#53d5fd', b: '#b6eeff' };
  if (rank > maxRank - 5) return { text: '#ef4444', a: '#ef4444', b: '#fca5a5' };
  return { text: '#d5ad4d', a: '#d5ad4d', b: '#ffebaf' };
};

export const safeNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const formatPercent = (value: number | null): string =>
  value !== null ? `${value.toFixed(1)}%` : '—';

export const formatHours = (value: number | null): string =>
  value !== null ? `${value.toFixed(1)}h` : '—';

export const normalizeQuery = (query: string): string => query.trim().toLowerCase();

export const userMatchesQuery = (user: GpuUser, query: string): boolean => {
  const normalized = normalizeQuery(query);
  if (!normalized) return true;
  return user.user.toLowerCase().includes(normalized);
};

const compareNullable = (a: number | null, b: number | null, direction: 'asc' | 'desc') => {
  const safeA = a ?? Number.NEGATIVE_INFINITY;
  const safeB = b ?? Number.NEGATIVE_INFINITY;
  return direction === 'asc' ? safeA - safeB : safeB - safeA;
};

export const sortUsers = (users: GpuUser[], sortKey: SortKey): GpuUser[] => {
  const sorted = [...users];

  const comparators: Record<SortKey, (a: GpuUser, b: GpuUser) => number> = {
    'eff-desc': (a, b) => compareNullable(a.avgUtilPct, b.avgUtilPct, 'desc'),
    'eff-asc': (a, b) => compareNullable(a.avgUtilPct, b.avgUtilPct, 'asc'),
    'gpu-desc': (a, b) => compareNullable(a.gpuHoursAlloc, b.gpuHoursAlloc, 'desc'),
    'effhrs-desc': (a, b) => compareNullable(a.gpuHoursEffective, b.gpuHoursEffective, 'desc'),
    'name-asc': (a, b) => a.user.localeCompare(b.user),
  };

  return sorted.sort(comparators[sortKey]);
};
