#!/usr/bin/env node
/**
 * Minimal MCP server (stdio, newline-delimited JSON-RPC).
 *
 * Tools:
 * - grafana_dashboard_promql: Fetch dashboard JSON and extract PromQL expressions.
 * - prometheus_query: Run an instant Prometheus query.
 * - prometheus_series: Fetch series metadata for discovery.
 */

import process from "node:process";
import readline from "node:readline";

const SERVER_INFO = { name: "duke-gpu-monitor-mcp", version: "0.1.0" };
const PROTOCOL_VERSION = "2025-06-18";

const env = {
  grafanaBaseUrl:
    process.env.GRAFANA_BASE_URL ||
    process.env.GRAFANA_URL ||
    "https://prometheus.cs.duke.edu",
  grafanaToken: process.env.GRAFANA_TOKEN || process.env.GRAFANA_SA_TOKEN || "",
  prometheusBaseUrl:
    process.env.PROMETHEUS_BASE_URL ||
    process.env.PROMETHEUS_URL ||
    "https://prometheus.cs.duke.edu",
  prometheusToken:
    process.env.PROMETHEUS_TOKEN ||
    process.env.PROM_TOKEN ||
    process.env.PROMETHEUS_BEARER_TOKEN ||
    "",
};

function writeMessage(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

function asError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error");
}

function makeJsonRpcError(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : null),
    },
  };
}

async function fetchJson(url, { headers } = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
  return await res.json();
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectGrafanaPanels(panels, out) {
  if (!Array.isArray(panels)) return;
  for (const panel of panels) {
    if (!isObject(panel)) continue;
    out.push(panel);
    // Rows and nested panels vary by Grafana version/datasource.
    if (Array.isArray(panel.panels)) collectGrafanaPanels(panel.panels, out);
    if (Array.isArray(panel.targets)) {
      // no-op
    }
  }
}

function extractPromqlFromDashboard(dashboardJson) {
  const dashboard = isObject(dashboardJson?.dashboard) ? dashboardJson.dashboard : dashboardJson;
  const topPanels = Array.isArray(dashboard?.panels) ? dashboard.panels : [];
  const allPanels = [];
  collectGrafanaPanels(topPanels, allPanels);

  const extracted = [];
  for (const panel of allPanels) {
    const title = typeof panel.title === "string" ? panel.title : "(untitled)";
    const targets = Array.isArray(panel.targets) ? panel.targets : [];
    for (const t of targets) {
      if (!isObject(t)) continue;
      const expr = typeof t.expr === "string" ? t.expr : null;
      if (!expr) continue;
      extracted.push({
        panelTitle: title,
        refId: typeof t.refId === "string" ? t.refId : null,
        expr,
      });
    }
  }

  return extracted;
}

async function grafanaDashboardPromql(args) {
  const uidFromUrl =
    typeof args?.url === "string"
      ? args.url.match(/\/api\/dashboards\/uid\/([^/?#]+)/)?.[1] ?? null
      : null;

  const uid =
    (typeof args?.uid === "string" && args.uid.trim()) ||
    uidFromUrl ||
    "gpu-user-leaderboard";

  const url =
    (typeof args?.url === "string" && args.url.trim()) ||
    `${env.grafanaBaseUrl.replace(/\/+$/, "")}/api/dashboards/uid/${encodeURIComponent(uid)}`;

  const headers = { Accept: "application/json" };
  if (env.grafanaToken) headers.Authorization = `Bearer ${env.grafanaToken}`;

  const json = await fetchJson(url, { headers });
  const extracted = extractPromqlFromDashboard(json);
  return {
    dashboardUid: uid,
    dashboardUrl: url,
    count: extracted.length,
    items: extracted,
  };
}

async function prometheusQuery(args) {
  const expr = typeof args?.expr === "string" ? args.expr : "";
  if (!expr.trim()) throw new Error("Missing required argument: expr");

  const baseUrl =
    (typeof args?.baseUrl === "string" && args.baseUrl.trim()) || env.prometheusBaseUrl;

  const endpoint = baseUrl.replace(/\/+$/, "");
  const url = new URL(`${endpoint}/api/v1/query`);
  url.searchParams.set("query", expr);
  if (typeof args?.time === "number" && Number.isFinite(args.time)) {
    url.searchParams.set("time", String(args.time));
  }

  const headers = { Accept: "application/json" };
  if (env.prometheusToken) {
    headers.Authorization = `Bearer ${env.prometheusToken}`;
    headers["X-Auth-Token"] = env.prometheusToken;
  }

  const json = await fetchJson(url, { headers });
  return json;
}

async function prometheusSeries(args) {
  const matchers = Array.isArray(args?.matchers) ? args.matchers : [];
  if (matchers.length === 0) throw new Error("Missing required argument: matchers[]");

  const baseUrl =
    (typeof args?.baseUrl === "string" && args.baseUrl.trim()) || env.prometheusBaseUrl;

  const endpoint = baseUrl.replace(/\/+$/, "");
  const url = new URL(`${endpoint}/api/v1/series`);
  for (const m of matchers) {
    if (typeof m === "string" && m.trim()) url.searchParams.append("match[]", m);
  }
  if (typeof args?.start === "number" && Number.isFinite(args.start)) {
    url.searchParams.set("start", String(args.start));
  }
  if (typeof args?.end === "number" && Number.isFinite(args.end)) {
    url.searchParams.set("end", String(args.end));
  }

  const headers = { Accept: "application/json" };
  if (env.prometheusToken) {
    headers.Authorization = `Bearer ${env.prometheusToken}`;
    headers["X-Auth-Token"] = env.prometheusToken;
  }

  const json = await fetchJson(url, { headers });
  return json;
}

const TOOLS = [
  {
    name: "grafana_dashboard_promql",
    description:
      "Fetch a Grafana dashboard (via /api/dashboards/uid/:uid) and extract PromQL expressions from panels/targets.",
    inputSchema: {
      type: "object",
      properties: {
        uid: {
          type: "string",
          description: "Grafana dashboard UID (e.g. gpu-user-leaderboard).",
        },
        url: {
          type: "string",
          description:
            "Full URL to the Grafana dashboard API endpoint (overrides baseUrl+uid).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "prometheus_query",
    description:
      "Run an instant Prometheus query (GET /api/v1/query). Returns the raw Prometheus JSON response.",
    inputSchema: {
      type: "object",
      properties: {
        expr: { type: "string", description: "PromQL expression." },
        baseUrl: { type: "string", description: "Prometheus base URL (optional)." },
        time: {
          type: "number",
          description: "Evaluation timestamp (unix seconds, optional).",
        },
      },
      required: ["expr"],
      additionalProperties: false,
    },
  },
  {
    name: "prometheus_series",
    description:
      "Fetch series metadata (GET /api/v1/series). Useful for discovering labels like job_id, node, gpu_type, etc.",
    inputSchema: {
      type: "object",
      properties: {
        matchers: {
          type: "array",
          items: { type: "string" },
          description: 'Prometheus match[] selectors, e.g. ["slurm_job_utilization_gpu"] or ["{__name__=\\"slurm_job_utilization_gpu\\"}"].',
        },
        baseUrl: { type: "string", description: "Prometheus base URL (optional)." },
        start: { type: "number", description: "Start time (unix seconds, optional)." },
        end: { type: "number", description: "End time (unix seconds, optional)." },
      },
      required: ["matchers"],
      additionalProperties: false,
    },
  },
];

async function handleRequest(msg) {
  const { id, method, params } = msg || {};

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments;

    let result;
    if (name === "grafana_dashboard_promql") result = await grafanaDashboardPromql(args);
    else if (name === "prometheus_query") result = await prometheusQuery(args);
    else if (name === "prometheus_series") result = await prometheusSeries(args);
    else throw new Error(`Unknown tool: ${String(name)}`);

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      },
    };
  }

  // Gracefully ignore notifications or unknown methods.
  if (id === undefined) return null;
  return makeJsonRpcError(id, -32601, `Method not found: ${String(method)}`);
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (err) {
    // No id to respond with, ignore malformed input.
    return;
  }

  try {
    const response = await handleRequest(msg);
    if (response) writeMessage(response);
  } catch (err) {
    const e = asError(err);
    if (msg?.id !== undefined) {
      writeMessage(makeJsonRpcError(msg.id, -32000, e.message));
    }
  }
});

rl.on("close", () => process.exit(0));

