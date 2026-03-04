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

  // Render featured projects and tech stack if on home page
  if (document.getElementById('home-projects-grid')) {
    renderFeaturedProjects();
    renderHomeTechStack();
  }

  // Render testimonials if on home page
  if (document.getElementById('home-testimonials-grid')) {
    renderHomeTestimonials();
  }

  // Init GitHub Calendar
  const initGithubCalendar = () => {
    const calendarEl = document.querySelector('.github-calendar, .calendar');
    if (!calendarEl || typeof GitHubCalendar !== 'function') return false;

    const normalizeGithubUsername = (value) => {
      if (!value) return '';
      return String(value)
        .trim()
        .replace(/^https?:\/\/github\.com\//i, '')
        .replace(/^@/, '')
        .split('/')[0]
        .trim();
    };

    const profile = (typeof getProfile === 'function') ? getProfile() : null;
    const profileGithubUsername = normalizeGithubUsername(profile?.githubUsername || profile?.github);
    const attrGithubUsername = normalizeGithubUsername(calendarEl.dataset.githubUsername);
    const username = profileGithubUsername || attrGithubUsername || 'ImmaculateEben';
    calendarEl.dataset.githubUsername = username;

    try {
      GitHubCalendar(calendarEl, username, {
        responsive: true,
        tooltips: true,
      });
      return true;
    } catch (error) {
      calendarEl.innerHTML = '<p style="color:var(--text-muted);">Unable to load GitHub contributions right now.</p>';
      return false;
    }
  };

  if (!initGithubCalendar()) {
    window.addEventListener('load', () => {
      if (!initGithubCalendar()) {
        const calendarEl = document.querySelector('.github-calendar, .calendar');
        if (calendarEl) {
          calendarEl.innerHTML = '<p style="color:var(--text-muted);">GitHub contributions could not be loaded. Check internet access or username.</p>';
        }
      }
    }, { once: true });
  }

  // 5. Render single project if on project page
  if (document.getElementById('project-detail')) {
    renderProjectDetail();
  }

  // 6. Dashboard init if on admin page
  if (document.getElementById('admin-dashboard')) {
    initAdmin();
  }

  // 7. Inject Profile data (image and animated titles)
  renderProfileData();
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
      ${p.image ? `<img src="${p.image}" alt="${p.title}" class="project-featured-img">` : ''}
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
      ${p.image ? `<img src="${p.image}" alt="${p.title}" class="project-featured-img">` : ''}
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

function renderHomeTechStack() {
  const container = document.getElementById('home-tech-stack-grid');
  if (!container) return;

  const selectedStacks = getTechStacks();
  if (!selectedStacks || selectedStacks.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No tech stack selected.</p>';
    return;
  }

  let html = '';
  selectedStacks.forEach((stackId, index) => {
    const stackDef = AVAILABLE_TECH_STACKS.find(s => s.id === stackId);
    if (!stackDef) return;

    html += `
      <div class="tech-stack-item reveal" style="animation-delay: ${index * 0.1}s">
        <div class="tech-stack-icon-wrapper">
          <i class="${stackDef.icon}"></i>
        </div>
        <span>${stackDef.name}</span>
      </div>
    `;
  });

  container.innerHTML = html;

  // Re-observe new reveal elements
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }, 100);
}

// ------------------------------------
// FRONTEND TESTIMONIALS RENDERING
// ------------------------------------
function renderHomeTestimonials() {
  const container = document.getElementById('home-testimonials-grid');
  if (!container) return;

  const testimonials = (typeof getTestimonials === 'function') ? getTestimonials() : [];
  if (!testimonials || testimonials.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; width:100%;">No testimonials added yet.</p>';
    return;
  }

  let html = '';
  testimonials.forEach((t, i) => {
    html += `
      <div class="card-glass reveal" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.5rem; animation-delay: ${i * 0.1}s">
        <div>
          <i class="fa-solid fa-quote-left" style="color: var(--accent); font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p style="color: var(--text-primary); font-size: 1rem; line-height: 1.7; font-style: italic;">"${t.content}"</p>
        </div>
        <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 1rem;">
          <h4 style="color: var(--accent); margin-bottom: 0.25rem;">${t.name}</h4>
          <span style="color: var(--text-secondary); font-size: 0.85rem;">${t.role}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Re-observe new reveal elements
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }, 100);
}

// ------------------------------------
// PROFILE DATA (Image & Animated Titles & Bio)
// ------------------------------------
function renderProfileData() {
  const profile = (typeof getProfile === 'function') ? getProfile() : null;
  if (!profile) return;

  // 1. Inject Profile Image
  if (profile.profileImage) {
    document.querySelectorAll('.profile-img-dynamic').forEach(img => {
      img.src = profile.profileImage;
    });
  }

  // Inject Basic Profile Info into specific IDs
  const locationEl = document.getElementById('profile-location');
  if (locationEl && profile.location) {
    locationEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${profile.location}`;
  }

  const emailEl = document.getElementById('profile-email');
  if (emailEl && profile.email) {
    emailEl.innerHTML = `<i class="fa-solid fa-envelope"></i> ${profile.email}`;
  }

  const nameEl = document.getElementById('profile-name');
  if (nameEl && profile.name) {
    nameEl.textContent = profile.name;
  }

  // Inject Bio Text into specific IDs
  // In index.html, we just show the first two paragraph roughly or whatever they typed
  // In about.html, we show all paragraphs. 
  const bioContainer = document.getElementById('profile-bio-container');
  if (bioContainer) {
    // If it's the home page, there's less text
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const isAbout = window.location.pathname.endsWith('about.html');

    if (isHome) {
      bioContainer.innerHTML = `
        <h2 class="section-title">About <span class="highlight">Me</span></h2>
        ${profile.bio ? `<p>${profile.bio}</p>` : ''}
        ${profile.bio2 ? `<p>${profile.bio2}</p>` : ''}
        <a href="about.html" class="btn btn-primary" style="margin-top: 1rem;">Learn More About Me <i class="fa-solid fa-arrow-right"></i></a>
      `;
    } else if (isAbout) {
      bioContainer.innerHTML = `
        <h2 class="section-title">Who I Am</h2>
        ${profile.bio ? `<p>${profile.bio}</p>` : ''}
        ${profile.bio2 ? `<p>${profile.bio2}</p>` : ''}
        ${profile.bio3 ? `<p>${profile.bio3}</p>` : ''}
        <a href="assets/docs/resume.docx" class="btn btn-primary" download style="margin-top:0.5rem;">
            Download My Resume <i class="fa-solid fa-download"></i>
        </a>
      `;
    }
  }


  // 2. Initialize Text Rotator
  const titles = profile.animatedTitles;
  if (titles && titles.length > 0) {
    const containers = document.querySelectorAll('.animated-titles-container');

    containers.forEach(container => {
      let index = 0;
      let charIndex = 0;
      let isDeleting = false;
      let currentString = '';

      const typeSpeed = 100;
      const deleteSpeed = 50;
      const pauseEnd = 2000;
      const pauseStart = 500;

      function type() {
        const fullString = titles[index % titles.length] || '';

        if (isDeleting) {
          currentString = fullString.substring(0, charIndex - 1);
          charIndex--;
        } else {
          currentString = fullString.substring(0, charIndex + 1);
          charIndex++;
        }

        container.innerHTML = `<span class="typing-text">${currentString}</span><span class="typing-cursor">|</span>`;

        let typeDelay = isDeleting ? deleteSpeed : typeSpeed;

        if (!isDeleting && currentString === fullString) {
          typeDelay = pauseEnd;
          isDeleting = true;
        } else if (isDeleting && currentString === '') {
          isDeleting = false;
          index++;
          typeDelay = pauseStart;
        }

        setTimeout(type, typeDelay);
      }

      type(); // Start looping for this container
    });
  }
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
          <div class="project-main-content">
              <div class="project-long-desc reveal ck-content custom-html-content">
                ${project.image ? `<img src="${project.image}" alt="${project.title}" class="project-featured-img" style="width:100%; max-height:400px; object-fit:cover; border-radius:14px; margin-bottom:2rem; box-shadow:0 8px 30px rgba(0,0,0,0.3);">` : ''}
                <h2 class="section-title">Project Overview</h2>
                ${(project.longDesc || project.shortDesc).includes('<') ? (project.longDesc || project.shortDesc) : (project.longDesc || project.shortDesc).split('\n').map(p => `<p>${p}</p>`).join('')}
              </div>

              ${project.gallery && project.gallery.length > 0 ? `
              <div class="project-gallery reveal">
                <h3 class="section-title" style="margin-top:3rem;">Project Gallery</h3>
                <div class="project-gallery-grid">
                    ${project.gallery.map(imgSrc => `
                        <div class="gallery-item" onclick="openLightbox('${imgSrc}')">
                            <img src="${imgSrc}" alt="${project.title} gallery image">
                        </div>
                    `).join('')}
                </div>
              </div>
              
              <!-- Lightbox Overlay -->
              <div id="project-lightbox" class="lightbox" onclick="closeLightbox()">
                  <span class="lightbox-close">&times;</span>
                  <img class="lightbox-content" id="lightbox-img">
              </div>
              
              <script>
                function openLightbox(src) {
                    const lightbox = document.getElementById('project-lightbox');
                    const lightboxImg = document.getElementById('lightbox-img');
                    lightboxImg.src = src;
                    lightbox.classList.add('active');
                }
                function closeLightbox() {
                    const lightbox = document.getElementById('project-lightbox');
                    lightbox.classList.remove('active');
                }
              </script>
              ` : ''}
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
