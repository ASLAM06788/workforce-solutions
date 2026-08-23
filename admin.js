const API = "https://yvuljyujtrycwoxhnzyi.supabase.co/functions/v1/workforce-admin-api";
const TOKEN_KEY = "workforce_admin_token";
const ADMIN_KEY = "workforce_admin_id";

const $ = id => document.getElementById(id);
const state = { candidates: [], requirements: [], jobs: [] };

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

async function api(action, payload = {}, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(API, { method: "POST", headers, body: JSON.stringify({ action, ...payload }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) signOut(false);
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function setBusy(btn, busy, text = "Please wait...") {
  if (!btn) return;
  if (busy) { btn.dataset.original = btn.textContent; btn.textContent = text; btn.disabled = true; }
  else { btn.textContent = btn.dataset.original || btn.textContent; btn.disabled = false; }
}

function showSetup() { $("loginCard").classList.add("hidden"); $("setupCard").classList.remove("hidden"); $("setupError").textContent = ""; }
function showLogin() { $("setupCard").classList.add("hidden"); $("loginCard").classList.remove("hidden"); $("loginError").textContent = ""; }
$("showSetup").addEventListener("click", showSetup);
$("showLogin").addEventListener("click", showLogin);

$("setupForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector("button[type=submit]");
  const id = $("setupId").value.trim().toUpperCase();
  const code = $("setupCode").value.trim();
  const password = $("setupPassword").value;
  const confirm = $("setupConfirm").value;
  $("setupError").textContent = "";
  if (!["ASLAM","ADMIN"].includes(id)) { $("setupError").textContent = "Use the Admin ID assigned to you."; return; }
  if (password.length < 10) { $("setupError").textContent = "Password must be at least 10 characters."; return; }
  if (password !== confirm) { $("setupError").textContent = "Passwords do not match."; return; }
  try {
    setBusy(btn, true, "Activating...");
    await api("setup", { admin_id: id, setup_code: code, password }, false);
    alert("Admin activated successfully. You can now sign in.");
    $("loginId").value = id;
    $("setupForm").reset();
    showLogin();
  } catch (err) { $("setupError").textContent = err.message; }
  finally { setBusy(btn, false); }
});

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector("button[type=submit]");
  $("loginError").textContent = "";
  try {
    setBusy(btn, true, "Signing in...");
    const data = await api("login", { admin_id: $("loginId").value.trim().toUpperCase(), password: $("loginPassword").value }, false);
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(ADMIN_KEY, data.admin_id);
    $("loginPassword").value = "";
    await enterDashboard();
  } catch (err) { $("loginError").textContent = err.message; }
  finally { setBusy(btn, false); }
});

async function enterDashboard() {
  try {
    const data = await api("dashboard");
    $("authPage").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("adminIdentity").textContent = data.admin_id;
    $("candidateCount").textContent = data.counts.candidates;
    $("requirementCount").textContent = data.counts.requirements;
    $("jobCount").textContent = data.counts.active_jobs;
  } catch { signOut(false); }
}

async function signOut(callApi = true) {
  if (callApi) { try { await api("logout"); } catch {} }
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
  $("dashboard").classList.add("hidden");
  $("authPage").classList.remove("hidden");
  showLogin();
}
$("logoutBtn").addEventListener("click", () => signOut(true));

const pageTitles = { overview: "Dashboard Overview", candidates: "Candidate Database", requirements: "Employer Requirements", jobs: "Job Openings" };
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.querySelectorAll(".view").forEach(x => x.classList.add("hidden"));
    $(`view-${view}`).classList.remove("hidden");
    $("pageTitle").textContent = pageTitles[view];
    if (view === "candidates") await loadCandidates();
    if (view === "requirements") await loadRequirements();
    if (view === "jobs") await loadJobs();
    if (view === "overview") await refreshCounts();
  });
});

const candidateStatuses = ["new","screening","shortlisted","interview","selected","joined","rejected","hold"];
const requirementStatuses = ["new","contacted","sourcing","shortlisted","fulfilled","closed","hold"];
function statusOptions(list, current) { return list.map(x => `<option value="${x}" ${x === current ? "selected" : ""}>${x.replaceAll("_"," ")}</option>`).join(""); }

async function loadCandidates() {
  const tbody = $("candidateRows");
  tbody.innerHTML = `<tr><td colspan="6" class="empty">Loading candidates...</td></tr>`;
  try { const { data } = await api("candidates.list"); state.candidates = data || []; renderCandidates(); }
  catch (err) { tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}

function renderCandidates() {
  const q = $("candidateSearch").value.trim().toLowerCase();
  const rows = state.candidates.filter(c => [c.full_name,c.phone,c.preferred_job,c.location,c.qualification].some(v => String(v||"").toLowerCase().includes(q)));
  $("candidateRows").innerHTML = rows.length ? rows.map(c => `<tr><td><strong>${escapeHtml(c.full_name)}</strong><small>${escapeHtml(c.phone)}${c.email ? " • "+escapeHtml(c.email) : ""}</small><small>${new Date(c.created_at).toLocaleString()}</small></td><td><strong>${escapeHtml(c.preferred_job || "Not specified")}</strong><small>${escapeHtml(c.location || "—")}</small><small>${escapeHtml(c.qualification || "")}</small></td><td>${escapeHtml(c.experience || "—")}<small>${escapeHtml(c.skills || "")}</small></td><td><select class="status-select" id="c-status-${c.id}">${statusOptions(candidateStatuses,c.status)}</select></td><td><textarea class="note-input" id="c-notes-${c.id}" placeholder="Private notes">${escapeHtml(c.notes || "")}</textarea></td><td><button class="save-btn" data-save-candidate="${c.id}">Save</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty">No matching candidates.</td></tr>`;
  document.querySelectorAll("[data-save-candidate]").forEach(btn => btn.addEventListener("click", () => saveCandidate(Number(btn.dataset.saveCandidate), btn)));
}

async function saveCandidate(id, btn) {
  try {
    btn.disabled = true; btn.textContent = "Saving";
    await api("candidates.update", { id, status: $(`c-status-${id}`).value, notes: $(`c-notes-${id}`).value });
    btn.textContent = "Saved ✓";
    setTimeout(() => { btn.disabled = false; btn.textContent = "Save"; }, 900);
  } catch (err) { alert(err.message); btn.disabled = false; btn.textContent = "Save"; }
}

async function loadRequirements() {
  const tbody = $("requirementRows");
  tbody.innerHTML = `<tr><td colspan="6" class="empty">Loading requirements...</td></tr>`;
  try { const { data } = await api("requirements.list"); state.requirements = data || []; renderRequirements(); }
  catch (err) { tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`; }
}

function renderRequirements() {
  const q = $("requirementSearch").value.trim().toLowerCase();
  const rows = state.requirements.filter(r => [r.company_name,r.contact_name,r.phone,r.role_title,r.work_location,r.industry].some(v => String(v||"").toLowerCase().includes(q)));
  $("requirementRows").innerHTML = rows.length ? rows.map(r => `<tr><td><strong>${escapeHtml(r.company_name)}</strong><small>${escapeHtml(r.contact_name)} • ${escapeHtml(r.phone)}</small><small>${new Date(r.created_at).toLocaleString()}</small></td><td><strong>${escapeHtml(r.role_title || "Not specified")}</strong><small>${escapeHtml(r.manpower_count || "—")} people • ${escapeHtml(r.work_location || "—")}</small><small>${escapeHtml(r.industry || "")} ${r.employment_type ? "• "+escapeHtml(r.employment_type) : ""}</small></td><td>${escapeHtml(r.salary_budget || "Budget not stated")}<small>Required: ${escapeHtml(r.required_by || "Not stated")}</small><small>${escapeHtml(r.details || "")}</small></td><td><select class="status-select" id="r-status-${r.id}">${statusOptions(requirementStatuses,r.status)}</select></td><td><textarea class="note-input" id="r-notes-${r.id}" placeholder="Private notes">${escapeHtml(r.notes || "")}</textarea></td><td><button class="save-btn" data-save-requirement="${r.id}">Save</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty">No matching requirements.</td></tr>`;
  document.querySelectorAll("[data-save-requirement]").forEach(btn => btn.addEventListener("click", () => saveRequirement(Number(btn.dataset.saveRequirement), btn)));
}

async function saveRequirement(id, btn) {
  try {
    btn.disabled = true; btn.textContent = "Saving";
    await api("requirements.update", { id, status: $(`r-status-${id}`).value, notes: $(`r-notes-${id}`).value });
    btn.textContent = "Saved ✓";
    setTimeout(() => { btn.disabled = false; btn.textContent = "Save"; }, 900);
  } catch (err) { alert(err.message); btn.disabled = false; btn.textContent = "Save"; }
}

async function loadJobs() {
  $("jobRows").innerHTML = `<div class="empty">Loading jobs...</div>`;
  try { const { data } = await api("jobs.list"); state.jobs = data || []; renderJobs(); }
  catch (err) { $("jobRows").innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`; }
}

function renderJobs() {
  $("jobRows").innerHTML = state.jobs.length ? state.jobs.map(j => `<article class="job-card"><div><h3>${escapeHtml(j.title)}</h3><p>${escapeHtml([j.category,j.location,j.employment_type,j.salary].filter(Boolean).join(" • "))}</p><small>${j.openings ? escapeHtml(j.openings)+" opening(s) • " : ""}${escapeHtml(j.description || "")}</small></div><div class="job-actions"><button class="toggle-btn ${j.is_active ? "active" : ""}" data-toggle-job="${j.id}" data-next="${!j.is_active}">${j.is_active ? "Active" : "Inactive"}</button></div></article>`).join("") : `<div class="empty">No jobs published yet.</div>`;
  document.querySelectorAll("[data-toggle-job]").forEach(btn => btn.addEventListener("click", async () => { try { await api("jobs.update", { id: Number(btn.dataset.toggleJob), is_active: btn.dataset.next === "true" }); await loadJobs(); await refreshCounts(); } catch (err) { alert(err.message); } }));
}

$("jobForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.currentTarget.querySelector("button[type=submit]");
  $("jobError").textContent = "";
  try {
    setBusy(btn, true, "Publishing...");
    await api("jobs.create", { title: $("jobTitle").value.trim(), category: $("jobCategory").value.trim() || null, openings: $("jobOpenings").value ? Number($("jobOpenings").value) : null, location: $("jobLocation").value.trim() || null, employment_type: $("jobType").value.trim() || null, salary: $("jobSalary").value.trim() || null, description: $("jobDescription").value.trim() || null, is_active: true });
    e.currentTarget.reset(); await loadJobs(); await refreshCounts();
  } catch (err) { $("jobError").textContent = err.message; }
  finally { setBusy(btn, false); }
});

async function refreshCounts() {
  const data = await api("dashboard");
  $("candidateCount").textContent = data.counts.candidates;
  $("requirementCount").textContent = data.counts.requirements;
  $("jobCount").textContent = data.counts.active_jobs;
}

$("candidateSearch").addEventListener("input", renderCandidates);
$("requirementSearch").addEventListener("input", renderRequirements);
$("refreshCandidates").addEventListener("click", loadCandidates);
$("refreshRequirements").addEventListener("click", loadRequirements);
$("refreshJobs").addEventListener("click", loadJobs);

if (sessionStorage.getItem(TOKEN_KEY)) enterDashboard();