import type { APIRoute } from "astro";

type PrometheusResult = {
  metric: Record<string, string>;
  value?: [number, string];
};

type RankedUser = {
  username: string;
  efficiency: number;
  usage: number;
};

type PrometheusResponse = {
  status?: string;
  data?: {
    result?: PrometheusResult[];
  };
};

const DEFAULT_RANKING_QUERY =
  "topk(10, avg by (user) (avg_over_time(slurm_job_utilization_gpu[7d])))";

const extractUsername = (metric: Record<string, string>): string => {
  return (
    metric.username ||
    metric.user ||
    metric.owner ||
    metric.name ||
    metric.account ||
    "unknown"
  );
};

const toNumber = (value?: [number, string]): number => {
  if (!value) return 0;
  const parsed = Number.parseFloat(value[1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getQueryEndpoint = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/api/v1/query")) {
    return normalized;
  }
  return `${normalized}/api/v1/query`;
};

const runPrometheusQuery = async (
  endpoint: string,
  token: string,
  query: string
): Promise<PrometheusResult[]> => {
  const url = new URL(endpoint);
  url.searchParams.set("query", query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-Auth-Token": token,
    },
  });
  // console.log(response);

  if (!response.ok) {
    throw new Error(`Prometheus request failed with ${response.status}`);
  }

  const payload = (await response.json()) as PrometheusResponse;
  if (payload.status !== "success") {
    throw new Error("Prometheus query failed");
  }

  return payload.data?.result ?? [];
};

const rankUsers = (series: PrometheusResult[]): RankedUser[] => {
  const users = new Map<string, RankedUser>();

  for (const point of series) {
    const username = extractUsername(point.metric);
    const efficiency = toNumber(point.value);
    users.set(username, {
      username,
      efficiency,
      // Keep frontend contract stable; this metric is the efficiency usage value.
      usage: efficiency,
    });
  }

  return [...users.values()].filter((item) => item.username !== "unknown");
};

export const GET: APIRoute = async () => {
  const prometheusUrl = import.meta.env.PROMETHEUS_URL;
  const prometheusToken = import.meta.env.PROMETHEUS_TOKEN;

  if (!prometheusUrl || !prometheusToken) {
    return new Response(
      JSON.stringify({
        leaderboard: [],
        loserboard: [],
        averageEfficiency: 0,
        error: "PROMETHEUS_URL and PROMETHEUS_TOKEN must be configured",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const rankingQuery =
    import.meta.env.PROMETHEUS_RANKING_QUERY ?? DEFAULT_RANKING_QUERY;

  try {
    const endpoint = getQueryEndpoint(prometheusUrl);
    const rankingSeries = await runPrometheusQuery(
      endpoint,
      prometheusToken,
      rankingQuery
    );

    const users = rankUsers(rankingSeries);
    const sorted = [...users].sort((a, b) => b.efficiency - a.efficiency);

    const leaderboard = sorted.slice(0, 5);
    const loserboard = [...sorted].reverse().slice(0, 5);
    const averageEfficiency =
      users.length > 0
        ? users.reduce((sum, user) => sum + user.efficiency, 0) / users.length
        : 0;

    return new Response(
      JSON.stringify({
        leaderboard,
        loserboard,
        averageEfficiency,
        updatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        leaderboard: [],
        loserboard: [],
        averageEfficiency: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
};
