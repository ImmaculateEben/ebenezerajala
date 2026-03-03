/**
 * main.js — Shared portfolio interactivity
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('nav-active');
      hamburger.classList.toggle('toggle');
    });

    // Close on nav link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-active');
        hamburger.classList.remove('toggle');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('nav-active');
        hamburger.classList.remove('toggle');
      }
    });
  }

  // 2. Navbar scroll effect
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const updateNav = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  // 3. Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  }

  // 4. Render projects if on projects page
  if (document.getElementById('projects-container')) {
    renderProjects();
  }

  // Render featured projects if on home page
  if (document.getElementById('home-projects-grid')) {
    renderFeaturedProjects();
  }

  // 5. Render single project if on project page
  if (document.getElementById('project-detail')) {
    renderProjectDetail();
  }

  // 6. Dashboard init if on admin page
  if (document.getElementById('admin-dashboard')) {
    initAdmin();
  }
});

/* ---- Projects Rendering ---- */
function renderProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const projects = getProjects();
  container.innerHTML = '';

  projects.forEach((p, i) => {
    const card = document.createElement('a');
    card.href = `project.html?id=${p.id}`;
    card.className = 'project-card-full card-glass reveal';
    card.style.setProperty('--delay', `${i * 0.08}s`);
    card.innerHTML = `
      <div class="project-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="project-info">
        <h3>${p.title}</h3>
        <p>${p.shortDesc}</p>
        <div class="project-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <div class="project-actions">
          <span class="btn btn-primary" style="pointer-events:none;">View Details <i class="fa-solid fa-arrow-right"></i></span>
          ${p.url ? `<a href="${p.url}" target="_blank" class="btn btn-outline" onclick="event.stopPropagation()">Live Site <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
        </div>
      </div>`;
    container.appendChild(card);
  });

  // Re-observe new reveal elements
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
  }, { threshold: 0.1 });
  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function renderFeaturedProjects() {
  const container = document.getElementById('home-projects-grid');
  if (!container) return;

  // Get only featured projects or up to 3 latest
  let projects = getProjects();
  let featured = projects.filter(p => p.featured);

  // If no featured projects, just take the first 3
  if (featured.length === 0) featured = projects.slice(0, 3);
  else featured = featured.slice(0, 3);

  container.innerHTML = '';

  featured.forEach((p, i) => {
    const card = document.createElement('a');
    card.href = `project.html?id=${p.id}`;
    card.className = 'project-card-full card-glass reveal delay-' + (i + 1);
    card.innerHTML = `
      <div class="project-number">${String(i + 1).padStart(2, '0')}</div>
      <div class="project-info">
        <h3>${p.title}</h3>
        <p>${p.shortDesc}</p>
        <div class="project-tags">${p.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
        <div class="project-actions">
          <span class="btn btn-primary" style="pointer-events:none;">View Details <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>`;
    container.appendChild(card);
  });

  // Re-observe new reveal elements
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
  }, { threshold: 0.1 });
  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---- Single Project Detail ---- */
function renderProjectDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const project = getProject(id);
  const container = document.getElementById('project-detail');

  if (!project) {
    container.innerHTML = `<div class="container" style="padding:8rem 0; text-align:center;">
      <h2>Project not found</h2>
      <p style="color:var(--text-secondary);margin:1rem 0 2rem;">The project you're looking for doesn't exist.</p>
      <a href="projects.html" class="btn btn-primary">← Back to Projects</a>
    </div>`;
    return;
  }

  document.title = `${project.title} | Ebenezer Ajala`;

  container.innerHTML = `
    <!-- Project Hero -->
    <div class="project-hero" style="background: ${project.gradient || 'var(--bg-alt)'};">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="project-hero-content fade-in-up">
        <a href="projects.html" class="project-back"><i class="fa-solid fa-arrow-left"></i> Back to Projects</a>
        <div class="project-tags" style="margin-bottom:1rem;">${project.tags.map(t => `<span>${t}</span>`).join('')}</div>
        <h1>${project.title}</h1>
        <p style="color:rgba(255,255,255,0.7); font-size:1.05rem; max-width:600px;">${project.shortDesc}</p>
      </div>
    </div>

    <!-- Project Content -->
    <section class="section">
      <div class="container">
        <div class="project-detail-grid">
          <div class="project-long-desc reveal ck-content custom-html-content">
            ${project.image ? `<img src="${project.image}" alt="${project.title}" class="project-featured-img" style="width:100%; max-height:400px; object-fit:cover; border-radius:14px; margin-bottom:2rem; box-shadow:0 8px 30px rgba(0,0,0,0.3);">` : ''}
            <h2 class="section-title">Project Overview</h2>
            ${(project.longDesc || project.shortDesc).includes('<') ? (project.longDesc || project.shortDesc) : (project.longDesc || project.shortDesc).split('\n').map(p => `<p>${p}</p>`).join('')}
          </div>

          <div class="project-detail-sidebar reveal delay-1">
            ${(project.url || project.github) ? `
            <div class="sidebar-card card-glass">
              <h4>Links</h4>
              <div class="sidebar-links">
                ${project.url ? `<a href="${project.url}" target="_blank" class="sidebar-link"><i class="fa-solid fa-globe"></i> Visit Live Site</a>` : ''}
                ${project.github ? `<a href="${project.github}" target="_blank" class="sidebar-link"><i class="fa-brands fa-github"></i> View Source</a>` : ''}
              </div>
            </div>` : ''}

            <div class="sidebar-card card-glass">
              <h4>Technologies</h4>
              <div class="project-tags">${project.tags.map(t => `<span>${t}</span>`).join('')}</div>
            </div>

            <div class="sidebar-card card-glass">
              <h4>More Projects</h4>
              <a href="projects.html" class="btn btn-outline" style="width:100%; justify-content:center;">
                <i class="fa-solid fa-grid-2"></i> View All Projects
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Activate reveals
  setTimeout(() => {
    container.querySelectorAll('.reveal').forEach(el => {
      const obs = new IntersectionObserver(e => { e.forEach(x => { if (x.isIntersecting) x.target.classList.add('active'); }); }, { threshold: 0.1 });
      obs.observe(el);
    });
  }, 100);
}
