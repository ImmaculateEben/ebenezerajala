/* ================================================================
   admin.js — Complete Portfolio CMS Controller
   ================================================================ */
import {
  loadSiteContent,
  saveSiteContent,
  loadProjects,
  saveProject,
  deleteProject,
  loadTestimonials,
  saveTestimonial,
  deleteTestimonial,
  loadMessages,
  updateMessageStatus,
  uploadProfileImage,
  uploadProjectImage,
  uploadTestimonialImage,
  exportStateSnapshot,
  importStateSnapshot,
  seedRemoteContent,
  getAvailableTechStacks,
  getContentRuntimeMode
} from "./content-service.js";

import {
  signInAdmin,
  signOutAdmin,
  onAdminAuthChanged,
  isSupabaseReady
} from "./supabase-config.js";

import { escapeHtml, sanitizePlainText } from "./security.js";

/* ── state ──────────────────────────────────────────────────────── */
let currentUser = null;
let siteContent = null;
let projects = [];
let testimonials = [];
let messages = [];
let techStacks = [];

/* ── DOM refs ───────────────────────────────────────────────────── */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

/* ── Init ───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  techStacks = getAvailableTechStacks();
  setupAuth();
  setupNavigation();
  setupMobileMenu();
  setupQuickActions();
});

/* ================================================================
   AUTH
   ================================================================ */
function setupAuth() {
  const overlay = $("#admin-login-overlay");
  const shell = $("#admin-shell");
  const form = $("#admin-login-form");
  const errBox = $("#admin-login-error");
  const closeBtn = $("#admin-login-close");

  if (!isSupabaseReady()) {
    // Offline / demo mode: skip login
    overlay.hidden = true;
    shell.hidden = false;
    currentUser = { email: "demo@local" };
    showRuntimeBanner();
    loadAll();
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const submitBtn = $("#admin-login-submit");
    const origLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…';
    submitBtn.disabled = true;
    const email = $("#admin-email").value.trim();
    const pw = $("#admin-password").value;
    try {
      await signInAdmin(email, pw);
    } catch (err) {
      errBox.textContent = err.message || "Sign-in failed.";
      errBox.hidden = false;
    } finally {
      submitBtn.innerHTML = origLabel;
      submitBtn.disabled = false;
    }
  });

  // Password visibility toggle
  const pwToggle = $("#admin-pw-toggle");
  if (pwToggle) {
    pwToggle.addEventListener("click", () => {
      const pwInput = $("#admin-password");
      const icon = pwToggle.querySelector("i");
      if (pwInput.type === "password") {
        pwInput.type = "text";
        icon.className = "fa-solid fa-eye-slash";
      } else {
        pwInput.type = "password";
        icon.className = "fa-solid fa-eye";
      }
    });
  }

  // Local mode bypass
  const localModeBtn = $("#admin-local-mode-btn");
  if (localModeBtn) {
    localModeBtn.addEventListener("click", () => {
      overlay.hidden = true;
      shell.hidden = false;
      currentUser = { email: "local@demo" };
      showRuntimeBanner();
      loadAll();
    });
  }

  closeBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  onAdminAuthChanged((user) => {
    currentUser = user;
    if (user) {
      overlay.hidden = true;
      shell.hidden = false;
      showRuntimeBanner();
      loadAll();
    } else {
      overlay.hidden = false;
      shell.hidden = true;
    }
  });

  $("#admin-logout-btn").addEventListener("click", async () => {
    await signOutAdmin();
    window.location.reload();
  });
}

function showRuntimeBanner() {
  const banner = $("#admin-runtime-banner");
  const mode = getContentRuntimeMode();
  if (mode === "supabase") {
    banner.innerHTML = `<i class="fa-solid fa-cloud"></i> Connected to Supabase — changes sync remotely.`;
  } else {
    banner.innerHTML = `<i class="fa-solid fa-hard-drive"></i> Running in local-only mode — data is saved in your browser.`;
  }
}

/* ================================================================
   DATA LOADING
   ================================================================ */
async function loadAll() {
  try {
    [siteContent, projects, testimonials, messages] = await Promise.all([
      loadSiteContent(),
      loadProjects(),
      loadTestimonials(),
      loadMessages()
    ]);
  } catch (e) {
    console.error("loadAll error:", e);
  }
  renderOverview();
  renderMessages();
  populateHeroForm();
  populateProfileForm();
  renderProjectsTable();
  renderFilterCategories();
  populateSkillsForm();
  renderExpTable();
  renderEduTable();
  renderTestimonialsTable();
  populatePagesForm();
  renderMediaPanel();
  populateSettingsForm();
  setupImportExport();
}

/* ================================================================
   NAVIGATION
   ================================================================ */
function setupNavigation() {
  const navBtns = $$(".admin-nav-btn");
  const sections = $$(".admin-section");
  const topTitle = $("#topbar-title");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach((s) => {
        s.hidden = s.dataset.panel !== target;
      });
      if (topTitle) topTitle.textContent = btn.querySelector("span")?.textContent || "Dashboard";
      closeMobileMenu();
    });
  });
}

function setupQuickActions() {
  $$("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.jump;
      const navBtn = $(`.admin-nav-btn[data-section="${target}"]`);
      if (navBtn) navBtn.click();
    });
  });
}

/* ================================================================
   MOBILE MENU
   ================================================================ */
function setupMobileMenu() {
  const toggle = $("#admin-menu-toggle");
  const sidebar = $("#admin-sidebar");
  const backdrop = $("#admin-sidebar-backdrop");

  toggle?.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    backdrop.classList.toggle("visible", open);
    toggle.classList.toggle("is-open", open);
  });

  backdrop?.addEventListener("click", closeMobileMenu);
}

function closeMobileMenu() {
  const sidebar = $("#admin-sidebar");
  const backdrop = $("#admin-sidebar-backdrop");
  const toggle = $("#admin-menu-toggle");
  sidebar?.classList.remove("open");
  backdrop?.classList.remove("visible");
  toggle?.classList.remove("is-open");
}

/* ================================================================
   OVERVIEW
   ================================================================ */
function renderOverview() {
  const p = siteContent?.profile || {};
  setKPI("kpi-projects", projects.length);
  setKPI("kpi-featured", projects.filter((x) => x.featured).length);
  setKPI("kpi-unread", messages.filter((m) => m.status === "new").length);
  setKPI("kpi-testimonials", testimonials.length);
  setKPI("kpi-email", p.email || "—");
  setKPI("kpi-availability", p.availableForFreelance ? "Available" : "Not available");

  // Badge
  const unread = messages.filter((m) => m.status === "new").length;
  const badge = $("#nav-badge-messages");
  if (badge) badge.textContent = unread > 0 ? unread : "";
}

function setKPI(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ================================================================
   MESSAGES
   ================================================================ */
function renderMessages() {
  const tbody = $("#msg-tbody");
  if (!tbody) return;
  tbody.innerHTML = messages
    .map((m) => {
      const cls = m.status === "new" ? "row-unread" : "";
      const badge = m.status === "new" ? "badge-unread" : m.status === "archived" ? "badge-archived" : "badge-read";
      return `<tr class="${cls}" data-id="${escapeHtml(m.id)}">
        <td data-label="Name">${escapeHtml(m.name)}</td>
        <td data-label="Email">${escapeHtml(m.email)}</td>
        <td data-label="Subject">${escapeHtml(m.subject || "(no subject)")}</td>
        <td data-label="Date">${formatDate(m.createdAt)}</td>
        <td data-label="Status"><span class="badge-sm ${badge}">${escapeHtml(m.status)}</span></td>
        <td class="row-actions">
          <button title="View" class="msg-view"><i class="fa-solid fa-eye"></i></button>
          ${m.status === "new" ? `<button title="Mark read" class="msg-read"><i class="fa-solid fa-check"></i></button>` : ""}
          ${m.status !== "archived" ? `<button title="Archive" class="msg-archive"><i class="fa-solid fa-box-archive"></i></button>` : ""}
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".msg-view")?.addEventListener("click", () => showMessage(id));
    row.querySelector(".msg-read")?.addEventListener("click", async () => {
      await updateMessageStatus(id, "read");
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
    row.querySelector(".msg-archive")?.addEventListener("click", async () => {
      await updateMessageStatus(id, "archived");
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
  });
}

function showMessage(id) {
  const m = messages.find((x) => x.id === id);
  const detail = $("#msg-detail");
  if (!m || !detail) return;
  detail.innerHTML = `
    <h4>${escapeHtml(m.subject || "(no subject)")}</h4>
    <p><strong>${escapeHtml(m.name)}</strong> &lt;${escapeHtml(m.email)}&gt;<br><small>${formatDate(m.createdAt)}</small></p>
    <hr style="border-color:var(--border-color);margin:.75rem 0">
    <p style="white-space:pre-wrap">${escapeHtml(m.message)}</p>`;

  if (m.status === "new") {
    updateMessageStatus(id, "read").then(async () => {
      messages = await loadMessages();
      renderMessages();
      renderOverview();
    });
  }
}

/* ================================================================
   HERO SECTION
   ================================================================ */
function populateHeroForm() {
  const p = siteContent?.profile || {};
  setVal("hero-name", p.name);
  setVal("hero-titles", (p.animatedTitles || []).join(", "));
  setVal("hero-tagline", p.tagline);
  setVal("hero-years", p.yearsExperience);
  setVal("hero-clients", p.clientsServed);
  setVal("hero-speed", p.avgSpeedImprovement);
  setVal("hero-traffic", p.avgTrafficIncrease);
  setChecked("hero-available", p.availableForFreelance);
  setVal("hero-linkedin", p.linkedin);
  setVal("hero-github-url", p.github);
  setVal("hero-github-user", p.githubUsername);
  updateHeroPreview();

  $("#hero-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.profile.name = getVal("hero-name");
    siteContent.profile.animatedTitles = getVal("hero-titles").split(",").map((s) => s.trim()).filter(Boolean);
    siteContent.profile.tagline = getVal("hero-tagline");
    siteContent.profile.yearsExperience = getVal("hero-years");
    siteContent.profile.clientsServed = getVal("hero-clients");
    siteContent.profile.avgSpeedImprovement = getVal("hero-speed");
    siteContent.profile.avgTrafficIncrease = getVal("hero-traffic");
    siteContent.profile.availableForFreelance = getChecked("hero-available");
    siteContent.profile.linkedin = getVal("hero-linkedin");
    siteContent.profile.github = getVal("hero-github-url");
    siteContent.profile.githubUsername = getVal("hero-github-user");
    await saveSiteContent(siteContent);
    flash("hero-status", "Hero saved!");
    updateHeroPreview();
    renderOverview();
  });
}

function updateHeroPreview() {
  const box = $("#hero-preview");
  if (!box) return;
  const p = siteContent?.profile || {};
  box.innerHTML = `
    <strong>${escapeHtml(p.name)}</strong>
    <p>${escapeHtml(p.tagline || "")}</p>
    <p><small>Titles: ${escapeHtml((p.animatedTitles || []).join(" | "))}</small></p>
    <p><small>Stats: ${escapeHtml(p.yearsExperience)} yrs, ${escapeHtml(p.clientsServed)} clients</small></p>`;
}

/* ================================================================
   PROFILE / ABOUT
   ================================================================ */
function populateProfileForm() {
  const p = siteContent?.profile || {};
  setVal("profile-bio1", p.bio);
  setVal("profile-bio2", p.bio2);
  setVal("profile-bio3", p.bio3);
  setVal("profile-location", p.location);
  setVal("profile-email", p.email);
  setVal("profile-phone1", p.phone1);
  setVal("profile-phone2", p.phone2);
  setImgPreview("profile-img-preview", p.profileImage);
  setImgPreview("profile-preview-img", p.profileImage);

  // File preview
  $("#profile-img-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "profile-img-preview");
  });

  $("#profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = $("#profile-img-file")?.files[0];
    if (file) {
      try {
        siteContent.profile.profileImage = await uploadProfileImage(file);
      } catch (err) {
        flash("profile-status", "Image upload failed: " + err.message, true);
      }
    }
    siteContent.profile.bio = getVal("profile-bio1");
    siteContent.profile.bio2 = getVal("profile-bio2");
    siteContent.profile.bio3 = getVal("profile-bio3");
    siteContent.profile.location = getVal("profile-location");
    siteContent.profile.email = getVal("profile-email");
    siteContent.profile.phone1 = getVal("profile-phone1");
    siteContent.profile.phone2 = getVal("profile-phone2");
    await saveSiteContent(siteContent);
    flash("profile-status", "Profile saved!");
    setImgPreview("profile-preview-img", siteContent.profile.profileImage);
    renderOverview();
  });
}

/* ================================================================
   PROJECTS
   ================================================================ */
function renderProjectsTable() {
  const tbody = $("#proj-tbody");
  if (!tbody) return;
  tbody.innerHTML = projects
    .map((p) => {
      const typeBadge = p.featured ? `<span class="badge-sm badge-featured">Featured</span>` : `<span class="badge-sm badge-draft">Standard</span>`;
      return `<tr data-id="${escapeHtml(p.id)}">
        <td data-label="Project">${escapeHtml(p.title)}</td>
        <td data-label="Tags">${(p.tags || []).map((t) => escapeHtml(t)).join(", ")}</td>
        <td data-label="Type">${typeBadge}</td>
        <td class="row-actions">
          <button title="Edit" class="proj-edit"><i class="fa-solid fa-pen"></i></button>
          <button title="Delete" class="proj-del danger"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".proj-edit")?.addEventListener("click", () => editProject(id));
    row.querySelector(".proj-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this project?")) return;
      await deleteProject(id);
      projects = await loadProjects();
      renderProjectsTable();
      renderOverview();
    });
  });

  // Image preview
  $("#proj-img-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "proj-img-preview");
  });

  // Form
  const form = $("#proj-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = getVal("proj-id") || `project-${Date.now()}`;
    const file = $("#proj-img-file")?.files[0];
    let image = projects.find((p) => p.id === getVal("proj-id"))?.image || "";
    if (file) {
      try {
        image = await uploadProjectImage(id, file);
      } catch (err) {
        flash("proj-status", "Image upload failed: " + err.message, true);
      }
    }

    const proj = {
      id,
      title: getVal("proj-title"),
      shortDesc: getVal("proj-short"),
      longDesc: getVal("proj-long"),
      tags: getVal("proj-tags").split(",").map((s) => s.trim()).filter(Boolean),
      url: getVal("proj-url"),
      github: getVal("proj-github"),
      image,
      featured: getChecked("proj-featured"),
      gradient: getVal("proj-gradient") || "linear-gradient(135deg, #1a1a2e, #16213e)"
    };

    await saveProject(proj);
    projects = await loadProjects();
    renderProjectsTable();
    resetProjectForm();
    flash("proj-status", "Project saved!");
    renderOverview();
  };

  $("#proj-reset")?.addEventListener("click", resetProjectForm);
}

function editProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  setVal("proj-id", p.id);
  setVal("proj-title", p.title);
  setVal("proj-short", p.shortDesc);
  setVal("proj-long", p.longDesc);
  setVal("proj-tags", (p.tags || []).join(", "));
  setVal("proj-url", p.url);
  setVal("proj-github", p.github);
  setVal("proj-gradient", p.gradient);
  setChecked("proj-featured", p.featured);
  setImgPreview("proj-img-preview", p.image);
  $("#proj-form-title").textContent = "Edit Project";
}

function resetProjectForm() {
  $("#proj-form")?.reset();
  setVal("proj-id", "");
  setImgPreview("proj-img-preview", "assets/images/project-placeholder.svg");
  $("#proj-form-title").textContent = "New Project";
}

function renderFilterCategories() {
  const list = $("#proj-cat-list");
  if (!list) return;

  const cats = Array.isArray(siteContent?.projectCategories) ? siteContent.projectCategories : [];

  list.innerHTML = cats.length
    ? cats.map((cat, i) => `
        <span class="tag-chip">
          ${escapeHtml(cat)}
          <button type="button" class="tag-chip-remove" data-index="${i}" title="Remove">&times;</button>
        </span>`).join("")
    : `<p class="muted-copy" style="margin:0;font-size:.85rem">No categories yet. Add one below.</p>`;

  list.querySelectorAll(".tag-chip-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.index);
      if (!siteContent.projectCategories) siteContent.projectCategories = [];
      siteContent.projectCategories.splice(idx, 1);
      await saveSiteContent(siteContent);
      renderFilterCategories();
      flash("proj-cat-status", "Category removed.");
    });
  });

  const addBtn = $("#proj-cat-add-btn");
  const input  = $("#proj-cat-input");

  // Remove any old listener by cloning
  if (addBtn) {
    const fresh = addBtn.cloneNode(true);
    addBtn.replaceWith(fresh);
    fresh.addEventListener("click", async () => {
      const val = input?.value.trim();
      if (!val) return;
      if (!siteContent.projectCategories) siteContent.projectCategories = [];
      if (siteContent.projectCategories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
        flash("proj-cat-status", "That category already exists.", true);
        return;
      }
      siteContent.projectCategories.push(val);
      await saveSiteContent(siteContent);
      if (input) input.value = "";
      renderFilterCategories();
      flash("proj-cat-status", "Category added!");
    });
  }
}

/* ================================================================
   SKILLS & TECH
   ================================================================ */
function populateSkillsForm() {
  renderTechSelector();
  populateSkillsTextareas();
  renderSoftSkillsManager();

  // search filter
  $("#tech-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    $$(".tech-chip").forEach((chip) => {
      const text = (chip.dataset.name + " " + chip.dataset.cat).toLowerCase();
      chip.style.display = text.includes(q) ? "" : "none";
    });
  });

  $("#skills-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.techStacks = $$(".tech-chip.selected").map((c) => c.dataset.id);
    siteContent.skills.technical = parseTechnicalSkills(getVal("tech-skills-text"));
    await saveSiteContent(siteContent);
    flash("skills-status", "Saved!");
  });
}

function renderTechSelector() {
  const wrap = $("#tech-selector");
  if (!wrap) return;
  const selected = siteContent?.techStacks || [];
  wrap.innerHTML = techStacks
    .map((t) => {
      const sel = selected.includes(t.id) ? "selected" : "";
      return `<div class="tech-chip ${sel}" data-id="${escapeHtml(t.id)}" data-name="${escapeHtml(t.name)}" data-cat="${escapeHtml(t.category)}">
        <i class="${escapeHtml(t.fallbackIcon)}"></i>
        <span class="chip-name">${escapeHtml(t.name)}</span>
        <span class="chip-cat">${escapeHtml(t.category)}</span>
      </div>`;
    })
    .join("");

  wrap.querySelectorAll(".tech-chip").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("selected"));
  });
}

function populateSkillsTextareas() {
  const tech = (siteContent?.skills?.technical || [])
    .map((s) => `${s.category}|${s.icon}|${(s.items || []).join(",")}`)
    .join("\n");
  setVal("tech-skills-text", tech);
}

function renderSoftSkillsManager() {
  const tbody = $("#soft-skill-tbody");
  if (!tbody) return;

  const skills = siteContent?.skills?.soft || [];

  tbody.innerHTML = skills.length
    ? skills.map((s, i) => `
        <tr data-idx="${i}">
          <td data-label="Title">${escapeHtml(s.title)}</td>
          <td data-label="Icon"><i class="${escapeHtml(s.icon)}"></i> <small>${escapeHtml(s.icon)}</small></td>
          <td data-label="Description" style="max-width:320px;white-space:normal">${escapeHtml(s.desc)}</td>
          <td class="row-actions">
            <button title="Edit" class="soft-skill-edit"><i class="fa-solid fa-pen"></i></button>
            <button title="Delete" class="soft-skill-del danger"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No soft skills yet. Add one below.</td></tr>`;

  tbody.querySelectorAll("tr[data-idx]").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".soft-skill-edit")?.addEventListener("click", () => {
      const s = skills[idx];
      setVal("soft-skill-idx", idx);
      setVal("soft-skill-title", s.title);
      setVal("soft-skill-icon", s.icon);
      setVal("soft-skill-desc", s.desc);
      $("#soft-skill-form-title").textContent = "Edit Soft Skill";
      $("#soft-skill-title")?.focus();
    });
    row.querySelector(".soft-skill-del")?.addEventListener("click", async () => {
      if (!confirm(`Delete "${skills[idx].title}"?`)) return;
      siteContent.skills.soft.splice(idx, 1);
      await saveSiteContent(siteContent);
      renderSoftSkillsManager();
      flash("soft-skill-status", "Skill deleted.");
    });
  });

  // Form submit
  const form = $("#soft-skill-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("soft-skill-idx");
    const entry = {
      id: idx >= 0 ? (siteContent.skills.soft[idx]?.id || `soft-${Date.now()}`) : `soft-${Date.now()}`,
      title: getVal("soft-skill-title"),
      icon: getVal("soft-skill-icon") || "fa-solid fa-star",
      desc: getVal("soft-skill-desc")
    };
    if (!siteContent.skills.soft) siteContent.skills.soft = [];
    if (idx >= 0) {
      siteContent.skills.soft[idx] = entry;
    } else {
      siteContent.skills.soft.push(entry);
    }
    await saveSiteContent(siteContent);
    resetSoftSkillForm();
    renderSoftSkillsManager();
    flash("soft-skill-status", "Skill saved!");
  };

  // Reset button
  $("#soft-skill-reset")?.addEventListener("click", resetSoftSkillForm);
}

function resetSoftSkillForm() {
  setVal("soft-skill-idx", "-1");
  setVal("soft-skill-title", "");
  setVal("soft-skill-icon", "");
  setVal("soft-skill-desc", "");
  $("#soft-skill-form-title").textContent = "Add Soft Skill";
}

function parseTechnicalSkills(text) {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const [category, icon, items] = line.split("|").map((s) => s.trim());
      return {
        id: `tech-${i + 1}`,
        category: category || "Skill Group",
        icon: icon || "fa-solid fa-wrench",
        items: (items || "").split(",").map((s) => s.trim()).filter(Boolean)
      };
    });
}

function parseSoftSkills(text) {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const [title, icon, desc] = line.split("|").map((s) => s.trim());
      return {
        id: `soft-${i + 1}`,
        title: title || "Skill",
        icon: icon || "fa-solid fa-star",
        desc: desc || ""
      };
    });
}

/* ================================================================
   EXPERIENCE
   ================================================================ */
function renderExpTable() {
  const tbody = $("#exp-tbody");
  if (!tbody) return;
  const exps = siteContent?.experience || [];
  tbody.innerHTML = exps
    .map((x, i) => `<tr data-idx="${i}">
      <td data-label="Role">${escapeHtml(x.role)}</td>
      <td data-label="Company">${escapeHtml(x.company)}</td>
      <td data-label="Period">${escapeHtml(x.date)}</td>
      <td class="row-actions">
        <button title="Edit" class="exp-edit"><i class="fa-solid fa-pen"></i></button>
        <button title="Delete" class="exp-del danger"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`)
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".exp-edit")?.addEventListener("click", () => editExp(idx));
    row.querySelector(".exp-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      siteContent.experience.splice(idx, 1);
      await saveSiteContent(siteContent);
      renderExpTable();
    });
  });

  // form
  const form = $("#exp-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("exp-idx");
    const entry = {
      id: `exp-${Date.now()}`,
      role: getVal("exp-role"),
      company: getVal("exp-company"),
      date: getVal("exp-date"),
      type: getVal("exp-type"),
      badge: getVal("exp-badge"),
      badgeClass: getVal("exp-badge-cls"),
      summary: getVal("exp-summary"),
      bullets: getVal("exp-bullets").split("\n").map((s) => s.trim()).filter(Boolean)
    };
    if (idx >= 0 && idx < siteContent.experience.length) {
      entry.id = siteContent.experience[idx].id;
      siteContent.experience[idx] = entry;
    } else {
      siteContent.experience.push(entry);
    }
    await saveSiteContent(siteContent);
    renderExpTable();
    resetExpForm();
    flash("exp-status", "Experience saved!");
  };

  $("#exp-reset")?.addEventListener("click", resetExpForm);
  $("#exp-add")?.addEventListener("click", resetExpForm);
}

function editExp(idx) {
  const x = siteContent.experience[idx];
  if (!x) return;
  setVal("exp-idx", idx);
  setVal("exp-role", x.role);
  setVal("exp-company", x.company);
  setVal("exp-date", x.date);
  setVal("exp-type", x.type);
  setVal("exp-badge", x.badge);
  setVal("exp-badge-cls", x.badgeClass);
  setVal("exp-summary", x.summary);
  setVal("exp-bullets", (x.bullets || []).join("\n"));
  $("#exp-form-title").textContent = "Edit Entry";
}

function resetExpForm() {
  $("#exp-form")?.reset();
  setVal("exp-idx", "-1");
  $("#exp-form-title").textContent = "New Entry";
}

/* ================================================================
   EDUCATION
   ================================================================ */
function renderEduTable() {
  const tbody = $("#edu-tbody");
  if (!tbody) return;
  const edus = siteContent?.education || [];
  tbody.innerHTML = edus
    .map((x, i) => `<tr data-idx="${i}">
      <td data-label="Degree">${escapeHtml(x.degree)}</td>
      <td data-label="School">${escapeHtml(x.school)}</td>
      <td data-label="Period">${escapeHtml(x.period)}</td>
      <td class="row-actions">
        <button title="Edit" class="edu-edit"><i class="fa-solid fa-pen"></i></button>
        <button title="Delete" class="edu-del danger"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`)
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelector(".edu-edit")?.addEventListener("click", () => editEdu(idx));
    row.querySelector(".edu-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      siteContent.education.splice(idx, 1);
      await saveSiteContent(siteContent);
      renderEduTable();
    });
  });

  const form = $("#edu-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const idx = +getVal("edu-idx");
    const entry = {
      degree: getVal("edu-degree"),
      school: getVal("edu-school"),
      period: getVal("edu-period"),
      icon: getVal("edu-icon") || "fa-solid fa-graduation-cap"
    };
    if (idx >= 0 && idx < siteContent.education.length) {
      siteContent.education[idx] = entry;
    } else {
      siteContent.education.push(entry);
    }
    await saveSiteContent(siteContent);
    renderEduTable();
    resetEduForm();
    flash("edu-status", "Education saved!");
  };

  $("#edu-reset")?.addEventListener("click", resetEduForm);
  $("#edu-add")?.addEventListener("click", resetEduForm);
}

function editEdu(idx) {
  const x = siteContent.education[idx];
  if (!x) return;
  setVal("edu-idx", idx);
  setVal("edu-degree", x.degree);
  setVal("edu-school", x.school);
  setVal("edu-period", x.period);
  setVal("edu-icon", x.icon);
  $("#edu-form-title").textContent = "Edit Entry";
}

function resetEduForm() {
  $("#edu-form")?.reset();
  setVal("edu-idx", "-1");
  $("#edu-form-title").textContent = "New Entry";
}

/* ================================================================
   TESTIMONIALS
   ================================================================ */
function renderTestimonialsTable() {
  const tbody = $("#test-tbody");
  if (!tbody) return;
  tbody.innerHTML = testimonials
    .map((t) => {
      const badge = t.published ? `<span class="badge-sm badge-published">Published</span>` : `<span class="badge-sm badge-draft">Draft</span>`;
      return `<tr data-id="${escapeHtml(t.id)}">
        <td data-label="Client">${escapeHtml(t.name)}</td>
        <td data-label="Role">${escapeHtml(t.role)}</td>
        <td data-label="Status">${badge}</td>
        <td class="row-actions">
          <button title="Edit" class="test-edit"><i class="fa-solid fa-pen"></i></button>
          <button title="Delete" class="test-del danger"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector(".test-edit")?.addEventListener("click", () => editTestimonial(id));
    row.querySelector(".test-del")?.addEventListener("click", async () => {
      if (!confirm("Delete this testimonial?")) return;
      await deleteTestimonial(id);
      testimonials = await loadTestimonials();
      renderTestimonialsTable();
      renderOverview();
    });
  });

  // Image preview
  $("#test-img-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "test-img-preview");
  });

  const form = $("#test-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const existingId = getVal("test-id");
    const id = existingId || `testimonial-${Date.now()}`;
    const file = $("#test-img-file")?.files[0];
    let image = testimonials.find((t) => t.id === existingId)?.image || "";
    if (file) {
      try {
        image = await uploadTestimonialImage(id, file);
      } catch (err) {
        flash("test-status", "Image upload failed: " + err.message, true);
      }
    }
    const item = {
      id,
      name: getVal("test-name"),
      role: getVal("test-role"),
      content: getVal("test-content"),
      image,
      published: getChecked("test-published")
    };
    await saveTestimonial(item);
    testimonials = await loadTestimonials();
    renderTestimonialsTable();
    resetTestimonialForm();
    flash("test-status", "Testimonial saved!");
    renderOverview();
  };

  $("#test-reset")?.addEventListener("click", resetTestimonialForm);
}

function editTestimonial(id) {
  const t = testimonials.find((x) => x.id === id);
  if (!t) return;
  setVal("test-id", t.id);
  setVal("test-name", t.name);
  setVal("test-role", t.role);
  setVal("test-content", t.content);
  setChecked("test-published", t.published);
  setImgPreview("test-img-preview", t.image);
}

function resetTestimonialForm() {
  $("#test-form")?.reset();
  setVal("test-id", "");
  setImgPreview("test-img-preview", "assets/images/profile-placeholder.svg");
  setChecked("test-published", true);
}

/* ================================================================
   PAGE TEXT
   ================================================================ */
function populatePagesForm() {
  const s = siteContent?.settings || {};
  const p = siteContent?.profile || {};

  // Use pageText sub-object for page-level fields (create if missing)
  if (!siteContent.pageText) siteContent.pageText = {};
  const pt = siteContent.pageText;

  setVal("pg-hero-prefix", pt.heroPrefix || "Hi, I'm");
  setVal("pg-cta-title", pt.ctaTitle || "Ready to bring your idea to life?");
  setVal("pg-cta-body", pt.ctaBody || "");
  setVal("pg-about-title", pt.aboutTitle || "About Me");
  setVal("pg-about-sub", pt.aboutSub || "");
  setVal("pg-projects-title", pt.projectsTitle || "Featured Work");
  setVal("pg-projects-sub", pt.projectsSub || "");
  setVal("pg-feedback-title", pt.feedbackTitle || "Client Feedback");
  setVal("pg-feedback-sub", pt.feedbackSub || "");
  setVal("pg-footer", pt.footerCopy || "");

  $("#pages-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.pageText = {
      heroPrefix: getVal("pg-hero-prefix"),
      ctaTitle: getVal("pg-cta-title"),
      ctaBody: getVal("pg-cta-body"),
      aboutTitle: getVal("pg-about-title"),
      aboutSub: getVal("pg-about-sub"),
      projectsTitle: getVal("pg-projects-title"),
      projectsSub: getVal("pg-projects-sub"),
      feedbackTitle: getVal("pg-feedback-title"),
      feedbackSub: getVal("pg-feedback-sub"),
      footerCopy: getVal("pg-footer")
    };
    await saveSiteContent(siteContent);
    flash("pages-status", "Page text saved!");
  });
}

/* ================================================================
   MEDIA
   ================================================================ */
function renderMediaPanel() {
  const p = siteContent?.profile || {};
  setImgPreview("media-profile-img", p.profileImage);

  $("#media-profile-file")?.addEventListener("change", (e) => {
    previewFile(e.target, "media-profile-img");
  });

  $("#media-profile-save")?.addEventListener("click", async () => {
    const file = $("#media-profile-file")?.files[0];
    if (!file) return flash("media-status", "No file selected.", true);
    try {
      siteContent.profile.profileImage = await uploadProfileImage(file);
      await saveSiteContent(siteContent);
      setImgPreview("media-profile-img", siteContent.profile.profileImage);
      flash("media-status", "Profile image updated!");
    } catch (err) {
      flash("media-status", err.message, true);
    }
  });
}

/* ================================================================
   SETTINGS
   ================================================================ */
function populateSettingsForm() {
  const s = siteContent?.settings || {};
  setVal("set-email", s.contactRecipientEmail);
  setVal("set-sender", s.notificationSenderName);
  setVal("set-analytics", s.analyticsMeasurementId);
  setVal("set-label", s.adminContactLabel);

  $("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    siteContent.settings.contactRecipientEmail = getVal("set-email");
    siteContent.settings.notificationSenderName = getVal("set-sender");
    siteContent.settings.analyticsMeasurementId = getVal("set-analytics");
    siteContent.settings.adminContactLabel = getVal("set-label");
    await saveSiteContent(siteContent);
    flash("settings-status", "Settings saved!");
  });
}

function setupImportExport() {
  $("#export-btn")?.addEventListener("click", () => {
    const data = exportStateSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash("settings-status", "Backup downloaded!");
  });

  $("#import-input")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importStateSnapshot(payload);
      flash("settings-status", "Import complete — reloading…");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      flash("settings-status", "Import failed: " + err.message, true);
    }
  });

  $("#seed-btn")?.addEventListener("click", async () => {
    if (!confirm("This will reset ALL content to defaults. Continue?")) return;
    await seedRemoteContent();
    flash("settings-status", "Defaults restored — reloading…");
    setTimeout(() => window.location.reload(), 800);
  });
}

/* ================================================================
   AI WRITING ASSISTANT
   ================================================================ */
const AI_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

async function generateAIText(prompt, tone = "professional", length = "medium") {
  const lengthGuide = { short: "1-2 sentences", medium: "one paragraph (3-5 sentences)", long: "2-3 paragraphs" };
  const systemPrompt = `You are a professional copywriter for web developer portfolios. Write content that is ${tone} in tone. Target length: ${lengthGuide[length] || lengthGuide.medium}. Only output the final text, no explanations or labels.`;

  const fullPrompt = `<s>[INST] ${systemPrompt}\n\nUser request: ${prompt} [/INST]`;

  // Try Hugging Face free inference first
  try {
    const res = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: length === "long" ? 600 : length === "medium" ? 300 : 120,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    }
    throw new Error("Unexpected API response format.");
  } catch (err) {
    // Fallback: generate locally with templates
    return generateLocalFallback(prompt, tone, length);
  }
}

function generateLocalFallback(prompt, tone, length) {
  const templates = {
    bio: [
      "A dedicated web developer with a proven track record of delivering high-performance websites that drive results. Combining technical expertise with a keen eye for design, every project is approached with a commitment to excellence and user-centered thinking.",
      "With years of hands-on experience building websites for diverse clients, the focus has always been on creating solutions that work — fast load times, clean code, and designs that convert visitors into customers.",
      "Passionate about crafting digital experiences that make an impact. From concept to deployment, every step is guided by best practices, attention to detail, and a genuine desire to help businesses succeed online."
    ],
    project: [
      "This project was built to solve a real business problem — creating a digital presence that communicates trust, drives engagement, and delivers measurable performance improvements.",
      "A comprehensive web solution designed and developed from the ground up, focusing on user experience, performance optimization, and search engine visibility. The result exceeded client expectations in both speed and conversion metrics."
    ],
    testimonial: [
      "Working with this developer was an excellent experience. The attention to detail, clear communication, and technical skill made the entire project smooth and successful.",
      "Exceptional work that transformed our online presence. The website is faster, more professional, and has significantly improved our lead generation."
    ],
    generic: [
      "Delivering exceptional digital solutions with a focus on performance, user experience, and measurable business outcomes. Every project is an opportunity to create something meaningful.",
      "Combining technical expertise with creative problem-solving to build websites that don't just look great — they work hard for the businesses they represent."
    ]
  };

  const lower = prompt.toLowerCase();
  let pool = templates.generic;
  if (lower.includes("bio") || lower.includes("about")) pool = templates.bio;
  else if (lower.includes("project") || lower.includes("case study")) pool = templates.project;
  else if (lower.includes("testimonial") || lower.includes("review") || lower.includes("feedback")) pool = templates.testimonial;

  const idx = Math.floor(Math.random() * pool.length);
  let result = pool[idx];

  if (length === "long" && pool.length > 1) {
    const idx2 = (idx + 1) % pool.length;
    result += "\n\n" + pool[idx2];
  }

  return result;
}

function setupAIWriter() {
  const form = $("#ai-form");
  const output = $("#ai-output");
  const resultBox = $("#ai-result");
  const statusBox = $("#ai-status");
  const genBtn = $("#ai-gen-btn");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = getVal("ai-prompt");
    if (!prompt.trim()) return;

    genBtn.disabled = true;
    genBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating…`;
    statusBox.hidden = true;
    output.hidden = true;

    try {
      const text = await generateAIText(prompt, getVal("ai-tone"), getVal("ai-length"));
      resultBox.textContent = text;
      output.hidden = false;
    } catch (err) {
      statusBox.textContent = "Generation failed: " + err.message;
      statusBox.hidden = false;
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Generate`;
    }
  });

  $("#ai-copy")?.addEventListener("click", () => {
    const text = resultBox?.textContent || "";
    navigator.clipboard.writeText(text).then(() => flash("ai-status", "Copied!", false));
  });

  $("#ai-regen")?.addEventListener("click", () => {
    form?.requestSubmit();
  });

  // Inline AI buttons ( .btn-ai-assist throughout the dashboard )
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-ai-assist");
    if (!btn) return;
    const targetId = btn.dataset.target;
    const ctx = btn.dataset.ctx || "professional portfolio copy";
    const textarea = document.getElementById(targetId);
    if (!textarea) return;

    btn.disabled = true;
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      const existing = textarea.value.trim();
      const prompt = existing
        ? `Improve and rewrite the following text for a ${ctx}: "${existing}"`
        : `Write ${ctx}`;
      const text = await generateAIText(prompt, "professional", "medium");
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err) {
      console.warn("AI assist failed:", err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHTML;
    }
  });
}

// Initialize AI writer when DOM is ready
document.addEventListener("DOMContentLoaded", setupAIWriter);

/* ================================================================
   UTILITIES
   ================================================================ */
function getVal(id) {
  return document.getElementById(id)?.value || "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? "";
}

function getChecked(id) {
  return document.getElementById(id)?.checked || false;
}

function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(val);
}

function setImgPreview(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src || "assets/images/profile-placeholder.svg";
}

function previewFile(input, previewId) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => setImgPreview(previewId, e.target.result);
  reader.readAsDataURL(file);
}

function flash(id, msg, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `admin-status ${isError ? "is-error" : "is-success"}`;
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => (el.hidden = true), 4000);
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
