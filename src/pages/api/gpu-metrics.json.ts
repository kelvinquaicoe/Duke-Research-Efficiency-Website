export const prerender = true;

const PROMETHEUS_BASE =
  process.env.PROMETHEUS_URL || 'https://thanos-metrics.oit.duke.edu';
const PROMETHEUS_TOKEN = process.env.PROMETHEUS_TOKEN;

async function queryPrometheus(expr: string) {
  const url = `${PROMETHEUS_BASE}/api/v1/query?query=${encodeURIComponent(expr)}`;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (PROMETHEUS_TOKEN) {
    headers.Authorization = `Bearer ${PROMETHEUS_TOKEN}`;
    headers['X-Auth-Token'] = PROMETHEUS_TOKEN;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    let detail = '';

    try {
      const json = bodyText ? JSON.parse(bodyText) : null;
      detail = json?.error || json?.message || '';
    } catch {
      detail = '';
    }

    const msgDetail = (detail || bodyText || '').trim();
    throw new Error(
      msgDetail
        ? `Prometheus error: ${res.status} ${res.statusText} (${msgDetail})`
        : `Prometheus error: ${res.status} ${res.statusText}`
    );
  }

  const json = await res.json();
  if (json.status !== 'success') {
    throw new Error(`Prometheus returned status: ${json.status}`);
  }

  return json.data.result as Array<{ metric: Record<string, string>; value: [number, string] }>;
}

function toMap(results: Array<{ metric: Record<string, string>; value: [number, string] }>) {
  const map: Record<string, number> = {};

  for (const r of results) {
    const user = r.metric.user || r.metric.username || r.metric.owner || r.metric.name || r.metric.account;
    if (user) map[user] = parseFloat(r.value[1]);
  }

  return map;
}

function calculateWeightedLoad(users: Array<{
  avgUtilPct: number | null;
  gpuHoursAlloc: number | null;
  gpuHoursEffective: number | null;
}>) {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const user of users) {
    const utilization = user.avgUtilPct;
    const allocWeight = user.gpuHoursAlloc ?? user.gpuHoursEffective ?? null;
    const weight = allocWeight !== null && Number.isFinite(allocWeight) ? Math.max(0, allocWeight) : 0;

    if (utilization === null || !Number.isFinite(utilization) || weight <= 0) continue;

    weightedSum += utilization * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? weightedSum / weightTotal : null;
}

function deriveLoadState(weightedLoad: number | null) {
  const load = Number.isFinite(weightedLoad ?? Number.NaN)
    ? Math.max(0, Math.min(100, weightedLoad as number))
    : null;

  if (load === null) {
    return { state: 'offline', label: 'OFFLINE', percent: null };
  }

  if (load < 40) {
    return { state: 'idle', label: 'IDLE', percent: Math.round(load) };
  }

  if (load < 75) {
    return { state: 'busy', label: 'BUSY', percent: Math.round(load) };
  }

  return { state: 'overloaded', label: 'OVERLOADED', percent: Math.round(load) };
}

function jsonResponse(payload: unknown, statusCode = 200) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET({ url }: { url: URL }) {
  const lookback = url.searchParams.get('lookback') || '7d';
  const minHoursRaw = parseFloat(url.searchParams.get('min_hours') || '5');
  const minHours = Number.isFinite(minHoursRaw) ? minHoursRaw : 5;

  try {
    const [utilResults, allocResults, effectiveResults] = await Promise.all([
      queryPrometheus(`avg by (user) (avg_over_time(slurm_job_utilization_gpu[${lookback}]))`),
      queryPrometheus(`sum by (user) (count_over_time(slurm_job_utilization_gpu[${lookback}])) / 240`),
      queryPrometheus(`sum by (user) (sum_over_time(slurm_job_utilization_gpu[${lookback}])) / 100 / 240`),
    ]);

    const utilMap = toMap(utilResults);
    const allocMap = toMap(allocResults);
    const effectiveMap = toMap(effectiveResults);

    const allUsers = new Set([
      ...Object.keys(utilMap),
      ...Object.keys(allocMap),
      ...Object.keys(effectiveMap),
    ]);

    const users = [] as Array<{
      user: string;
      avgUtilPct: number | null;
      gpuHoursAlloc: number | null;
      gpuHoursEffective: number | null;
      gpuHoursWasted: number | null;
    }>;

    for (const user of allUsers) {
      const avgUtil = utilMap[user] ?? null;
      const hoursAlloc = allocMap[user] ?? null;
      const hoursEffective = effectiveMap[user] ?? null;

      users.push({
        user,
        avgUtilPct: avgUtil !== null ? Math.round(avgUtil * 10) / 10 : null,
        gpuHoursAlloc: hoursAlloc !== null ? Math.round(hoursAlloc * 10) / 10 : null,
        gpuHoursEffective: hoursEffective !== null ? Math.round(hoursEffective * 10) / 10 : null,
        gpuHoursWasted:
          hoursAlloc !== null && hoursEffective !== null
            ? Math.round((hoursAlloc - hoursEffective) * 10) / 10
            : null,
      });
    }

    users.sort((a, b) => (b.avgUtilPct ?? -1) - (a.avgUtilPct ?? -1));

    const leaderboard = users.filter((u) => u.avgUtilPct !== null).slice(0, 10);
    const wallOfShame = users
      .filter((u) => u.gpuHoursAlloc !== null && u.gpuHoursAlloc >= minHours)
      .sort((a, b) => (a.avgUtilPct ?? 100) - (b.avgUtilPct ?? 100))
      .slice(0, 20);

    const weightedLoad = calculateWeightedLoad(users);

    return jsonResponse({
      ok: true,
      lookback,
      minHours,
      fetchedAt: new Date().toISOString(),
      clusterStatus: deriveLoadState(weightedLoad),
      loadBasis: weightedLoad === null ? 'offline' : 'gpu-hours-weighted',
      leaderboard,
      wallOfShame,
      allUsers: users,
    });
  } catch (err) {
    console.error('gpu-metrics route error:', err);
    return jsonResponse(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown GPU metrics error',
      },
      200
    );
  }
}
