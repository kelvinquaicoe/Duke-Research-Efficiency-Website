# Duke GPU Monitor MCP (Continue)

This is a tiny local MCP server that lets Continue call Duke's Grafana/Prometheus APIs without hardcoding tokens in your repo.

## 1) Rotate your tokens

You pasted live tokens in chat. Assume they're compromised and rotate/revoke them before continuing.

## 2) Add secrets to Continue

Create or edit `~/.continue/.env`:

```bash
GRAFANA_TOKEN=...
PROMETHEUS_TOKEN=...
PROMETHEUS_BASE_URL=https://prometheus.cs.duke.edu
GRAFANA_BASE_URL=https://prometheus.cs.duke.edu
```

Notes:
- The server also accepts `PROM_TOKEN` as an alias for `PROMETHEUS_TOKEN`.
- If you use Thanos instead, set `PROMETHEUS_BASE_URL` accordingly.

## 3) Enable the MCP server for this repo

This repo includes `.continue/mcpServers/duke-gpu-monitor.yaml`. Continue should auto-detect it when you open the workspace.

If it doesn't show up, restart VS Code and/or reload Continue.

## 4) Try it in Continue

Ask Continue:

- "Use `grafana_dashboard_promql` for uid `gpu-user-leaderboard` and list the panels + expressions."
- "Run `prometheus_query` with: `slurm_job_utilization_gpu` and show what labels are available."
- "Use `prometheus_series` to discover labels for `{__name__=\"slurm_job_utilization_gpu\"}`."

