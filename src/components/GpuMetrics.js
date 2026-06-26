/**
 * GpuMetrics.js
 * Drop this into your Astro/JS project and call initGpuMetrics()
 * after the DOM is ready, or import mergeGpuMetricsIntoUsers() to
 * enrich your existing user roster with live Prometheus data.
 *
 * Usage (standalone):
 *   import { initGpuMetrics } from './GpuMetrics.js';
 *   initGpuMetrics({ mountId: 'gpu-metrics-root', lookback: '7d' });
 *
 * Usage (merge into existing user table):
 *   import { fetchGpuMetrics, mergeGpuMetricsIntoUsers } from './GpuMetrics.js';
 *   const metrics = await fetchGpuMetrics({ lookback: '7d' });
 *   const enrichedUsers = mergeGpuMetricsIntoUsers(myUsers, metrics.allUsers);
 */

const GPU_METRICS_ENDPOINT = "/api/gpu-metrics.json";

// ─── Data Fetching ────────────────────────────────────────────────────────────

export async function fetchGpuMetrics({ lookback = "7d", minHours = 5 } = {}) {
  const url = `${GPU_METRICS_ENDPOINT}?lookback=${encodeURIComponent(lookback)}&min_hours=${encodeURIComponent(String(minHours))}`;

  const res = await fetch(url);
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
    const err = new Error(
      msgDetail
        ? `Failed to fetch GPU metrics from ${GPU_METRICS_ENDPOINT}: ${res.status} (${msgDetail})`
        : `Failed to fetch GPU metrics from ${GPU_METRICS_ENDPOINT}: ${res.status}`
    );
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || data?.message || "Unknown API error");
  return data;
}

/**
 * Merges Prometheus GPU data into your existing user array.
 * Matches on username (case-insensitive).
 *
 * @param {Array} existingUsers - your current user objects (must have a .name or .username field)
 * @param {Array} gpuUsers      - allUsers array from fetchGpuMetrics()
 * @param {string} keyField     - field name on existingUsers to match against (default: 'name')
 */
export function mergeGpuMetricsIntoUsers(existingUsers, gpuUsers, keyField = "name") {
  const gpuMap = {};
  for (const gu of gpuUsers) {
    gpuMap[gu.user.toLowerCase()] = gu;
  }
  return existingUsers.map(u => {
    const key = (u[keyField] || "").toLowerCase();
    const gpu = gpuMap[key] || null;
    return {
      ...u,
      gpu: gpu ? {
        avgUtilPct:        gpu.avgUtilPct,
        gpuHoursAlloc:     gpu.gpuHoursAlloc,
        gpuHoursEffective: gpu.gpuHoursEffective,
        gpuHoursWasted:    gpu.gpuHoursWasted,
      } : null,
    };
  });
}

// ─── Standalone Widget ────────────────────────────────────────────────────────

export function initGpuMetrics({ mountId = "gpu-metrics-root", lookback = "7d", minHours = 5 } = {}) {
  const root = document.getElementById(mountId);
  if (!root) {
    console.warn(`GpuMetrics: no element with id="${mountId}" found`);
    return;
  }
  root.innerHTML = renderSkeleton();
  load(root, lookback, minHours);
}

async function load(root, lookback, minHours) {
  try {
    const data = await fetchGpuMetrics({ lookback, minHours });
    console.log("Fetched GPU metrics:", data);
    root.innerHTML = renderDashboard(data);
    attachLookbackControls(root, minHours);
  } catch (err) {
    root.innerHTML = renderError(err.message);
  }
}

function attachLookbackControls(root, minHours) {
  root.querySelectorAll("[data-lookback]").forEach(btn => {
    btn.addEventListener("click", () => {
      root.querySelectorAll("[data-lookback]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      root.innerHTML = renderSkeleton();
      load(root, btn.dataset.lookback, minHours);
    });
  });
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderSkeleton() {
  return `
    <div class="gm-loading">
      <div class="gm-spinner"></div>
      <span>Loading GPU metrics…</span>
    </div>`;
}

function renderError(msg) {
  return `
    <div class="gm-error">
      <strong>Could not load GPU metrics</strong>
      <p>${msg}</p>
      <p>Make sure the metrics endpoint is reachable (default: <code>/api/gpu-metrics.json</code>).</p>
    </div>`;
}

function utilColor(pct) {
  if (pct === null) return "#888";
  if (pct >= 60) return "var(--gm-green, #22c55e)";
  if (pct >= 30) return "var(--gm-yellow, #eab308)";
  return "var(--gm-red, #ef4444)";
}

function utilBar(pct) {
  const w = pct !== null ? Math.min(100, pct) : 0;
  const color = utilColor(pct);
  return `
    <div class="gm-bar-track">
      <div class="gm-bar-fill" style="width:${w}%;background:${color}"></div>
    </div>`;
}
function renderDashboard(data) {
  const lookbackOptions = ["1h", "6h", "24h", "7d", "14d", "30d"];

  return `
<div class="gm-dashboard">
  <div class="gm-header">
    <div class="gm-title">GPU Usage <span class="gm-subtitle">from Prometheus</span></div>
    <div class="gm-lookback-controls">
      ${lookbackOptions.map(l => `
        <button class="gm-lb-btn${l === data.lookback ? " active" : ""}" data-lookback="${l}">${l}</button>
      `).join("")}
    </div>
    <div class="gm-fetched">Updated ${new Date(data.fetchedAt).toLocaleTimeString()}</div>
  </div>

  <div class="gm-panels">
    <!-- Top Performers -->
    <div class="gm-panel">
      <div class="gm-panel-title">🏆 Most Efficient (avg GPU util)</div>
      <div class="gm-panel-desc">Top 10 users by average GPU utilization — higher = keeping GPUs busier</div>
      <table class="gm-table">
        <thead><tr><th>#</th><th>User</th><th>Avg Util</th><th></th></tr></thead>
        <tbody>
          ${data.leaderboard.map((u, i) => `
            <tr>
              <td class="gm-rank">${i + 1}</td>
              <td class="gm-user">${u.user}</td>
              <td class="gm-val" style="color:${utilColor(u.avgUtilPct)}">${u.avgUtilPct !== null ? u.avgUtilPct.toFixed(1) + "%" : "—"}</td>
              <td class="gm-bar-cell">${utilBar(u.avgUtilPct)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Wall of Shame -->
    <div class="gm-panel gm-panel-shame">
      <div class="gm-panel-title">⚠️ Underutilized Allocations</div>
      <div class="gm-panel-desc">Users with ≥ ${data.minHours} GPU-hours allocated but low utilization</div>
      <table class="gm-table">
        <thead><tr><th>User</th><th>Alloc'd</th><th>Effective</th><th>Avg Util</th></tr></thead>
        <tbody>
          ${data.wallOfShame.map(u => `
            <tr>
              <td class="gm-user">${u.user}</td>
              <td class="gm-val">${u.gpuHoursAlloc !== null ? u.gpuHoursAlloc.toFixed(1) + "h" : "—"}</td>
              <td class="gm-val gm-effective">${u.gpuHoursEffective !== null ? u.gpuHoursEffective.toFixed(1) + "h" : "—"}</td>
              <td class="gm-val" style="color:${utilColor(u.avgUtilPct)}">${u.avgUtilPct !== null ? u.avgUtilPct.toFixed(1) + "%" : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
.gm-dashboard { font-family: inherit; color: inherit; }
.gm-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.gm-title { font-size: 1.1rem; font-weight: 700; }
.gm-subtitle { font-weight: 400; opacity: 0.5; font-size: 0.85rem; }
.gm-fetched { font-size: 0.75rem; opacity: 0.4; margin-left: auto; }
.gm-lookback-controls { display: flex; gap: 0.25rem; }
.gm-lb-btn {
  padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid currentColor;
  opacity: 0.4; cursor: pointer; font-size: 0.8rem; background: transparent; color: inherit;
}
.gm-lb-btn.active { opacity: 1; background: var(--gm-accent, #6366f1); color: #fff; border-color: transparent; }
.gm-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media (max-width: 700px) { .gm-panels { grid-template-columns: 1fr; } }
.gm-panel { background: var(--gm-panel-bg, rgba(255,255,255,0.04)); border-radius: 8px; padding: 1rem; }
.gm-panel-title { font-weight: 600; margin-bottom: 0.25rem; }
.gm-panel-desc { font-size: 0.78rem; opacity: 0.5; margin-bottom: 0.75rem; }
.gm-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; border: 1px solid rgba(83,213,253,0.14); border-radius: 10px; overflow: hidden; }
.gm-table thead tr { background: rgba(83,213,253,0.08); }
.gm-table th { text-align: left; opacity: 0.8; font-weight: 600; padding: 0.6rem 0.65rem; border-bottom: 1px solid rgba(83,213,253,0.18); }
.gm-table tbody tr { border-bottom: 1px solid rgba(83,213,253,0.14); }
.gm-table tbody tr:last-child { border-bottom: none; }
.gm-table td { padding: 0.6rem 0.65rem; }
.gm-table tbody tr:hover { background: rgba(83,213,253,0.06); }
.gm-rank { opacity: 0.4; width: 1.5rem; }
.gm-user { font-weight: 500; }
.gm-val { font-variant-numeric: tabular-nums; }
.gm-effective { opacity: 0.7; }
.gm-bar-cell { width: 80px; }
.gm-bar-track { background: rgba(128,128,128,0.15); border-radius: 3px; height: 6px; }
.gm-bar-fill { height: 6px; border-radius: 3px; transition: width 0.4s ease; }
.gm-loading { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; opacity: 0.6; }
.gm-spinner { width: 18px; height: 18px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: gm-spin 0.7s linear infinite; }
@keyframes gm-spin { to { transform: rotate(360deg); } }
.gm-error { padding: 1rem; background: rgba(239,68,68,0.1); border-radius: 8px; border: 1px solid rgba(239,68,68,0.3); }
</style>`;
}
