const API_BASE = localStorage.getItem("innocheck_api_base") || "http://127.0.0.1:8000";
const TOKEN_KEY = "innocheck_token";

const statsGrid = document.getElementById("statsGrid");
const topicsChart = document.getElementById("topicsChart");
const gapsChart = document.getElementById("gapsChart");
const compareOptions = document.getElementById("compareOptions");
const compareBtn = document.getElementById("compareBtn");
const compareResults = document.getElementById("compareResults");
const recentList = document.getElementById("recentList");

let recentAnalyses = [];

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value == null ? "" : String(value);
  return node.innerHTML;
}

function renderBars(target, items, keyField, valueField) {
  if (!items.length) {
    target.innerHTML = '<p class="muted">No data yet.</p>';
    return;
  }
  const max = Math.max(...items.map((item) => item[valueField] || 0), 1);
  target.innerHTML = items
    .map((item) => {
      const width = Math.max(8, Math.round(((item[valueField] || 0) / max) * 100));
      return `
        <div class="bar-row">
          <span>${escapeHtml(item[keyField])}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <strong>${escapeHtml(item[valueField])}</strong>
        </div>`;
    })
    .join("");
}

function renderStats(stats) {
  const entries = [
    ["Total analyses", stats.total_analyses ?? 0],
    ["Average uniqueness", stats.average_uniqueness_score ?? 0],
    ["Saved prototypes", stats.saved_prototypes ?? 0],
    ["Top uniqueness", stats.top_uniqueness_score ?? 0],
  ];
  statsGrid.innerHTML = entries
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <div class="muted small">${escapeHtml(label)}</div>
          <div class="stat-value">${escapeHtml(value)}</div>
        </div>`,
    )
    .join("");
}

function renderRecent(items) {
  recentAnalyses = items;
  if (!items.length) {
    recentList.innerHTML = '<p class="muted">No saved analyses yet.</p>';
    compareOptions.innerHTML = '<p class="muted">Run and save a few analyses first.</p>';
    return;
  }
  recentList.innerHTML = items
    .map(
      (item) => `
        <div class="metric">
          <strong>${escapeHtml(item.text)}</strong>
          <p class="muted small">Uniqueness: ${escapeHtml(item.uniqueness_score)} | ${escapeHtml(item.score_label || "")}</p>
        </div>`,
    )
    .join("");

  compareOptions.innerHTML = items
    .map(
      (item) => `
        <label class="chk">
          <input type="checkbox" data-problem-id="${item.problem_id}" />
          <span>${escapeHtml(item.text)}</span>
        </label>`,
    )
    .join("");
}

async function loadDashboard() {
  const response = await fetch(`${API_BASE}/api/dashboard/overview`, { headers: authHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Could not load dashboard");
  }
  renderStats(data.stats || {});
  renderBars(topicsChart, data.trending_topics || [], "topic", "count");
  renderBars(gapsChart, data.top_gaps || [], "title", "count");
  renderRecent(data.recent_analyses || []);
}

compareBtn.addEventListener("click", async () => {
  const selected = Array.from(compareOptions.querySelectorAll("input[type='checkbox']:checked")).map((node) =>
    parseInt(node.getAttribute("data-problem-id"), 10),
  );
  if (selected.length < 2 || selected.length > 3) {
    alert("Select 2 or 3 ideas.");
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/compare`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ problem_ids: selected }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Comparison failed");

    const summary = data.summary || {};
    const items = data.items || [];
    compareResults.innerHTML = `
      <div class="metric">
        <strong>Best idea problem id:</strong> ${escapeHtml(summary.best_problem_id || "N/A")}<br/>
        <strong>Best uniqueness:</strong> ${escapeHtml(summary.best_uniqueness_score || "N/A")}<br/>
        <strong>Average uniqueness:</strong> ${escapeHtml(summary.average_uniqueness_score || "N/A")}<br/>
        <strong>Common primary gap:</strong> ${escapeHtml(summary.most_common_primary_gap || "N/A")}
      </div>
      <div class="compare-grid">
        ${items
          .map(
            (item) => `
              <div class="metric">
                <strong>${escapeHtml(item.text)}</strong>
                <p class="muted small">Uniqueness: ${escapeHtml(item.uniqueness_score)} | ${escapeHtml(item.score_label || "")}</p>
                <p><strong>Primary gap:</strong> ${escapeHtml(item.primary_gap || "N/A")}</p>
                <p><strong>Suggestion:</strong> ${escapeHtml(item.suggestion_title || "N/A")}</p>
                <p><strong>Top similar:</strong> ${escapeHtml((item.top_similar_titles || []).join(", "))}</p>
              </div>`,
          )
          .join("")}
      </div>`;
  } catch (error) {
    compareResults.innerHTML = `<p class="muted">${escapeHtml(error.message || "Comparison failed.")}</p>`;
  }
});

loadDashboard().catch((error) => {
  statsGrid.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  topicsChart.innerHTML = "";
  gapsChart.innerHTML = "";
});
