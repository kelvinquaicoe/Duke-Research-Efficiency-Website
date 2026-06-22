import type { APIRoute } from "astro";

type PrometheusResult = {
  metric: Record<string, string>;
  value?: [number, string];
};

type PrometheusResponse = {
  status?: string;
  data?: {
    result?: PrometheusResult[];
  };
};

const DEFAULT_PROMETHEUS_BASE = "https://thanos-metrics.oit.duke.edu";

const getQueryEndpoint = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/api/v1/query")) return normalized;
  return `${normalized}/api/v1/query`;
};

const extractUser = (metric: Record<string, string>): string | null =>
  metric.user || metric.username || metric.owner || metric.name || metric.account || null;

const toMap = (results: PrometheusResult[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const result of results) {
    const user = extractUser(result.metric);
    const raw = result.value?.[1];
    if (!user || raw == null) continue;
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) map[user] = parsed;
  }
  return map;
};

const deriveLoadState = (weightedLoad: number | null) => {
  const load = Number.isFinite(weightedLoad ?? Number.NaN)
    ? Math.max(0, Math.min(100, weightedLoad as number))
    : null;

  if (load === null) {
    return {
      state: "offline",
      label: "OFFLINE",
      percent: null,
    };
  }

  if (load < 40) {
    return {
      state: "crawling",
      label: "CRAWLING",
      percent: Math.round(load),
    };
  }

  if (load < 75) {
    return {
      state: "cruising",
      label: "CRUISING",
      percent: Math.round(load),
    };
  }

  return {
    state: "blazing",
    label: "BLAZING",
    percent: Math.round(load),
  };
};

const calculateWeightedLoad = (
  users: Array<{
    avgUtilPct: number | null;
    gpuHoursAlloc: number | null;
    gpuHoursEffective: number | null;
  }>
): number | null => {
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
};

const runPrometheusQuery = async (
  endpoint: string,
  token: string | undefined,
  query: string
): Promise<PrometheusResult[]> => {
  const url = new URL(endpoint);
  url.searchParams.set("query", query);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Auth-Token"] = token;
  }

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    let detail = "";
    try {
      const json = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : null;
      const maybeMessage = json?.message;
      const maybeError = json?.error;
      detail =
        (typeof maybeError === "string" && maybeError) ||
        (typeof maybeMessage === "string" && maybeMessage) ||
        "";
    } catch {
      detail = "";
    }

    const msgDetail = (detail || bodyText || "").trim();
    throw new Error(
      msgDetail
        ? `Prometheus request failed with ${response.status}: ${msgDetail}`
        : `Prometheus request failed with ${response.status}`
    );
  }

  const payload = (await response.json()) as PrometheusResponse;
  if (payload.status !== "success") {
    throw new Error("Prometheus query failed");
  }

  return payload.data?.result ?? [];
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lookback = url.searchParams.get("lookback") || "7d";
  const minHoursRaw = Number.parseFloat(url.searchParams.get("min_hours") || "5");
  const minHours = Number.isFinite(minHoursRaw) ? minHoursRaw : 5;

  const prometheusBase =
    import.meta.env.PROMETHEUS_URL || DEFAULT_PROMETHEUS_BASE;
  const prometheusToken = import.meta.env.PROMETHEUS_TOKEN;
  const endpoint = getQueryEndpoint(prometheusBase);

  try {
    const [utilResults, allocResults, effectiveResults] = await Promise.all([
      runPrometheusQuery(
        endpoint,
        prometheusToken,
        `avg by (user) (avg_over_time(slurm_job_utilization_gpu[${lookback}]))`
      ),
      runPrometheusQuery(
        endpoint,
        prometheusToken,
        `sum by (user) (count_over_time(slurm_job_utilization_gpu[${lookback}])) / 240`
      ),
      runPrometheusQuery(
        endpoint,
        prometheusToken,
        `sum by (user) (sum_over_time(slurm_job_utilization_gpu[${lookback}])) / 100 / 240`
      ),
    ]);

    const utilMap = toMap(utilResults);
    const allocMap = toMap(allocResults);
    const effectiveMap = toMap(effectiveResults);

    const allUsers = new Set([
      ...Object.keys(utilMap),
      ...Object.keys(allocMap),
      ...Object.keys(effectiveMap),
    ]);

    const users = [...allUsers].map((user) => {
      const avgUtil = utilMap[user] ?? null;
      const hoursAlloc = allocMap[user] ?? null;
      const hoursEffective = effectiveMap[user] ?? null;

      return {
        user,
        avgUtilPct: avgUtil !== null ? Math.round(avgUtil * 10) / 10 : null,
        gpuHoursAlloc:
          hoursAlloc !== null ? Math.round(hoursAlloc * 10) / 10 : null,
        gpuHoursEffective:
          hoursEffective !== null ? Math.round(hoursEffective * 10) / 10 : null,
        gpuHoursWasted:
          hoursAlloc !== null && hoursEffective !== null
            ? Math.round((hoursAlloc - hoursEffective) * 10) / 10
            : null,
      };
    });

    users.sort((a, b) => (b.avgUtilPct ?? -1) - (a.avgUtilPct ?? -1));

    const leaderboard = users.filter((u) => u.avgUtilPct !== null).slice(0, 10);
    const wallOfShame = users
      .filter((u) => u.gpuHoursAlloc !== null && u.gpuHoursAlloc >= minHours)
      .sort((a, b) => (a.avgUtilPct ?? 100) - (b.avgUtilPct ?? 100))
      .slice(0, 20);

    const weightedLoad = calculateWeightedLoad(users);

    return new Response(
      JSON.stringify({
        ok: true,
        lookback,
        minHours,
        fetchedAt: new Date().toISOString(),
        clusterStatus: deriveLoadState(weightedLoad),
        loadBasis: weightedLoad === null ? 'offline' : 'gpu-hours-weighted',
        leaderboard,
        wallOfShame,
        allUsers: users,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
};
