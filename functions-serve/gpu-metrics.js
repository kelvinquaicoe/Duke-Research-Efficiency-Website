/**
 * Netlify Function: gpu-metrics.js
 * Proxies Prometheus queries for GPU user leaderboard data.
 *
 * Deploy to: netlify/functions/gpu-metrics.js
 * Accessible at: /.netlify/functions/gpu-metrics?lookback=7d&min_hours=5
 *
 * Set PROMETHEUS_URL in Netlify environment variables (defaults to Duke's Thanos),
 * e.g.:
 *   https://thanos-metrics.oit.duke.edu
 */

const PROMETHEUS_BASE =
  process.env.PROMETHEUS_URL || "https://thanos-metrics.oit.duke.edu";
const PROMETHEUS_TOKEN = process.env.PROMETHEUS_TOKEN;

async function queryPrometheus(expr) {
  const url = `${PROMETHEUS_BASE}/api/v1/query?query=${encodeURIComponent(expr)}`;
  const headers = { Accept: "application/json" };
  if (PROMETHEUS_TOKEN) {
    headers.Authorization = `Bearer ${PROMETHEUS_TOKEN}`;
    headers["X-Auth-Token"] = PROMETHEUS_TOKEN;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    let detail = "";
    try {
      const json = bodyText ? JSON.parse(bodyText) : null;
      detail = json?.error || json?.message || "";
    } catch {
      detail = "";
    }

    const msgDetail = (detail || bodyText || "").trim();
    throw new Error(
      msgDetail
        ? `Prometheus error: ${res.status} ${res.statusText} (${msgDetail})`
        : `Prometheus error: ${res.status} ${res.statusText}`
    );
  }
  const json = await res.json();
  if (json.status !== "success") throw new Error(`Prometheus returned status: ${json.status}`);
  return json.data.result; // Array of { metric: { user }, value: [timestamp, "value"] }
}

function toMap(results) {
  const map = {};
  for (const r of results) {
    const user = r.metric.user || r.metric.username || r.metric.owner || r.metric.name || r.metric.account;
    if (user) map[user] = parseFloat(r.value[1]);
  }
  return map;
}

export async function handler(event) {
  const params = event.queryStringParameters || {};
  const lookback = params.lookback || "7d";
  const minHoursRaw = parseFloat(params.min_hours || "5");
  const minHours = Number.isFinite(minHoursRaw) ? minHoursRaw : 5;

  try {
    const [utilResults, allocResults, effectiveResults] = await Promise.all([
      // Avg GPU utilization % per user
      queryPrometheus(`avg by (user) (avg_over_time(slurm_job_utilization_gpu[${lookback}]))`),
      // GPU-hours allocated per user
      queryPrometheus(`sum by (user) (count_over_time(slurm_job_utilization_gpu[${lookback}])) / 240`),
      // Effective GPU-hours (utilization-weighted) per user
      queryPrometheus(`sum by (user) (sum_over_time(slurm_job_utilization_gpu[${lookback}])) / 100 / 240`),
    ]);

    const utilMap      = toMap(utilResults);
    const allocMap     = toMap(allocResults);
    const effectiveMap = toMap(effectiveResults);

    // Merge all users across all three metrics
    const allUsers = new Set([
      ...Object.keys(utilMap),
      ...Object.keys(allocMap),
      ...Object.keys(effectiveMap),
    ]);

    const users = [];
    for (const user of allUsers) {
      const avgUtil      = utilMap[user]      ?? null;
      const hoursAlloc   = allocMap[user]     ?? null;
      const hoursEffective = effectiveMap[user] ?? null;

      users.push({
        user,
        avgUtilPct:       avgUtil      !== null ? Math.round(avgUtil * 10) / 10 : null,
        gpuHoursAlloc:    hoursAlloc   !== null ? Math.round(hoursAlloc * 10) / 10 : null,
        gpuHoursEffective: hoursEffective !== null ? Math.round(hoursEffective * 10) / 10 : null,
        // Wasted hours = allocated - effective
        gpuHoursWasted:   (hoursAlloc !== null && hoursEffective !== null)
                            ? Math.round((hoursAlloc - hoursEffective) * 10) / 10
                            : null,
      });
    }

    // Sort by avg utilization descending for the leaderboard
    users.sort((a, b) => (b.avgUtilPct ?? -1) - (a.avgUtilPct ?? -1));

    // Separate: top performers vs underutilized (wall of shame)
    const leaderboard = users
      .filter(u => u.avgUtilPct !== null)
      .slice(0, 10);

    const wallOfShame = users
      .filter(u => u.gpuHoursAlloc !== null && u.gpuHoursAlloc >= minHours)
      .sort((a, b) => (a.avgUtilPct ?? 100) - (b.avgUtilPct ?? 100))
      .slice(0, 20);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
      body: JSON.stringify({
        ok: true,
        lookback,
        minHours,
        fetchedAt: new Date().toISOString(),
        leaderboard,
        wallOfShame,
        allUsers: users,
      }),
    };
  } catch (err) {
    console.error("gpu-metrics error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
