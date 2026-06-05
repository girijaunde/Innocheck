/**
 * InnoCheck UI — auth, sidebar sessions, analysis modes, prototype + Sandpack.
 * Serve this folder over HTTP (e.g. python -m http.server 8080) so ES modules + Sandpack work.
 */
import { destroySandpack, mountSandpack } from "./sandpack-preview.js";

const API_BASE = "http://127.0.0.1:8000";
const LS_TOKEN = "innocheck_token";
const LS_SESSION = "innocheck_session_id";

const problemInput = document.getElementById("problem");
const analyzeBtn = document.getElementById("analyzeBtn");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const btnNewChat = document.getElementById("btnNewChat");
const sessionListEl = document.getElementById("sessionList");
const authPanel = document.getElementById("authPanel");
const userBar = document.getElementById("userBar");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const btnLogout = document.getElementById("btnLogout");
const userEmailSpan = document.getElementById("userEmail");

const tabs = document.querySelectorAll(".tab");
const panelValidate = document.getElementById("panel-validate");
const panelPrototype = document.getElementById("panel-prototype");

const protoFramework = document.getElementById("protoFramework");
const protoTemplate = document.getElementById("protoTemplate");
const protoAutoTpl = document.getElementById("protoAutoTpl");
const protoDesc = document.getElementById("protoDesc");
const protoGenerateBtn = document.getElementById("protoGenerateBtn");
const protoCopyProblemBtn = document.getElementById("protoCopyProblemBtn");
const protoLoading = document.getElementById("protoLoading");
const protoOutput = document.getElementById("protoOutput");
const protoIframe = document.getElementById("protoIframe");
const protoNoPreview = document.getElementById("protoNoPreview");
const protoPreviewHint = document.getElementById("protoPreviewHint");
const protoCode = document.getElementById("protoCode");
const protoExplain = document.getElementById("protoExplain");
const protoDownloadBtn = document.getElementById("protoDownloadBtn");
const protoCopyBtn = document.getElementById("protoCopyBtn");
const protoExplainBtn = document.getElementById("protoExplainBtn");
const protoRefine = document.getElementById("protoRefine");
const protoRefineBtn = document.getElementById("protoRefineBtn");
const protoHistoryList = document.getElementById("protoHistoryList");

let protoState = { code: "", framework: "html", filename: "index.html" };
let currentMode = "full";

function getToken() {
  return localStorage.getItem(LS_TOKEN);
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function getSessionId() {
  const s = localStorage.getItem(LS_SESSION);
  return s ? parseInt(s, 10) : null;
}

function setSessionId(id) {
  if (id == null) localStorage.removeItem(LS_SESSION);
  else localStorage.setItem(LS_SESSION, String(id));
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    problemInput.value = chip.textContent.trim();
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const name = tab.getAttribute("data-tab");
    panelValidate.classList.toggle("hidden", name !== "validate");
    panelPrototype.classList.toggle("hidden", name !== "prototype");
  });
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.getAttribute("data-mode") || "full";
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active-feature"));
    btn.classList.add("active-feature");
  });
});

async function refreshSessions() {
  if (!getToken()) {
    sessionListEl.innerHTML = '<p class="muted small">Log in to see chat history.</p>';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/sessions`, { headers: authHeaders() });
    if (!res.ok) throw new Error("sessions");
    const data = await res.json();
    const items = data.items || [];
    sessionListEl.innerHTML = items.length
      ? items
          .map(
            (s) => `
        <button type="button" class="session-item" data-session-id="${s.id}">
          <span class="session-title">${escapeHtml(s.title || "Chat")}</span>
          <span class="muted small">${escapeHtml((s.preview || "").slice(0, 60))}</span>
        </button>`,
          )
          .join("")
      : '<p class="muted small">No chats yet. Click New chat.</p>';
    sessionListEl.querySelectorAll(".session-item").forEach((el) => {
      el.addEventListener("click", () => {
        const sid = parseInt(el.getAttribute("data-session-id"), 10);
        setSessionId(sid);
        loadSessionMessages(sid);
      });
    });
  } catch {
    sessionListEl.innerHTML = '<p class="muted small">Could not load sessions.</p>';
  }
}

async function loadSessionMessages(sessionId) {
  if (!getToken()) return;
  try {
    const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, { headers: authHeaders() });
    if (!res.ok) throw new Error("messages");
    const data = await res.json();
    const items = data.items || [];
    if (!items.length) {
      results.innerHTML = `<section class="card"><p class="muted">Empty session — add an idea below.</p></section>`;
      results.classList.remove("hidden");
      return;
    }
    const last = items[items.length - 1];
    const ar = await fetch(`${API_BASE}/api/problem-results/${last.id}`, { headers: authHeaders() });
    if (ar.ok) {
      const payload = await ar.json();
      renderResults(payload, "full");
    } else {
      problemInput.value = last.text;
    }
  } catch {
    showError("Could not load session.");
  }
}

function showError(msg) {
  results.innerHTML = `<section class="card error-card"><h3>Something went wrong</h3><p>${escapeHtml(msg)}</p></section>`;
  results.classList.remove("hidden");
}

async function runValidate() {
  const text = problemInput.value.trim();
  if (text.length < 15) {
    alert("Enter at least 15 characters (max 500).");
    return;
  }
  if (text.length > 500) {
    alert("Maximum length is 500 characters.");
    return;
  }
  loading.classList.remove("hidden");
  results.classList.add("hidden");

  const body = { problem_statement: text, mode: currentMode };
  const sid = getSessionId();
  if (getToken() && sid) body.session_id = sid;

  try {
    const res = await fetch(`${API_BASE}/api/validate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || res.statusText || "Request failed");
    }
    if (data.session_id) setSessionId(data.session_id);
    renderResults(data, currentMode);
    refreshSessions();
    refreshProtoHistory();
  } catch (e) {
    showError(e.message || "Analysis failed. Is the API running?");
  } finally {
    loading.classList.add("hidden");
  }
}

analyzeBtn.addEventListener("click", runValidate);

btnNewChat.addEventListener("click", async () => {
  results.innerHTML = "";
  results.classList.add("hidden");
  problemInput.value = "";
  if (!getToken()) {
    alert("Log in to start a saved chat.");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title: null }),
    });
    if (!res.ok) throw new Error("Could not create session");
    const data = await res.json();
    setSessionId(data.id);
    await refreshSessions();
  } catch {
    alert("Could not start new chat.");
  }
});

function renderResults(data, mode) {
  const show = {
    score: mode === "full" || mode === "uniqueness",
    gaps: mode === "full" || mode === "gaps",
    similar: mode === "full" || mode === "similar",
    suggestion: mode === "full" || mode === "suggestion",
    literature: mode === "full" || mode === "literature",
  };

  let html = "";

  if (show.score && data.uniqueness_score != null) {
    html += `
    <section class="card">
      <h2>Analysis</h2>
      ${data.saved === false ? '<p class="muted small">Not saved — log in to store history.</p>' : ""}
      <div class="score">${data.uniqueness_score}%</div>
      <p><strong>${escapeHtml(data.score_label)}</strong> — ${escapeHtml(data.score_description)}</p>
      <div class="grid">
        <div class="metric">Novelty: ${data.dimensions?.novelty ?? "—"}</div>
        <div class="metric">Feasibility: ${data.dimensions?.feasibility ?? "—"}</div>
        <div class="metric">Impact: ${data.dimensions?.impact ?? "—"}</div>
        <div class="metric">Market gap: ${data.dimensions?.market_gap ?? "—"}</div>
      </div>
    </section>`;
  }

  if (show.gaps && data.innovation_gaps?.length) {
    html += `<section class="card"><h3>Innovation gaps</h3>`;
    html += data.innovation_gaps
      .map(
        (g) => `
      <div class="metric">
        <p><strong>${escapeHtml(g.title)}${g.is_primary ? " (Primary)" : ""}</strong></p>
        <p><em>Existing:</em> ${escapeHtml(g.existing)}</p>
        <p><em>Opportunity:</em> ${escapeHtml(g.opportunity)}</p>
      </div>`,
      )
      .join("");
    html += `</section>`;
  }

  if (show.similar && data.similar_papers?.length) {
    html += `<section class="card"><h3>Similar works</h3><ul>`;
    html += data.similar_papers
      .map((p) => `<li>${escapeHtml(p.title)} (${p.year || "N/A"}) — ${p.similarity}%</li>`)
      .join("");
    html += `</ul></section>`;
  }

  if (show.suggestion && data.unique_suggestion) {
    html += `<section class="card"><h3>Unique suggestion</h3>
      <p><strong>${escapeHtml(data.unique_suggestion.title)}</strong></p>
      <p>${escapeHtml(data.unique_suggestion.description)}</p>
      <p class="tags">${(data.unique_suggestion.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ")}</p>
    </section>`;
  }

  if (show.suggestion && data.tech_stack?.length) {
    html += `<section class="card"><h3>Tech stack</h3><div class="grid">`;
    html += data.tech_stack
      .map((c) => `<div class="metric"><strong>${escapeHtml(c.category)}</strong><br/>${(c.items || []).map(escapeHtml).join(", ")}</div>`)
      .join("");
    html += `</div></section>`;
  }

  if (show.literature && data.literature_review) {
    const lr = data.literature_review;
    html += `<section class="card"><h3>Literature review</h3>
      <p>${lr.split("\n").map(escapeHtml).join("<br/>")}</p>
      <div class="row-actions" style="margin-top:12px">
        <button type="button" class="secondary" id="lrCopy">Copy</button>
        <button type="button" class="secondary" id="lrDownload">Download .txt</button>
      </div>
    </section>`;
  }

  results.innerHTML = html || '<section class="card"><p class="muted">No content for this mode.</p></section>';
  results.classList.remove("hidden");

  document.getElementById("lrCopy")?.addEventListener("click", () => {
    navigator.clipboard.writeText(data.literature_review || "").then(() => alert("Copied."));
  });
  document.getElementById("lrDownload")?.addEventListener("click", () => {
    downloadText("literature_review.txt", data.literature_review || "");
  });
}

async function loadPrototypeTemplates() {
  try {
    const res = await fetch(`${API_BASE}/api/prototype/templates`);
    if (!res.ok) throw new Error("templates");
    const data = await res.json();
    protoTemplate.innerHTML = (data.templates || [])
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)} — ${escapeHtml(t.description || "")}</option>`,
      )
      .join("");
  } catch {
    protoTemplate.innerHTML = '<option value="generic">Generic MVP</option>';
  }
}

async function refreshProtoHistory() {
  if (!getToken()) {
    protoHistoryList.innerHTML = '<li class="muted">Log in to see saved prototypes.</li>';
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/prototype/history/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error("hist");
    const data = await res.json();
    const items = data.items || [];
    protoHistoryList.innerHTML = items.length
      ? items
          .map(
            (e) =>
              `<li><button type="button" class="linkish" data-proto-id="${e.id}">${escapeHtml(e.framework)} — ${escapeHtml(e.description)}</button></li>`,
          )
          .join("")
      : '<li class="muted">No prototypes yet.</li>';
    protoHistoryList.querySelectorAll("[data-proto-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-proto-id");
        const r = await fetch(`${API_BASE}/api/prototype/saved/${id}`, { headers: authHeaders() });
        if (r.ok) {
          const d = await r.json();
          applyProtoResponse(d);
        }
      });
    });
  } catch {
    protoHistoryList.innerHTML = '<li class="muted">Could not load history.</li>';
  }
}

protoCopyProblemBtn.addEventListener("click", () => {
  protoDesc.value = problemInput.value.trim();
});

protoGenerateBtn.addEventListener("click", async () => {
  const desc = protoDesc.value.trim();
  if (desc.length < 10) {
    alert("Enter at least 10 characters.");
    return;
  }
  protoLoading.classList.remove("hidden");
  protoOutput.classList.add("hidden");
  protoExplain.classList.add("hidden");

  const body = {
    description: desc,
    framework: protoFramework.value,
    auto_template: protoAutoTpl.checked,
  };
  if (!protoAutoTpl.checked) body.template_id = protoTemplate.value;

  try {
    const res = await fetch(`${API_BASE}/api/prototype/generate`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Generation failed");
    if (!data.gemini_configured) {
      console.warn("GEMINI_API_KEY not set — using fallback snippets.");
    }
    await applyProtoResponse(data);
    refreshProtoHistory();
  } catch (e) {
    alert(e.message || "Generation failed.");
  } finally {
    protoLoading.classList.add("hidden");
  }
});

async function applyProtoResponse(data) {
  const files = data.files || [];
  const want = data.primary_file || "";
  const primary = files.find((f) => (f.filename || "") === want) || files[0] || {};
  if (primary.content) protoState.code = primary.content;
  if (data.framework) protoState.framework = data.framework;
  protoState.filename = primary.filename || data.primary_file || protoState.filename || "index.html";

  protoCode.textContent = protoState.code;
  protoOutput.classList.remove("hidden");

  destroySandpack();
  protoIframe.removeAttribute("srcdoc");

  const fw = protoState.framework;
  const isHtml =
    fw === "html" ||
    (protoState.filename || "").endsWith(".html") ||
    protoState.code.trim().startsWith("<!DOCTYPE") ||
    protoState.code.trim().startsWith("<html");

  if (isHtml && protoState.code) {
    protoIframe.classList.remove("hidden");
    protoNoPreview.classList.add("hidden");
    protoIframe.srcdoc = protoState.code;
    protoPreviewHint.textContent = "HTML preview";
    return;
  }

  if (fw === "react" || fw === "vue") {
    protoNoPreview.classList.add("hidden");
    protoIframe.classList.remove("hidden");
    protoPreviewHint.textContent = `${fw.toUpperCase()} (Sandpack)`;
    try {
      await mountSandpack(protoIframe, fw, protoState.code);
    } catch (e) {
      console.error(e);
      protoPreviewHint.textContent = "Sandpack failed — see code below. Serve site over HTTP (not file://).";
      protoIframe.classList.add("hidden");
      protoNoPreview.classList.remove("hidden");
    }
    return;
  }

  protoIframe.classList.add("hidden");
  protoNoPreview.classList.remove("hidden");
  protoPreviewHint.textContent = "Python — copy and run locally";
}

protoDownloadBtn.addEventListener("click", () => {
  if (!protoState.code) return;
  downloadText(protoState.filename || "prototype.txt", protoState.code);
});

protoCopyBtn.addEventListener("click", () => {
  if (!protoState.code) return;
  navigator.clipboard.writeText(protoState.code).then(() => alert("Copied."));
});

protoExplainBtn.addEventListener("click", async () => {
  if (!protoState.code) return;
  protoExplainBtn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/api/prototype/explain`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ code: protoState.code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "explain failed");
    protoExplain.textContent = data.explanation || "";
    protoExplain.classList.remove("hidden");
  } catch {
    protoExplain.textContent = "Could not load explanation.";
    protoExplain.classList.remove("hidden");
  } finally {
    protoExplainBtn.disabled = false;
  }
});

protoRefineBtn.addEventListener("click", async () => {
  const instruction = protoRefine.value.trim();
  if (!instruction || !protoState.code) {
    alert("Enter a refinement instruction and generate code first.");
    return;
  }
  protoLoading.classList.remove("hidden");
  try {
    const res = await fetch(`${API_BASE}/api/prototype/refine`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        framework: protoState.framework,
        code: protoState.code,
        instruction,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "refine failed");
    const files = data.files || [];
    const primary = files[0] || {};
    protoState.code = primary.content || protoState.code;
    protoState.filename = primary.filename || protoState.filename;
    protoCode.textContent = protoState.code;
    protoRefine.value = "";
    const f0 = (data.files && data.files[0]) || {};
    await applyProtoResponse({
      files: data.files,
      framework: protoState.framework,
      primary_file: f0.filename || protoState.filename,
    });
  } catch (e) {
    alert(e.message || "Refinement failed.");
  } finally {
    protoLoading.classList.add("hidden");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Login failed");
    localStorage.setItem(LS_TOKEN, data.access_token);
    updateAuthUI();
    await refreshSessions();
    await refreshProtoHistory();
  } catch (err) {
    alert(err.message);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Register failed");
    localStorage.setItem(LS_TOKEN, data.access_token);
    updateAuthUI();
    await refreshSessions();
    await refreshProtoHistory();
  } catch (err) {
    alert(err.message);
  }
});

btnLogout.addEventListener("click", () => {
  localStorage.removeItem(LS_TOKEN);
  setSessionId(null);
  updateAuthUI();
  sessionListEl.innerHTML = '<p class="muted small">Log in to see chat history.</p>';
  protoHistoryList.innerHTML = '<li class="muted">Log in to see saved prototypes.</li>';
});

function updateAuthUI() {
  const t = getToken();
  if (t) {
    authPanel.classList.add("hidden");
    userBar.classList.remove("hidden");
    userEmailSpan.textContent = "(logged in)";
    fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((u) => {
        userEmailSpan.textContent = u.email || "";
      })
      .catch(() => {});
  } else {
    authPanel.classList.remove("hidden");
    userBar.classList.add("hidden");
  }
}

loadPrototypeTemplates();
updateAuthUI();
refreshSessions();
refreshProtoHistory();
