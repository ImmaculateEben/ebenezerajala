import {
  getAvailableTechStacks,
  loadProject,
  loadProjects,
  loadSiteContent,
  loadTestimonials
} from "./content-service.js";
import { hydrateContactDetails, initContactForm } from "./contact.js";
import {
  applyExternalLinkSafety,
  attachImageFallbacks,
  escapeHtml,
  safeSetHtml,
  sanitizeUrl
} from "./security.js";

function $(selector) {
  return document.querySelector(selector);
}

function setMetaDescription(content) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setCanonical() {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = window.location.href;
}

function injectAnalytics(measurementId) {
  if (!measurementId || document.querySelector('[data-analytics="ea-ga"]')) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());

  const loader = document.createElement("script");
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  loader.dataset.analytics = "ea-ga";
  loader.addEventListener("load", () => {
    window.gtag("config", measurementId);
  });

  document.head.appendChild(loader);
}

function initNav() {
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");
  const navbar = $("#navbar");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("nav-active");
      hamburger.classList.toggle("toggle");
    });

    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("nav-active");
        hamburger.classList.remove("toggle");
      });
    });

    document.addEventListener("click", (event) => {
      if (!hamburger.contains(event.target) && !navLinks.contains(event.target)) {
        navLinks.classList.remove("nav-active");
        hamburger.classList.remove("toggle");
      }
    });
  }

  if (navbar) {
    const update = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 16);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
}

function initRevealObserver() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((item) => observer.observe(item));
}

function buildProjectCard(project, index, options = {}) {
  const card = document.createElement("article");
  card.className = "project-card-full card-glass reveal";

  const link = document.createElement("a");
  link.className = "project-card-link";
  link.href = `project.html?id=${encodeURIComponent(project.id)}`;
  card.appendChild(link);

  if (project.image) {
    const image = document.createElement("img");
    image.className = "project-featured-img";
    image.src = project.image;
    image.alt = project.title;
    link.appendChild(image);
  }

  const number = document.createElement("div");
  number.className = "project-number";
  number.textContent = String(index + 1).padStart(2, "0");
  link.appendChild(number);

  const info = document.createElement("div");
  info.className = "project-info";
  link.appendChild(info);

  const title = document.createElement("h3");
  title.textContent = project.title;
  info.appendChild(title);

  const summary = document.createElement("p");
  summary.textContent = project.shortDesc;
  info.appendChild(summary);

  const tags = document.createElement("div");
  tags.className = "project-tags";
  project.tags.forEach((tag) => {
    const pill = document.createElement("span");
    pill.textContent = tag;
    tags.appendChild(pill);
  });
  info.appendChild(tags);

  const actions = document.createElement("div");
  actions.className = "project-actions";
  info.appendChild(actions);

  const details = document.createElement("span");
  details.className = "btn btn-primary";
  details.textContent = "View Details";
  actions.appendChild(details);

  if (options.includeExternal && project.url) {
    const external = document.createElement("a");
    external.className = "btn btn-outline";
    external.href = project.url;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.innerHTML = 'Live Site <i class="fa-solid fa-arrow-up-right-from-square"></i>';
    actions.appendChild(external);
  }

  return card;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setLink(id, value, label) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const safe = sanitizeUrl(value);
  if (!safe) {
    element.removeAttribute("href");
    return;
  }

  element.href = safe;
  if (label) {
    element.textContent = label;
  }
}

function renderProfileBlocks(siteContent) {
  const profile = siteContent.profile;
  document.querySelectorAll(".profile-img-dynamic").forEach((image) => {
    image.src = profile.profileImage || "assets/images/profile-placeholder.svg";
    image.alt = profile.name;
  });

  setText("profile-name", profile.name);
  setText("profile-location", profile.location);
  setText("profile-email", profile.email);
  setText("stat-years", profile.yearsExperience);
  setText("stat-clients", profile.clientsServed);
  setText("stat-speed", profile.avgSpeedImprovement);
  setText("stat-traffic", profile.avgTrafficIncrease);
  setText("hero-name", profile.name);
  setText("hero-tagline", profile.tagline);
  setText("hero-location", profile.location);
  setText("about-summary", profile.bio);
  setText("about-summary-2", profile.bio2);
  setText("contact-recipient-label", siteContent.settings.adminContactLabel || "Primary inbox");

  const bioContainer = document.getElementById("profile-bio-container");
  if (bioContainer) {
    bioContainer.innerHTML = [
      `<p>${escapeHtml(profile.bio)}</p>`,
      profile.bio2 ? `<p>${escapeHtml(profile.bio2)}</p>` : "",
      profile.bio3 ? `<p>${escapeHtml(profile.bio3)}</p>` : ""
    ].join("");
  }

  const aboutCta = document.getElementById("about-resume-link");
  if (aboutCta) {
    aboutCta.href = "assets/docs/resume.docx";
  }

  const linkedin = document.getElementById("profile-linkedin");
  if (linkedin) {
    const safeLinkedIn = sanitizeUrl(profile.linkedin);
    if (safeLinkedIn) {
      linkedin.href = safeLinkedIn;
      linkedin.textContent = safeLinkedIn.replace(/^https?:\/\/(www\.)?/, "");
      linkedin.target = "_blank";
      linkedin.rel = "noopener noreferrer";
    }
  }

  const githubLink = document.getElementById("profile-github");
  if (githubLink) {
    const safeGitHub = sanitizeUrl(profile.github);
    if (safeGitHub) {
      githubLink.href = safeGitHub;
      githubLink.textContent = safeGitHub.replace(/^https?:\/\/(www\.)?/, "");
      githubLink.target = "_blank";
      githubLink.rel = "noopener noreferrer";
    }
  }

  const availabilityBadge = document.getElementById("availability-badge");
  if (availabilityBadge) {
    availabilityBadge.textContent = profile.availableForFreelance ? "Available for new work" : "Currently booked";
  }

  initTitleRotators(profile.animatedTitles || []);
}

function initTitleRotators(titles) {
  const containers = document.querySelectorAll("[data-animated-title]");
  if (!containers.length || !titles.length) {
    return;
  }

  containers.forEach((container) => {
    let index = 0;

    const tick = () => {
      container.textContent = titles[index % titles.length];
      index += 1;
    };

    tick();
    window.setInterval(tick, 2600);
  });
}

async function renderHomePage(siteContent, projects, testimonials) {
  const featuredGrid = document.getElementById("home-projects-grid");
  if (featuredGrid) {
    featuredGrid.innerHTML = "";
    const featured = projects.filter((project) => project.featured).slice(0, 3);
    const items = featured.length ? featured : projects.slice(0, 3);
    items.forEach((project, index) => {
      featuredGrid.appendChild(buildProjectCard(project, index));
    });
  }

  const techGrid = document.getElementById("home-tech-stack-grid");
  if (techGrid) {
    techGrid.innerHTML = "";
    const definitions = getAvailableTechStacks();
    siteContent.techStacks.forEach((stackId) => {
      const item = definitions.find((entry) => entry.id === stackId);
      if (!item) {
        return;
      }
      const tile = document.createElement("div");
      tile.className = "tech-stack-item reveal";
      tile.innerHTML = `<div class="tech-stack-icon-wrapper"><i class="${item.icon}"></i></div><span>${escapeHtml(
        item.name
      )}</span>`;
      techGrid.appendChild(tile);
    });
  }

  const testimonialsGrid = document.getElementById("home-testimonials-grid");
  if (testimonialsGrid) {
    testimonialsGrid.innerHTML = "";
    testimonials
      .filter((item) => item.published)
      .slice(0, 3)
      .forEach((item) => {
        const card = document.createElement("article");
        card.className = "card-glass reveal testimonial-card";
        card.innerHTML = `
          <div class="testimonial-copy">
            <i class="fa-solid fa-quote-left"></i>
            <p>${escapeHtml(item.content)}</p>
          </div>
          <div class="testimonial-meta">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.role)}</span>
          </div>
        `;
        testimonialsGrid.appendChild(card);
      });
  }
}

function renderEducation(siteContent) {
  const educationGrid = document.getElementById("education-grid");
  if (!educationGrid) {
    return;
  }

  educationGrid.innerHTML = "";
  siteContent.education.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = `edu-card card-glass reveal${index ? ` delay-${Math.min(index, 4)}` : ""}`;
    card.innerHTML = `
      <div class="edu-icon"><i class="${escapeHtml(entry.icon)}"></i></div>
      <div>
        <span class="edu-badge">${escapeHtml(entry.period)}</span>
        <h3>${escapeHtml(entry.degree)}</h3>
        <p class="edu-school">${escapeHtml(entry.school)}</p>
      </div>
    `;
    educationGrid.appendChild(card);
  });
}

function renderSkills(siteContent) {
  const technicalGrid = document.getElementById("skill-technical-grid");
  if (technicalGrid) {
    technicalGrid.innerHTML = "";
    siteContent.skills.technical.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = `skill-category reveal${index ? ` delay-${Math.min(index, 4)}` : ""}`;
      const items = entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      card.innerHTML = `
        <h3><i class="${escapeHtml(entry.icon)}"></i> ${escapeHtml(entry.category)}</h3>
        <ul class="skill-list">${items}</ul>
      `;
      technicalGrid.appendChild(card);
    });
  }

  const softGrid = document.getElementById("skill-soft-grid");
  if (softGrid) {
    softGrid.innerHTML = "";
    siteContent.skills.soft.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = `soft-skill-item reveal${index ? ` delay-${Math.min(index, 4)}` : ""}`;
      card.innerHTML = `
        <div class="soft-skill-icon"><i class="${escapeHtml(entry.icon)}"></i></div>
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.desc)}</p>
      `;
      softGrid.appendChild(card);
    });
  }
}

function renderExperience(siteContent) {
  const timeline = document.getElementById("experience-timeline");
  if (timeline) {
    timeline.innerHTML = "";
    siteContent.experience.forEach((entry, index) => {
      const item = document.createElement("article");
      item.className = `timeline-item reveal${index ? ` delay-${Math.min(index, 4)}` : ""}`;
      const badge = entry.badge
        ? `<span class="timeline-badge ${escapeHtml(entry.badgeClass)}">${escapeHtml(entry.badge)}</span>`
        : "";
      const bullets = entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("");
      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content card-glass">
          <div class="timeline-header">
            <span class="timeline-date"><i class="fa-solid fa-calendar-days"></i> ${escapeHtml(entry.date)}</span>
            ${badge}
          </div>
          <h3 class="timeline-role">${escapeHtml(entry.role)}</h3>
          <div class="timeline-company"><i class="fa-solid fa-building"></i> ${escapeHtml(entry.company)} <span>•</span> ${escapeHtml(
            entry.type
          )}</div>
          <p>${escapeHtml(entry.summary)}</p>
          <ul class="timeline-bullets">${bullets}</ul>
        </div>
      `;
      timeline.appendChild(item);
    });
  }
}

function renderProjectsPage(projects) {
  const container = document.getElementById("projects-container");
  const filterBar = document.getElementById("project-filter-list");
  if (!container) {
    return;
  }

  const tags = [...new Set(projects.flatMap((project) => project.tags))];
  let activeTag = "All";

  const renderCards = () => {
    container.innerHTML = "";
    const filtered = activeTag === "All" ? projects : projects.filter((project) => project.tags.includes(activeTag));
    filtered.forEach((project, index) => {
      container.appendChild(buildProjectCard(project, index, { includeExternal: true }));
    });
    initRevealObserver();
    applyExternalLinkSafety(container);
    attachImageFallbacks(container);
  };

  if (filterBar) {
    const options = ["All", ...tags];
    filterBar.innerHTML = "";
    options.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${tag === activeTag ? " active" : ""}`;
      button.textContent = tag;
      button.addEventListener("click", () => {
        activeTag = tag;
        filterBar.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
        button.classList.add("active");
        renderCards();
      });
      filterBar.appendChild(button);
    });
  }

  renderCards();
}

async function renderProjectDetailPage() {
  const container = document.getElementById("project-detail");
  if (!container) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");
  const project = await loadProject(id);

  if (!project) {
    container.innerHTML = `
      <section class="section">
        <div class="container card-glass">
          <h1>Project not found</h1>
          <p>The requested project could not be loaded.</p>
          <a class="btn btn-primary" href="projects.html">Back to Projects</a>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${project.title} | Ebenezer Ajala`;
  setMetaDescription(project.shortDesc);

  container.innerHTML = `
    <div class="project-hero" style="background:${escapeHtml(project.gradient)};">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="project-hero-content fade-in-up">
        <a href="projects.html" class="project-back"><i class="fa-solid fa-arrow-left"></i> Back to Projects</a>
        <div class="project-tags">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.shortDesc)}</p>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div class="project-detail-grid">
          <div class="project-long-desc reveal ck-content custom-html-content" id="project-rich-copy"></div>
          <aside class="project-detail-sidebar reveal delay-1">
            <div class="sidebar-card card-glass">
              <h4>Project Links</h4>
              <div class="sidebar-links" id="project-link-list"></div>
            </div>
            <div class="sidebar-card card-glass">
              <h4>Technology Stack</h4>
              <div class="project-tags">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;

  const copy = document.getElementById("project-rich-copy");
  const image = project.image
    ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" class="project-featured-img">`
    : "";
  safeSetHtml(copy, `${image}<h2 class="section-title">Project Overview</h2>${project.longDesc || `<p>${escapeHtml(project.shortDesc)}</p>`}`);

  const linkList = document.getElementById("project-link-list");
  if (project.url) {
    linkList.insertAdjacentHTML(
      "beforeend",
      `<a class="sidebar-link" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Visit Live Site</a>`
    );
  }
  if (project.github) {
    linkList.insertAdjacentHTML(
      "beforeend",
      `<a class="sidebar-link" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> View Source</a>`
    );
  }
  if (!linkList.children.length) {
    linkList.innerHTML = '<p class="muted-copy">No external links have been added for this project yet.</p>';
  }

  initRevealObserver();
  applyExternalLinkSafety(container);
  attachImageFallbacks(container);
}

function renderHomeAndAboutEducation(siteContent) {
  renderEducation(siteContent);
}

async function initPage() {
  initNav();
  setCanonical();

  const [siteContent, projects, testimonials] = await Promise.all([
    loadSiteContent(),
    loadProjects(),
    loadTestimonials()
  ]);

  injectAnalytics(siteContent.settings.analyticsMeasurementId);
  renderProfileBlocks(siteContent);
  renderHomeAndAboutEducation(siteContent);
  renderSkills(siteContent);
  renderExperience(siteContent);
  renderProjectsPage(projects);

  if (document.getElementById("home-projects-grid")) {
    await renderHomePage(siteContent, projects, testimonials);
  }

  if (document.getElementById("contactForm")) {
    await hydrateContactDetails();
    initContactForm();
  }

  await renderProjectDetailPage();

  initRevealObserver();
  applyExternalLinkSafety();
  attachImageFallbacks();
}

document.addEventListener("DOMContentLoaded", () => {
  initPage().catch((error) => {
    console.error("Portfolio bootstrap failed.", error);
    const status = document.getElementById("page-status");
    if (status) {
      status.hidden = false;
      status.textContent = "Some live content could not be loaded. Default content is still available.";
    }
    initNav();
    initRevealObserver();
    applyExternalLinkSafety();
    attachImageFallbacks();
  });
});
