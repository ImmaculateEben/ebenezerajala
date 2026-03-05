import {
  deleteProject,
  deleteTestimonial,
  exportStateSnapshot,
  getContentRuntimeMode,
  importStateSnapshot,
  loadMessages,
  loadProjects,
  loadSiteContent,
  loadTestimonials,
  saveProject,
  saveSiteContent,
  saveTestimonial,
  seedRemoteContent,
  updateMessageStatus,
  uploadProfileImage,
  uploadProjectImage,
  uploadTestimonialImage
} from "./content-service.js";
import {
  getSupabaseInitializationError,
  getRuntimeConfig,
  isSupabaseReady,
  onAdminAuthChanged,
  signInAdmin,
  signOutAdmin
} from "./supabase-config.js";
import { applyExternalLinkSafety, attachImageFallbacks, escapeHtml, sanitizePlainText } from "./security.js";

const state = { siteContent: null, projects: [], testimonials: [], messages: [] };

const $ = (selector) => document.querySelector(selector);

function setStatus(id, message, type = "success") {
  const node = document.getElementById(id);
  if (!node) return;
  node.hidden = false;
  node.className = `admin-status ${type === "error" ? "is-error" : "is-success"}`;
  node.innerHTML = message;
}

function hideStatus(id) {
  const node = document.getElementById(id);
  if (node) node.hidden = true;
}

function switchSection(section) {
  document.querySelectorAll(".admin-nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== section;
  });
}

function renderRuntime() {
  const banner = document.getElementById("admin-runtime-banner");
  if (!banner) return;
  if (getContentRuntimeMode() === "supabase") {
    banner.textContent = "Supabase mode is active. Admin changes are persistent.";
    banner.classList.remove("warning");
  } else {
    banner.textContent = `Supabase is unavailable. Configure runtime-config.js to enable admin access. ${getSupabaseInitializationError() || ""}`.trim();
    banner.classList.add("warning");
  }
}

async function refresh() {
  const [siteContent, projects, testimonials, messages] = await Promise.all([
    loadSiteContent(),
    loadProjects(),
    loadTestimonials(),
    loadMessages()
  ]);
  state.siteContent = siteContent;
  state.projects = projects;
  state.testimonials = testimonials;
  state.messages = messages;
  renderOverview();
  renderMessages();
  renderProjects();
  renderProfile();
  renderExperience();
  renderSkills();
  renderTestimonials();
  renderSettings();
}

function renderOverview() {
  const unread = state.messages.filter((item) => item.status === "new").length;
  $("#overview-project-count").textContent = String(state.projects.length);
  $("#overview-featured-count").textContent = String(state.projects.filter((item) => item.featured).length);
  $("#overview-unread-count").textContent = String(unread);
  $("#overview-testimonial-count").textContent = String(state.testimonials.length);
  $("#overview-contact-email").textContent =
    state.siteContent.settings.contactRecipientEmail || state.siteContent.profile.email;
  $("#overview-availability").textContent = state.siteContent.profile.availableForFreelance ? "Open for work" : "Booked";
}

function renderMessages() {
  const tbody = $("#messages-table-body");
  tbody.innerHTML = "";
  if (!state.messages.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">No messages yet.</td></tr>';
    $("#message-detail").innerHTML = "<p>Select a message to inspect it here.</p>";
    return;
  }
  state.messages.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td><a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a></td>
      <td>${escapeHtml(item.subject || "General enquiry")}</td>
      <td>${escapeHtml(new Date(item.createdAt).toLocaleString())}</td>
      <td><span class="status-pill status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
      <td class="admin-actions-cell">
        <button type="button" data-open="${escapeHtml(item.id)}">Open</button>
        <button type="button" data-read="${escapeHtml(item.id)}">Read</button>
        <button type="button" data-archive="${escapeHtml(item.id)}">Archive</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function showMessage(id) {
  const item = state.messages.find((entry) => entry.id === id);
  if (!item) return;
  $("#message-detail").innerHTML = `
    <h3>${escapeHtml(item.subject || "General enquiry")}</h3>
    <p><strong>From:</strong> ${escapeHtml(item.name)} (${escapeHtml(item.email)})</p>
    <p><strong>Received:</strong> ${escapeHtml(new Date(item.createdAt).toLocaleString())}</p>
    <p><strong>Delivered to:</strong> ${escapeHtml(item.deliveredTo || "-")}</p>
    <div class="admin-rich-panel">${escapeHtml(item.message).replace(/\n/g, "<br>")}</div>
    <a class="btn btn-outline" href="mailto:${escapeHtml(item.email)}?subject=${encodeURIComponent(
      `Re: ${item.subject || "Portfolio enquiry"}`
    )}">Reply by email</a>
  `;
}

function renderProjects() {
  const tbody = $("#projects-table-body");
  tbody.innerHTML = "";
  if (!state.projects.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No projects added yet.</td></tr>';
    return;
  }
  state.projects.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(item.title)}</strong><div class="muted-copy">${escapeHtml(item.shortDesc)}</div></td>
      <td>${escapeHtml(item.tags.join(", "))}</td>
      <td>${item.featured ? '<span class="status-pill status-featured">Featured</span>' : "Standard"}</td>
      <td class="admin-actions-cell">
        <button type="button" data-edit-project="${escapeHtml(item.id)}">Edit</button>
        <button type="button" data-delete-project="${escapeHtml(item.id)}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function fillProjectForm(item) {
  $("#project-form").reset();
  hideStatus("project-form-status");
  $("#project-id").value = item?.id || "";
  $("#project-title").value = item?.title || "";
  $("#project-short").value = item?.shortDesc || "";
  $("#project-long").value = item?.longDesc || "";
  $("#project-url").value = item?.url || "";
  $("#project-github").value = item?.github || "";
  $("#project-tags").value = item?.tags?.join(", ") || "";
  $("#project-gradient").value = item?.gradient || "linear-gradient(135deg, #1a1a2e, #16213e)";
  $("#project-featured").checked = Boolean(item?.featured);
  $("#project-image-preview").src = item?.image || "assets/images/profile-placeholder.svg";
}

function renderProfile() {
  const profile = state.siteContent.profile;
  $("#profile-name-input").value = profile.name;
  $("#profile-titles-input").value = profile.animatedTitles.join(", ");
  $("#profile-tagline-input").value = profile.tagline;
  $("#profile-location-input").value = profile.location;
  $("#profile-email-input").value = profile.email;
  $("#profile-phone1-input").value = profile.phone1;
  $("#profile-phone2-input").value = profile.phone2;
  $("#profile-linkedin-input").value = profile.linkedin;
  $("#profile-github-input").value = profile.github;
  $("#profile-github-username-input").value = profile.githubUsername;
  $("#profile-years-input").value = profile.yearsExperience;
  $("#profile-clients-input").value = profile.clientsServed;
  $("#profile-speed-input").value = profile.avgSpeedImprovement;
  $("#profile-traffic-input").value = profile.avgTrafficIncrease;
  $("#profile-bio-input").value = profile.bio;
  $("#profile-bio2-input").value = profile.bio2;
  $("#profile-bio3-input").value = profile.bio3;
  $("#profile-available-input").checked = profile.availableForFreelance;
  $("#profile-image-preview").src = profile.profileImage || "assets/images/profile-placeholder.svg";
  $("#profile-live-preview").innerHTML = `
    <div class="admin-preview-card">
      <strong>${escapeHtml(profile.name)}</strong>
      <span>${escapeHtml(profile.tagline)}</span>
      <small>${profile.availableForFreelance ? "Available for new work" : "Currently booked"}</small>
    </div>
  `;
}

function renderExperience() {
  $("#experience-json").value = state.siteContent.experience
    .map((item) => JSON.stringify(item))
    .join("\n");
}

function formatSkillLines(list, type) {
  if (type === "technical") {
    return list.map((item) => `${item.category}|${item.icon}|${item.items.join(", ")}`).join("\n");
  }
  return list.map((item) => `${item.title}|${item.icon}|${item.desc}`).join("\n");
}

function parseSkillLines(value, type) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [a, b, c] = line.split("|").map((item) => item.trim());
      if (type === "technical") {
        return { id: `tech-${index + 1}`, category: a || "Skill Group", icon: b || "fa-solid fa-wrench", items: (c || "").split(",").map((item) => item.trim()).filter(Boolean) };
      }
      return { id: `soft-${index + 1}`, title: a || "Soft Skill", icon: b || "fa-solid fa-star", desc: c || "" };
    });
}

function renderSkills() {
  $("#technical-skills-lines").value = formatSkillLines(state.siteContent.skills.technical, "technical");
  $("#soft-skills-lines").value = formatSkillLines(state.siteContent.skills.soft, "soft");
  document.querySelectorAll('#tech-stack-selector input[type="checkbox"]').forEach((input) => {
    input.checked = state.siteContent.techStacks.includes(input.value);
    input.closest(".selector-chip").classList.toggle("active", input.checked);
  });
}

function renderTestimonials() {
  const tbody = $("#testimonials-table-body");
  tbody.innerHTML = "";
  if (!state.testimonials.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No testimonials yet.</td></tr>';
    return;
  }
  state.testimonials.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.role)}</td>
      <td>${escapeHtml(item.content)}</td>
      <td class="admin-actions-cell">
        <button type="button" data-edit-testimonial="${escapeHtml(item.id)}">Edit</button>
        <button type="button" data-delete-testimonial="${escapeHtml(item.id)}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function fillTestimonialForm(item) {
  $("#testimonial-form").reset();
  hideStatus("testimonial-form-status");
  $("#testimonial-id").value = item?.id || "";
  $("#testimonial-name").value = item?.name || "";
  $("#testimonial-role").value = item?.role || "";
  $("#testimonial-content").value = item?.content || "";
  $("#testimonial-published").checked = item?.published !== false;
  $("#testimonial-image-preview").src = item?.image || "assets/images/profile-placeholder.svg";
}

function renderSettings() {
  const settings = state.siteContent.settings;
  $("#settings-contact-email").value = settings.contactRecipientEmail || "";
  $("#settings-sender-name").value = settings.notificationSenderName || "";
  $("#settings-analytics-id").value = settings.analyticsMeasurementId || "";
  $("#settings-admin-label").value = settings.adminContactLabel || "";
}

function bindStaticUI() {
  document.querySelectorAll(".admin-nav-btn").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.section));
  });
  document.querySelectorAll("[data-jump-section]").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.jumpSection));
  });
  switchSection("overview");
}

function bindMessages() {
  $("#messages-table-body").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.open) showMessage(button.dataset.open);
    if (button.dataset.read) await updateMessageStatus(button.dataset.read, "read");
    if (button.dataset.archive) await updateMessageStatus(button.dataset.archive, "archived");
    if (button.dataset.read || button.dataset.archive) {
      state.messages = await loadMessages();
      renderOverview();
      renderMessages();
      showMessage(button.dataset.read || button.dataset.archive);
    }
  });
}

function bindProjects() {
  $("#projects-table-body").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.editProject) fillProjectForm(state.projects.find((item) => item.id === button.dataset.editProject));
    if (button.dataset.deleteProject) {
      await deleteProject(button.dataset.deleteProject);
      state.projects = await loadProjects();
      renderOverview();
      renderProjects();
      fillProjectForm(null);
    }
  });
  $("#project-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    let id = sanitizePlainText($("#project-id").value);
    if (!id) id = sanitizePlainText($("#project-title").value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let image = $("#project-image-preview").src;
    const file = $("#project-image-file").files[0];
    if (file) image = await uploadProjectImage(id, file);
    await saveProject({
      id,
      title: $("#project-title").value,
      shortDesc: $("#project-short").value,
      longDesc: $("#project-long").value,
      url: $("#project-url").value,
      github: $("#project-github").value,
      tags: $("#project-tags").value.split(",").map((item) => item.trim()).filter(Boolean),
      gradient: $("#project-gradient").value,
      featured: $("#project-featured").checked,
      image
    });
    state.projects = await loadProjects();
    renderOverview();
    renderProjects();
    fillProjectForm(state.projects.find((item) => item.id === id));
    setStatus("project-form-status", "Project saved.");
  });
  $("#project-reset-btn").addEventListener("click", () => fillProjectForm(null));
}

function bindProfile() {
  $("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const next = structuredClone(state.siteContent);
    let image = $("#profile-image-preview").src;
    const file = $("#profile-image-file").files[0];
    if (file) image = await uploadProfileImage(file);
    next.profile = {
      ...next.profile,
      name: $("#profile-name-input").value,
      animatedTitles: $("#profile-titles-input").value.split(",").map((item) => item.trim()).filter(Boolean),
      tagline: $("#profile-tagline-input").value,
      location: $("#profile-location-input").value,
      email: $("#profile-email-input").value,
      phone1: $("#profile-phone1-input").value,
      phone2: $("#profile-phone2-input").value,
      linkedin: $("#profile-linkedin-input").value,
      github: $("#profile-github-input").value,
      githubUsername: $("#profile-github-username-input").value,
      yearsExperience: $("#profile-years-input").value,
      clientsServed: $("#profile-clients-input").value,
      avgSpeedImprovement: $("#profile-speed-input").value,
      avgTrafficIncrease: $("#profile-traffic-input").value,
      bio: $("#profile-bio-input").value,
      bio2: $("#profile-bio2-input").value,
      bio3: $("#profile-bio3-input").value,
      availableForFreelance: $("#profile-available-input").checked,
      profileImage: image
    };
    state.siteContent = await saveSiteContent(next);
    renderOverview();
    renderProfile();
    setStatus("profile-form-status", "Profile saved.");
  });
}

function bindExperience() {
  $("#experience-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const next = structuredClone(state.siteContent);
      next.experience = $("#experience-json").value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      state.siteContent = await saveSiteContent(next);
      renderExperience();
      setStatus("experience-form-status", "Experience updated.");
    } catch (error) {
      setStatus("experience-form-status", "Each experience line must be valid JSON.", "error");
    }
  });
}

function bindSkills() {
  document.querySelectorAll('#tech-stack-selector input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", () => input.closest(".selector-chip").classList.toggle("active", input.checked));
  });
  $("#skills-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const next = structuredClone(state.siteContent);
    next.skills.technical = parseSkillLines($("#technical-skills-lines").value, "technical");
    next.skills.soft = parseSkillLines($("#soft-skills-lines").value, "soft");
    next.techStacks = Array.from(document.querySelectorAll('#tech-stack-selector input[type="checkbox"]:checked')).map((input) => input.value);
    state.siteContent = await saveSiteContent(next);
    renderSkills();
    setStatus("skills-form-status", "Skills saved.");
  });
}

function bindTestimonials() {
  $("#testimonials-table-body").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.editTestimonial) fillTestimonialForm(state.testimonials.find((item) => item.id === button.dataset.editTestimonial));
    if (button.dataset.deleteTestimonial) {
      await deleteTestimonial(button.dataset.deleteTestimonial);
      state.testimonials = await loadTestimonials();
      renderOverview();
      renderTestimonials();
      fillTestimonialForm(null);
    }
  });
  $("#testimonial-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = sanitizePlainText($("#testimonial-id").value) || `testimonial-${Date.now()}`;
    let image = $("#testimonial-image-preview").src;
    const file = $("#testimonial-image-file").files[0];
    if (file) image = await uploadTestimonialImage(id, file);
    await saveTestimonial({
      id,
      name: $("#testimonial-name").value,
      role: $("#testimonial-role").value,
      content: $("#testimonial-content").value,
      image,
      published: $("#testimonial-published").checked
    });
    state.testimonials = await loadTestimonials();
    renderOverview();
    renderTestimonials();
    fillTestimonialForm(state.testimonials.find((item) => item.id === id));
    setStatus("testimonial-form-status", "Testimonial saved.");
  });
  $("#testimonial-reset-btn").addEventListener("click", () => fillTestimonialForm(null));
}

function bindSettings() {
  $("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const next = structuredClone(state.siteContent);
    next.settings = {
      contactRecipientEmail: $("#settings-contact-email").value,
      notificationSenderName: $("#settings-sender-name").value,
      analyticsMeasurementId: $("#settings-analytics-id").value,
      adminContactLabel: $("#settings-admin-label").value
    };
    state.siteContent = await saveSiteContent(next);
    renderOverview();
    renderSettings();
    setStatus("settings-form-status", "Settings saved.");
  });
  $("#export-state-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(exportStateSnapshot(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "portfolio-state.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });
  $("#import-state-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await importStateSnapshot(JSON.parse(await file.text()));
      await refresh();
      setStatus("settings-form-status", "Snapshot imported.");
    } catch (error) {
      setStatus("settings-form-status", "Import failed. Check your JSON file.", "error");
    }
  });
  $("#seed-defaults-btn").addEventListener("click", async () => {
    if (window.prompt("Type RESET to restore the default portfolio content.") !== "RESET") return;
    await seedRemoteContent();
    await refresh();
    setStatus("settings-form-status", "Default content restored.");
  });
}

function bindImagePreviews() {
  [["project-image-file", "project-image-preview"], ["profile-image-file", "profile-image-preview"], ["testimonial-image-file", "testimonial-image-preview"]].forEach(
    ([inputId, previewId]) => {
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          preview.src = String(event.target?.result || "");
        };
        reader.readAsDataURL(file);
      });
    }
  );
}

function bindAuth() {
  const overlay = $("#admin-login-overlay");
  const shell = $("#admin-shell");
  onAdminAuthChanged(async (user) => {
    const email = sanitizePlainText(user?.email || "");
    const requiredEmail = sanitizePlainText(getRuntimeConfig().adminEmail || "");
    if (user && requiredEmail && email.toLowerCase() !== requiredEmail.toLowerCase()) {
      await signOutAdmin();
      setStatus("admin-login-error", "This account is not allowed for this dashboard.", "error");
      return;
    }
    overlay.hidden = Boolean(user);
    shell.hidden = !user;
    if (user) {
      hideStatus("admin-login-error");
      renderRuntime();
      await refresh();
      applyExternalLinkSafety();
      attachImageFallbacks(shell);
    }
  });
  $("#admin-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    hideStatus("admin-login-error");
    if (!isSupabaseReady()) {
      setStatus(
        "admin-login-error",
        "Supabase sign-in is unavailable right now. Configure runtime-config.js and try again.",
        "error"
      );
      return;
    }
    const submit = $("#admin-login-submit");
    submit.disabled = true;
    submit.textContent = "Signing in...";
    try {
      await signInAdmin($("#admin-email").value, $("#admin-password").value);
    } catch (error) {
      setStatus("admin-login-error", escapeHtml(error instanceof Error ? error.message : "Unable to sign in."), "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Sign in";
    }
  });

  $("#admin-logout-btn").addEventListener("click", async () => {
    await signOutAdmin();
    overlay.hidden = false;
    shell.hidden = true;
  });
}

function init() {
  bindStaticUI();
  bindMessages();
  bindProjects();
  bindProfile();
  bindExperience();
  bindSkills();
  bindTestimonials();
  bindSettings();
  bindImagePreviews();
  bindAuth();
  if (!isSupabaseReady()) {
    $("#admin-login-submit").textContent = "Supabase unavailable";
    $("#admin-login-submit").disabled = true;
    setStatus(
      "admin-login-error",
      escapeHtml(getSupabaseInitializationError() || "Supabase is not configured. Complete runtime-config.js to enable admin sign-in."),
      "error"
    );
  }
}

document.addEventListener("DOMContentLoaded", init);
