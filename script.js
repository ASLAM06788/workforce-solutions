const WHATSAPP_NUMBER = "918609955837";
const SUPABASE_URL = "https://yvuljyujtrycwoxhnzyi.supabase.co";
const SUPABASE_KEY = "sb_publishable_jCR-jZAEWg3d1rNRcOiV3A_23F-knpG";

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle?.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

async function insertRow(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Database request failed");
  }
}

async function fetchActiveJobs() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workforce_jobs?is_active=eq.true&select=*&order=created_at.desc`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error("Could not load jobs");
  return res.json();
}

document.getElementById("whatsappFloat")?.addEventListener("click", (event) => {
  event.preventDefault();
  openWhatsApp("Hello Workforce Solutions, I would like to know more about your manpower and recruitment services.");
});

document.getElementById("employerForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const original = button?.textContent;
  if (button) { button.disabled = true; button.textContent = "Saving requirement..."; }

  const row = {
    contact_name: document.getElementById("eName").value.trim(),
    company_name: document.getElementById("eCompany").value.trim(),
    phone: document.getElementById("ePhone").value.trim(),
    work_location: document.getElementById("eLocation").value.trim(),
    role_title: document.getElementById("eRole").value.trim(),
    manpower_count: Number(document.getElementById("eCount").value),
    employment_type: document.getElementById("eType").value,
    industry: document.getElementById("eCategory").value,
    salary_budget: document.getElementById("eSalary").value.trim() || null,
    required_by: document.getElementById("eTimeline").value.trim() || null,
    details: document.getElementById("eDetails").value.trim() || null
  };

  let saved = true;
  try { await insertRow("workforce_requirements", row); } catch (err) { console.error(err); saved = false; }

  const message = `Hello Workforce Solutions,\n\nI have a manpower requirement.\n\nEMPLOYER DETAILS\nName: ${row.contact_name}\nCompany: ${row.company_name}\nPhone: ${row.phone}\nWork Location: ${row.work_location}\n\nREQUIREMENT\nRole / Designation: ${row.role_title}\nManpower Required: ${row.manpower_count}\nEmployment Type: ${row.employment_type}\nIndustry: ${row.industry}\nSalary / Budget: ${row.salary_budget || "Not specified"}\nRequired By: ${row.required_by || "Not specified"}\nAdditional Details: ${row.details || "Not specified"}\n\nPlease contact me regarding this requirement.`;

  if (button) { button.disabled = false; button.textContent = original; }
  if (!saved) alert("Your WhatsApp enquiry will still open, but the database save could not be completed.");
  openWhatsApp(message);
});

document.getElementById("candidateForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const original = button?.textContent;
  if (button) { button.disabled = true; button.textContent = "Saving profile..."; }

  const row = {
    full_name: document.getElementById("cName").value.trim(),
    phone: document.getElementById("cPhone").value.trim(),
    location: document.getElementById("cLocation").value.trim(),
    qualification: document.getElementById("cQualification").value.trim() || null,
    preferred_job: document.getElementById("cJob").value,
    experience: document.getElementById("cExperience").value.trim() || null,
    skills: document.getElementById("cSkills").value.trim() || null
  };

  let saved = true;
  try { await insertRow("workforce_candidates", row); } catch (err) { console.error(err); saved = false; }

  const message = `Hello Workforce Solutions,\n\nI would like to register for job opportunities.\n\nCANDIDATE PROFILE\nName: ${row.full_name}\nPhone: ${row.phone}\nCurrent Location: ${row.location}\nQualification: ${row.qualification || "Not specified"}\nPreferred Job: ${row.preferred_job}\nExperience: ${row.experience || "Not specified"}\nSkills / Previous Work: ${row.skills || "Not specified"}\n\nI understand that registration does not guarantee placement.`;

  if (button) { button.disabled = false; button.textContent = original; }
  if (!saved) alert("Your WhatsApp registration will still open, but the database save could not be completed.");
  openWhatsApp(message);
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[ch]));
}

async function renderJobs() {
  const board = document.getElementById("liveJobs") || document.querySelector(".jobs-board");
  if (!board) return;
  try {
    const jobs = await fetchActiveJobs();
    if (!jobs.length) return;
    board.innerHTML = `<div class="jobs-board-head"><div><span>Live Opportunities</span><h3>Current openings</h3></div><span class="sample-badge">${jobs.length} active</span></div>${jobs.map(job => `<a class="job-row" href="#candidate"><div><span class="job-code">${(job.category || "JOB").slice(0,3).toUpperCase()}</span><p><strong>${escapeHtml(job.title || "Job Opening")}</strong><small>${escapeHtml([job.location, job.employment_type, job.salary].filter(Boolean).join(" • "))}</small></p></div><span>Register →</span></a>`).join("")}`;
  } catch (err) { console.error(err); }
}
renderJobs();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));