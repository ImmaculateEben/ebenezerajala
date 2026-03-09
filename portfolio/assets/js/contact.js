import { loadSiteContent, submitContactMessage } from "./content-service.js";
import { getRuntimeConfig, isSupabaseReady } from "./supabase-config.js";
import { applyExternalLinkSafety, sanitizeUrl } from "./security.js";

let turnstileLoaderPromise = null;
let turnstileWidgetId = null;
let turnstileResizeCleanup = null;

const TURNSTILE_BASE_WIDTH = 300;
const TURNSTILE_BASE_HEIGHT = 65;

function setStatus(element, message, variant) {
  if (!element) {
    return;
  }

  element.classList.remove("is-error", "is-success");
  element.classList.add(variant === "error" ? "is-error" : "is-success");
  element.textContent = String(message || "");
  element.hidden = false;
}

function getTurnstileSiteKey() {
  return String(getRuntimeConfig().turnstileSiteKey || "").trim();
}

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoaderPromise) {
    return turnstileLoaderPromise;
  }

  turnstileLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }

      reject(new Error("Cloudflare Turnstile failed to initialize."));
    };
    script.onerror = () => reject(new Error("Cloudflare Turnstile could not be loaded."));
    document.head.appendChild(script);
  });

  return turnstileLoaderPromise;
}

function getTurnstileAvailableWidth(container) {
  const styles = window.getComputedStyle(container);
  const paddingLeft = parseFloat(styles.paddingLeft || "0") || 0;
  const paddingRight = parseFloat(styles.paddingRight || "0") || 0;
  return Math.max(0, container.clientWidth - paddingLeft - paddingRight);
}

function syncTurnstileWidgetLayout() {
  const container = document.getElementById("turnstile-container");
  const widget = document.getElementById("turnstile-widget");

  if (!container || !widget || container.hidden) {
    return;
  }

  const availableWidth = getTurnstileAvailableWidth(container);
  const scale = availableWidth > 0 ? Math.min(1, availableWidth / TURNSTILE_BASE_WIDTH) : 1;

  container.style.setProperty("--turnstile-scale", String(scale));
  container.classList.toggle("turnstile-is-scaled", scale < 0.999);
  widget.style.width = scale < 1 ? `${TURNSTILE_BASE_WIDTH}px` : "min(100%, 300px)";
  widget.style.height = `${Math.ceil(TURNSTILE_BASE_HEIGHT * scale)}px`;
  widget.style.transform = scale < 1 ? `scale(${scale})` : "";
}

function bindTurnstileLayoutWatcher() {
  if (turnstileResizeCleanup) {
    return;
  }

  const handleResize = () => syncTurnstileWidgetLayout();
  window.addEventListener("resize", handleResize, { passive: true });

  let resizeObserver = null;
  if ("ResizeObserver" in window) {
    const container = document.getElementById("turnstile-container");
    if (container) {
      resizeObserver = new ResizeObserver(() => syncTurnstileWidgetLayout());
      resizeObserver.observe(container);
    }
  }

  turnstileResizeCleanup = () => {
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    turnstileResizeCleanup = null;
  };
}

async function ensureTurnstile(status) {
  const siteKey = getTurnstileSiteKey();
  const container = document.getElementById("turnstile-container");
  if (!container) {
    return;
  }

  if (!siteKey) {
    container.hidden = true;
    return;
  }

  if (turnstileWidgetId !== null) {
    container.hidden = false;
    bindTurnstileLayoutWatcher();
    window.requestAnimationFrame(syncTurnstileWidgetLayout);
    return;
  }

  try {
    const turnstile = await loadTurnstileScript();
    container.hidden = false;
    turnstileWidgetId = turnstile.render("#turnstile-widget", {
      sitekey: siteKey,
      theme: "auto"
    });
    bindTurnstileLayoutWatcher();
    window.requestAnimationFrame(syncTurnstileWidgetLayout);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudflare Turnstile could not be loaded.";
    setStatus(status, message, "error");
  }
}

function getTurnstileToken() {
  if (!getTurnstileSiteKey() || !window.turnstile || turnstileWidgetId === null) {
    return "";
  }

  try {
    return String(window.turnstile.getResponse(turnstileWidgetId) || "").trim();
  } catch (_error) {
    return "";
  }
}

function resetTurnstile() {
  if (!window.turnstile || turnstileWidgetId === null) {
    return;
  }

  try {
    window.turnstile.reset(turnstileWidgetId);
  } catch (_error) {
    // Ignore Turnstile reset issues after submit attempts.
  }
}

export async function hydrateContactDetails() {
  const siteContent = await loadSiteContent();
  const profile = siteContent.profile;

  const emailLink = document.getElementById("contact-email-link");
  const phonePrimary = document.getElementById("contact-phone-primary");
  const phoneSecondary = document.getElementById("contact-phone-secondary");
  const linkedInLink = document.getElementById("contact-linkedin-link");
  const locationLabel = document.getElementById("contact-location-label");

  if (emailLink) {
    emailLink.href = `mailto:${profile.email}`;
    emailLink.textContent = profile.email;
  }

  if (phonePrimary) {
    phonePrimary.href = `tel:${profile.phone1.replace(/\s+/g, "")}`;
    phonePrimary.textContent = profile.phone1;
  }

  if (phoneSecondary) {
    phoneSecondary.href = `tel:${profile.phone2.replace(/\s+/g, "")}`;
    phoneSecondary.textContent = profile.phone2;
  }

  if (linkedInLink) {
    const safeLinkedIn = sanitizeUrl(profile.linkedin);
    if (safeLinkedIn) {
      linkedInLink.href = safeLinkedIn;
      linkedInLink.textContent = safeLinkedIn.replace(/^https?:\/\/(www\.)?/, "");
    }
  }

  if (locationLabel) {
    locationLabel.textContent = profile.location;
  }

  applyExternalLinkSafety();
}

export function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  const submitButton = document.getElementById("submit-btn");
  const status = document.getElementById("contact-form-status");

  void ensureTurnstile(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
      website: form.website.value,
      turnstileToken: ""
    };

    if (!String(payload.name || "").trim() || !String(payload.email || "").trim() || !String(payload.message || "").trim()) {
      setStatus(status, "Please complete your name, email, and message before sending.", "error");
      return;
    }

    if (String(payload.message || "").trim().length > 3000) {
      setStatus(status, "Please keep your message under 3000 characters.", "error");
      return;
    }

    if (getTurnstileSiteKey()) {
      payload.turnstileToken = getTurnstileToken();
      if (!payload.turnstileToken) {
        setStatus(status, "Please complete the spam-protection check before sending.", "error");
        return;
      }
    } else if (isSupabaseReady()) {
      setStatus(status, "Contact form protection is not configured yet. Please use the email address above for now.", "error");
      return;
    }

    status.classList.remove("is-error", "is-success");
    submitButton.disabled = true;
    submitButton.innerHTML = 'Sending <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const result = await submitContactMessage(payload);
      form.reset();
      resetTurnstile();
      setStatus(
        status,
        `Message sent! Thanks for reaching out — I'll get back to you as soon as possible.`,
        "success"
      );
    } catch (error) {
      resetTurnstile();
      const message = error instanceof Error ? error.message : "Your message could not be sent right now.";
      setStatus(status, message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
    }
  });
}
