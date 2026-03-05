import {
  getAvailableTechStacks,
  loadProject,
  loadProjects,
  loadProjectsSync,
  loadSiteContent,
  loadSiteContentSync,
  loadTestimonials,
  loadTestimonialsSync
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

const PROJECT_IMAGE_FALLBACK = "assets/images/project-placeholder.svg";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function normalizeStackKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function resolveTechStack(definitions, value) {
  const key = normalizeStackKey(value);
  return (
    definitions.find((entry) => normalizeStackKey(entry.id) === key) ||
    definitions.find((entry) => normalizeStackKey(entry.slug) === key) ||
    definitions.find((entry) => normalizeStackKey(entry.name) === key)
  );
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
  card.className = "project-card reveal";

  // --- Image wrapper ---
  const imgWrap = document.createElement("div");
  imgWrap.className = "project-card-img";
  card.appendChild(imgWrap);

  const image = document.createElement("img");
  image.src = project.featuredImage || project.image || PROJECT_IMAGE_FALLBACK;
  image.alt = `${project.title} preview`;
  image.loading = "lazy";
  imgWrap.appendChild(image);

  if (project.featured) {
    const ribbon = document.createElement("span");
    ribbon.className = "project-card-ribbon";
    ribbon.textContent = "Featured";
    imgWrap.appendChild(ribbon);
  }

  const numEl = document.createElement("span");
  numEl.className = "project-card-num";
  numEl.textContent = String(index + 1).padStart(2, "0");
  imgWrap.appendChild(numEl);

  // --- Body ---
  const body = document.createElement("div");
  body.className = "project-card-body";
  card.appendChild(body);

  const title = document.createElement("h3");
  title.textContent = project.title;
  body.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "project-desc";
  desc.textContent = project.shortDesc;
  body.appendChild(desc);

  const tags = document.createElement("div");
  tags.className = "project-card-tags";
  project.tags.forEach((tag) => {
    const pill = document.createElement("span");
    pill.textContent = tag;
    tags.appendChild(pill);
  });
  body.appendChild(tags);

  // --- Footer ---
  const footer = document.createElement("div");
  footer.className = "project-card-footer";
  card.appendChild(footer);

  const detailLink = document.createElement("a");
  detailLink.className = "btn btn-primary";
  detailLink.href = `/project?id=${encodeURIComponent(project.id)}`;
  detailLink.innerHTML = 'View Details <i class="fa-solid fa-arrow-right"></i>';
  footer.appendChild(detailLink);

  if (options.includeExternal && project.url) {
    const external = document.createElement("a");
    external.className = "btn btn-outline";
    external.href = project.url;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.innerHTML = 'Live Site <i class="fa-solid fa-arrow-up-right-from-square"></i>';
    footer.appendChild(external);
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
  // Render bio: split on blank lines to produce multiple <p> tags
  const bioParagraphs = (profile.bio || "")
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);
  // Legacy: merge bio2 / bio3 if they were never merged yet
  if (profile.bio2) bioParagraphs.push(profile.bio2);
  if (profile.bio3) bioParagraphs.push(profile.bio3);
  setText("about-summary", bioParagraphs[0] || profile.bio);
  setText("about-summary-2", bioParagraphs[1] || "");
  setText("contact-recipient-label", siteContent.settings.adminContactLabel || "Primary inbox");

  const bioContainer = document.getElementById("profile-bio-container");
  if (bioContainer) {
    bioContainer.innerHTML = bioParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
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

  const heroGitHub = document.getElementById("hero-github-link");
  if (heroGitHub) {
    const safeGitHub = sanitizeUrl(profile.github);
    if (safeGitHub) {
      heroGitHub.href = safeGitHub;
      heroGitHub.target = "_blank";
      heroGitHub.rel = "noopener noreferrer";
      heroGitHub.hidden = false;
    } else {
      heroGitHub.hidden = true;
    }
  }

  const availabilityBadge = document.getElementById("availability-badge");
  if (availabilityBadge) {
    availabilityBadge.textContent = profile.availableForFreelance ? "Available for new work" : "Currently booked";
  }

  initTitleRotators(profile.animatedTitles || []);
}

function initTitleRotators(titles) {
  const containers = Array.from(document.querySelectorAll("[data-animated-title]"));
  const values = Array.isArray(titles)
    ? titles.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  containers.forEach((container) => {
    const timer = titleRotatorTimers.get(container);
    if (timer) {
      window.clearTimeout(timer);
      titleRotatorTimers.delete(container);
    }
  });

  if (!containers.length || !values.length) {
    return;
  }

  if (prefersReducedMotion()) {
    containers.forEach((container) => {
      container.textContent = values[0];
    });
    return;
  }

  const longestLength = Math.max(...values.map((item) => item.length));

  containers.forEach((container) => {
    let titleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    container.style.minWidth = `${Math.max(10, longestLength)}ch`;

    const tick = () => {
      const current = values[titleIndex % values.length];
      if (!current) {
        return;
      }

      if (deleting) {
        charIndex = Math.max(0, charIndex - 1);
      } else {
        charIndex = Math.min(current.length, charIndex + 1);
      }

      container.textContent = current.slice(0, charIndex);

      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";
      cursor.setAttribute("aria-hidden", "true");
      cursor.textContent = "|";
      container.appendChild(cursor);

      let delay = deleting ? 38 : 75;
      if (!deleting && charIndex >= current.length) {
        deleting = true;
        delay = 1050;
      } else if (deleting && charIndex <= 0) {
        deleting = false;
        titleIndex += 1;
        delay = 260;
      }

      const timerId = window.setTimeout(tick, delay);
      titleRotatorTimers.set(container, timerId);
    };

    tick();
  });
}

const titleRotatorTimers = new WeakMap();

const GITHUB_USERNAME_PATTERN = /^[A-Za-z0-9-]{1,39}$/;

function isValidGitHubUsername(value) {
  const username = String(value || "").trim();
  return GITHUB_USERNAME_PATTERN.test(username) && !username.startsWith("-") && !username.endsWith("-");
}

function extractGitHubUsernameFromUrl(value) {
  const safeUrl = sanitizeUrl(value);
  if (!safeUrl) {
    return "";
  }

  try {
    const parsed = new URL(safeUrl);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "github.com") {
      return "";
    }

    const [username] = parsed.pathname.split("/").filter(Boolean);
    return String(username || "").trim();
  } catch (error) {
    return "";
  }
}

function resolveGitHubUsername(siteContent) {
  const direct = String(siteContent?.profile?.githubUsername || "").trim();
  if (isValidGitHubUsername(direct)) {
    return direct;
  }

  const fromProfileUrl = extractGitHubUsernameFromUrl(siteContent?.profile?.github || "");
  if (isValidGitHubUsername(fromProfileUrl)) {
    return fromProfileUrl;
  }

  return "";
}

function hasGitHubContributionCells(scope) {
  return Boolean(scope?.querySelector?.(".ContributionCalendar-day[data-level]"));
}

function setGitHubUnavailable(calendar, username) {
  if (!calendar) return;
  const profileUrl = username ? `https://github.com/${encodeURIComponent(username)}` : "https://github.com";
  calendar.innerHTML = `
    <div class="gh-unavailable">
      <i class="fa-brands fa-github"></i>
      <p>Contribution data is temporarily unavailable.</p>
      <a class="btn btn-outline btn-sm" href="${profileUrl}" target="_blank" rel="noopener noreferrer">View on GitHub <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    </div>`;
}

function githubContribProxy(username) {
  const endpoint = `https://api.bloggify.net/gh-calendar/?username=${encodeURIComponent(username)}`;
  return fetch(endpoint, { method: "GET" }).then((response) => {
    if (!response.ok) {
      throw new Error(`GitHub calendar proxy failed with status ${response.status}`);
    }
    return response.text();
  });
}

/* Read the current accent hex from CSS variables (no # prefix) */
function getThemeAccentHex() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim()
    .replace(/^#/, "") || "3b82f6";
}

/* Render a static ghchart.rshah.org PNG/SVG as a last-resort live fallback */
async function renderGitHubPngFallback(calendar, username) {
  return new Promise((resolve) => {
    const hex = getThemeAccentHex();
    const src = `https://ghchart.rshah.org/${hex}/${encodeURIComponent(username)}`;
    const img = document.createElement("img");
    img.className = "gh-png-fallback";
    img.alt = `${username}'s GitHub contribution chart`;
    img.setAttribute("data-gh-png", username);
    img.src = src;
    const done = (ok) => {
      clearTimeout(timer);
      if (ok) {
        calendar.innerHTML = "";
        calendar.appendChild(img);
      }
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), 9000);
    img.onload = () => done(true);
    img.onerror = () => done(false);
  });
}

/* Re-colour the PNG chart when the theme changes */
function updateGitHubPngTheme(container) {
  const img = container && container.querySelector("img[data-gh-png]");
  if (!img) return;
  const username = img.getAttribute("data-gh-png");
  if (!username) return;
  const hex = getThemeAccentHex();
  img.src = `https://ghchart.rshah.org/${hex}/${encodeURIComponent(username)}`;
}

async function renderGitHubCalendarFallback(calendar, username) {
  const body = await githubContribProxy(username);

  if (!body) {
    throw new Error("Empty response from GitHub calendar proxy");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(body, "text/html");
  const yearly = doc.querySelector(".js-yearly-contributions");
  if (!yearly) {
    return false;
  }

  yearly
    .querySelectorAll(".position-relative h2, .contrib-column, .contrib-footer, .width-full.f6.px-0.tmp-px-md-5.py-1")
    .forEach((element) => element.remove());

  yearly.querySelectorAll("a").forEach((link) => {
    if (String(link.textContent || "").includes("View your contributions in 3D, VR and IRL!")) {
      link.parentElement?.remove();
    }
  });

  calendar.innerHTML = yearly.innerHTML;
  return hasGitHubContributionCells(calendar);
}

async function waitForGitHubCalendar(timeoutMs = 4500) {
  if (typeof window.GitHubCalendar === "function") {
    return true;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    if (typeof window.GitHubCalendar === "function") {
      return true;
    }
  }

  return false;
}

async function initGitHubContributions(siteContent) {
  const container = document.getElementById("github-contributions");
  if (!container) {
    return;
  }

  const calendar = container.querySelector(".github-calendar");
  const profileLink = container.querySelector("[data-github-profile-link]");
  const username = resolveGitHubUsername(siteContent);
  const safeProfileUrl = sanitizeUrl(siteContent?.profile?.github || "");

  if (!calendar) {
    return;
  }

  if (profileLink) {
    profileLink.href = username
      ? `https://github.com/${encodeURIComponent(username)}`
      : safeProfileUrl || "https://github.com";
  }

  if (!username) {
    setGitHubUnavailable(calendar);
    return;
  }

  calendar.setAttribute("data-github-username", username);
  let rendered = false;

  const ready = await waitForGitHubCalendar();
  if (ready && typeof window.GitHubCalendar === "function") {
    try {
      const maybePromise = window.GitHubCalendar(calendar, username, {
        global_stats: false,
        responsive: false,
        tooltips: false,
        proxy: githubContribProxy
      });
      await Promise.resolve(maybePromise);
      rendered = hasGitHubContributionCells(calendar);
    } catch (error) {
      rendered = false;
    }
  }

  if (!rendered) {
    try {
      rendered = await renderGitHubCalendarFallback(calendar, username);
    } catch (error) {
      rendered = false;
    }
  }

  if (!rendered) {
    try {
      rendered = await renderGitHubPngFallback(calendar, username);
    } catch (_e) {
      rendered = false;
    }
  }

  if (!rendered) {
    setGitHubUnavailable(calendar, username);
  }

  /* Watch for theme changes and update PNG chart colour */
  const ghThemeObserver = new MutationObserver(() => updateGitHubPngTheme(container));
  ghThemeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

function setupTestimonialsMarquee(container) {
  if (!container) {
    return;
  }

  const cards = Array.from(container.children);
  if (cards.length < 2) {
    return;
  }

  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const reduceMotion = prefersReducedMotion();

  /* Desktop: show as a responsive grid, no marquee */
  if (isDesktop) {
    container.classList.add("testimonials-desktop-grid");
    return;
  }

  /* Mobile: horizontal scroll marquee */
  const viewport = document.createElement("div");
  viewport.className = "testimonials-marquee";
  const track = document.createElement("div");
  track.className = "testimonials-track";

  cards.forEach((card) => track.appendChild(card));

  if (!reduceMotion && cards.length > 2) {
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
    viewport.classList.add("is-animated");
  }

  viewport.appendChild(track);
  container.appendChild(viewport);
}

function setupFeaturedProjectsUX(container) {
  if (!container) {
    return;
  }

  const cards = Array.from(container.children);
  if (!cards.length) {
    return;
  }

  const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const reduceMotion = prefersReducedMotion();

  if (!isTablet && !isMobile) {
    return;
  }

  const viewport = document.createElement("div");
  viewport.className = "featured-projects-viewport";
  const track = document.createElement("div");
  track.className = "featured-projects-track";

  cards.forEach((card) => track.appendChild(card));

  if (isTablet && !reduceMotion && cards.length > 1) {
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
    viewport.classList.add("is-tablet-animated");
  }

  viewport.appendChild(track);
  container.appendChild(viewport);
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
    setupFeaturedProjectsUX(featuredGrid);
  }

  const techGrid = document.getElementById("home-tech-stack-grid");
  if (techGrid) {
    techGrid.innerHTML = "";
    const definitions = getAvailableTechStacks();
    const selectedStacks = Array.isArray(siteContent.techStacks) && siteContent.techStacks.length
      ? siteContent.techStacks
      : definitions.slice(0, 8).map((entry) => entry.id);
    const resolved = selectedStacks.map((stackId) => resolveTechStack(definitions, stackId)).filter(Boolean);
    const itemsToRender = resolved.length ? resolved : definitions.slice(0, 8);
    itemsToRender.forEach((item) => {
      const tile = document.createElement("div");
      tile.className = "tech-stack-item reveal";
      const iconClass = item.fallbackIcon || item.icon || "fa-solid fa-code";
      tile.innerHTML = `<div class="tech-stack-icon-wrapper"><i class="${iconClass}" aria-hidden="true"></i></div><span>${escapeHtml(
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
      .slice(0, 10)
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
    setupTestimonialsMarquee(testimonialsGrid);
  }

  await initGitHubContributions(siteContent);
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

  // Tech stack on the skills page
  const skillsTechGrid = document.getElementById("skills-tech-stack-grid");
  if (skillsTechGrid) {
    skillsTechGrid.innerHTML = "";
    const definitions = getAvailableTechStacks();
    const selectedStacks = Array.isArray(siteContent.techStacks) && siteContent.techStacks.length
      ? siteContent.techStacks
      : definitions.slice(0, 8).map((entry) => entry.id);
    const resolved = selectedStacks.map((id) => resolveTechStack(definitions, id)).filter(Boolean);
    const itemsToRender = resolved.length ? resolved : definitions.slice(0, 8);
    itemsToRender.forEach((item) => {
      const tile = document.createElement("div");
      tile.className = "tech-stack-item reveal";
      const iconClass = item.fallbackIcon || item.icon || "fa-solid fa-code";
      tile.innerHTML = `<div class="tech-stack-icon-wrapper"><i class="${iconClass}" aria-hidden="true"></i></div><span>${escapeHtml(item.name)}</span>`;
      skillsTechGrid.appendChild(tile);
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

function renderProjectsPage(projects, siteContent) {
  const container = document.getElementById("projects-container");
  const filterBar = document.getElementById("project-filter-list");
  const emptyMsg = document.getElementById("projects-empty");
  if (!container) {
    return;
  }

  // Use admin-managed filter categories, or fall back to unique project tags
  const categories = Array.isArray(siteContent?.projectCategories) && siteContent.projectCategories.length
    ? siteContent.projectCategories
    : [...new Set(projects.flatMap((p) => p.tags))];

  let activeTag = "All";

  const renderCards = () => {
    container.innerHTML = "";
    const filtered = activeTag === "All"
      ? projects
      : projects.filter((p) => p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()));
    container.classList.toggle("single-result", filtered.length === 1);
    if (emptyMsg) emptyMsg.hidden = filtered.length > 0;
    filtered.forEach((project, index) => {
      container.appendChild(buildProjectCard(project, index, { includeExternal: true }));
    });
    initRevealObserver();
    applyExternalLinkSafety(container);
    attachImageFallbacks(container);
  };

  // Filters
  if (filterBar) {
    const options = ["All", ...categories];
    filterBar.innerHTML = "";
    options.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${tag === activeTag ? " active" : ""}`;
      button.textContent = tag;
      button.addEventListener("click", () => {
        activeTag = tag;
        filterBar.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
        button.classList.add("active");
        renderCards();
      });
      filterBar.appendChild(button);
    });
  }

  // View toggle (grid / list)
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      container.classList.toggle("view-list", view === "list");
    });
  });

  renderCards();
}

async function renderProjectDetailPage() {
  const container = document.getElementById("project-detail");
  if (!container) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");
  const allProjects = await loadProjects();
  const project = allProjects.find((p) => p.id === id) || (await loadProject(id));

  if (!project) {
    container.innerHTML = `
      <section class="section" style="padding-top:calc(var(--nav-height) + 4rem)">
        <div class="container card-glass" style="text-align:center;padding:3rem 2rem">
          <i class="fa-solid fa-circle-exclamation" style="font-size:2.5rem;color:var(--accent);margin-bottom:1rem"></i>
          <h1>Project not found</h1>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem">The requested project could not be loaded.</p>
          <a class="btn btn-primary" href="/projects"><i class="fa-solid fa-arrow-left"></i> Back to Projects</a>
        </div>
      </section>
    `;
    return;
  }

  document.title = `${project.title} | Ebenezer Ajala`;
  setMetaDescription(project.shortDesc);

  const imageSrc = project.featuredImage || project.image || PROJECT_IMAGE_FALLBACK;

  container.innerHTML = `
    <div class="project-detail-hero">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="project-detail-hero-inner fade-in-up">
        <div class="project-detail-breadcrumb">
          <a href="/projects" class="project-back"><i class="fa-solid fa-arrow-left"></i> All Projects</a>
          ${project.featured ? '<span class="project-featured-badge"><i class="fa-solid fa-star"></i> Featured</span>' : ""}
        </div>
        <h1>${escapeHtml(project.title)}</h1>
        <p class="project-hero-desc">${escapeHtml(project.shortDesc)}</p>
        <div class="project-tags">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        ${project.url || project.github ? `
        <div class="project-hero-actions">
          ${project.url ? `<a class="btn btn-white" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Live Site</a>` : ""}
          ${project.github ? `<a class="btn btn-ghost" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Source Code</a>` : ""}
        </div>` : ""}
      </div>
    </div>
    <div class="project-screenshot-wrap">
      <div class="container">
        <figure class="project-screenshot-frame fade-in-up">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.title)} screenshot" class="project-screenshot-img" id="project-hero-img">
        </figure>
      </div>
    </div>
    <section class="section">
      <div class="container">
        <div class="project-detail-grid">
          <div class="project-detail-main project-long-desc reveal ck-content custom-html-content" id="project-rich-copy"></div>
          <aside class="project-detail-sidebar reveal delay-1">
            <div class="sidebar-card card-glass">
              <h4><i class="fa-solid fa-link"></i> Project Links</h4>
              <div class="sidebar-links" id="project-link-list"></div>
            </div>
            <div class="sidebar-card card-glass">
              <h4><i class="fa-solid fa-layer-group"></i> Tech Stack</h4>
              <div class="project-tags" style="margin-bottom:0">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;

  // Gallery (if project has additional images)
  const gallery = project.gallery || [];
  if (gallery.length > 0) {
    const gallerySection = document.createElement("section");
    gallerySection.className = "section";
    gallerySection.style.paddingTop = "0";
    gallerySection.innerHTML = `
      <div class="container">
        <h3 style="margin-bottom:1rem;font-size:1.1rem"><i class="fa-solid fa-images" style="opacity:.6;margin-right:.4rem"></i>Gallery</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
          ${gallery.map((url) => `
            <figure style="margin:0;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border)">
              <img src="${escapeHtml(url)}" alt="${escapeHtml(project.title)} screenshot"
                style="width:100%;height:220px;object-fit:cover;display:block;cursor:pointer"
                onclick="this.closest('figure').requestFullscreen?.()">
            </figure>`).join("")}
        </div>
      </div>`;
    container.appendChild(gallerySection);
  }

  // Rich content (image now lives in the screenshot section above)
  const copy = document.getElementById("project-rich-copy");
  safeSetHtml(
    copy,
    `<h2 class="section-title">Project Overview</h2>
     ${project.longDesc || `<p>${escapeHtml(project.shortDesc)}</p>`}`
  );

  // Links
  const linkList = document.getElementById("project-link-list");
  if (project.url) {
    linkList.insertAdjacentHTML(
      "beforeend",
      `<a class="sidebar-link primary" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Visit Live Site</a>`
    );
  }
  if (project.github) {
    linkList.insertAdjacentHTML(
      "beforeend",
      `<a class="sidebar-link" href="${escapeHtml(project.github)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> View Source Code</a>`
    );
  }
  if (!linkList.children.length) {
    linkList.innerHTML = '<p class="muted-copy">No external links have been added for this project yet.</p>';
  }

  // Prev / Next navigation
  const navSection = document.getElementById("project-nav-section");
  const navStrip = document.getElementById("project-nav-strip");
  if (navSection && navStrip && allProjects.length > 1) {
    const idx = allProjects.findIndex((p) => p.id === project.id);
    const prev = idx > 0 ? allProjects[idx - 1] : null;
    const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null;
    let navHTML = "";
    if (prev) {
      navHTML += `<a class="project-nav-link" href="/project?id=${encodeURIComponent(prev.id)}"><i class="fa-solid fa-arrow-left"></i> ${escapeHtml(prev.title)}</a>`;
    }
    if (next) {
      navHTML += `<a class="project-nav-link is-next" href="/project?id=${encodeURIComponent(next.id)}">${escapeHtml(next.title)} <i class="fa-solid fa-arrow-right"></i></a>`;
    }
    navStrip.innerHTML = navHTML;
    navSection.hidden = false;
  }

  // Show CTA
  const cta = document.getElementById("project-cta");
  if (cta) cta.hidden = false;

  initRevealObserver();
  applyExternalLinkSafety(container);
  attachImageFallbacks(container);
}

function renderHomeAndAboutEducation(siteContent) {
  renderEducation(siteContent);
}

function renderPageText(siteContent) {
  const pt = siteContent?.pageText;
  if (!pt) return;

  // Hero prefix ("Hi, I'm")
  const prefix = document.getElementById("hero-prefix");
  if (prefix && pt.heroPrefix) prefix.textContent = pt.heroPrefix;

  // Homepage CTA
  const ctaTitle = document.getElementById("pt-cta-title");
  if (ctaTitle && pt.ctaTitle) ctaTitle.textContent = pt.ctaTitle;
  const ctaBody = document.getElementById("pt-cta-body");
  if (ctaBody && pt.ctaBody) ctaBody.textContent = pt.ctaBody;

  // About section title (supports "Word <highlight>Word</highlight>" format)
  const aboutTitle = document.getElementById("pt-about-title");
  if (aboutTitle && pt.aboutTitle) {
    aboutTitle.innerHTML = highlightTitle(pt.aboutTitle);
  }

  // Featured Projects section
  const projTitle = document.getElementById("pt-projects-title");
  if (projTitle && pt.projectsTitle) {
    projTitle.innerHTML = highlightTitle(pt.projectsTitle);
  }
  const projSub = document.getElementById("pt-projects-sub");
  if (projSub && pt.projectsSub) projSub.textContent = pt.projectsSub;

  // Client Feedback section
  const fbTitle = document.getElementById("pt-feedback-title");
  if (fbTitle && pt.feedbackTitle) {
    fbTitle.innerHTML = highlightTitle(pt.feedbackTitle);
  }
  const fbSub = document.getElementById("pt-feedback-sub");
  if (fbSub && pt.feedbackSub) fbSub.textContent = pt.feedbackSub;

  // Footer copy (all pages)
  const footerCopy = pt.footerCopy;
  if (footerCopy) {
    document.querySelectorAll(".footer-copy").forEach((el) => {
      el.textContent = footerCopy;
    });
  }
}

function highlightTitle(text) {
  // If text contains *word*, wrap that word in a .highlight span
  // e.g. "About *Me*" → 'About <span class="highlight">Me</span>'
  return escapeHtml(text).replace(
    /\*([^*]+)\*/g,
    '<span class="highlight">$1</span>'
  );
}

async function initPage() {
  initNav();
  setCanonical();

  // ── Phase 1: instant render from localStorage cache (synchronous, < 1 ms) ──
  // This makes every section visible immediately without waiting for the network.
  const cachedContent     = loadSiteContentSync();
  const cachedProjects    = loadProjectsSync();
  const cachedTestimonials = loadTestimonialsSync();

  function renderAll(siteContent, projects, testimonials) {
    injectAnalytics(siteContent.settings.analyticsMeasurementId);
    renderProfileBlocks(siteContent);
    renderPageText(siteContent);
    renderHomeAndAboutEducation(siteContent);
    renderSkills(siteContent);
    renderExperience(siteContent);
    renderProjectsPage(projects, siteContent);
  }

  renderAll(cachedContent, cachedProjects, cachedTestimonials);

  if (document.getElementById("home-projects-grid")) {
    await renderHomePage(cachedContent, cachedProjects, cachedTestimonials);
  }

  if (document.getElementById("contactForm")) {
    await hydrateContactDetails();
    initContactForm();
  }

  await renderProjectDetailPage();

  // Run reveal + safety on the first-painted DOM so sections animate in
  initRevealObserver();
  applyExternalLinkSafety();
  attachImageFallbacks();

  // ── Phase 2: silent background refresh from Supabase ──
  // Only runs if Supabase is configured; silently re-renders with fresh data.
  const [siteContent, projects, testimonials] = await Promise.all([
    loadSiteContent(),
    loadProjects(),
    loadTestimonials()
  ]);

  renderAll(siteContent, projects, testimonials);

  if (document.getElementById("home-projects-grid")) {
    await renderHomePage(siteContent, projects, testimonials);
  }

  // Re-run observers so any newly rendered elements also animate
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
