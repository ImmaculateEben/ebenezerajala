import { loadSiteContent, submitContactMessage } from "./content-service.js";
import { applyExternalLinkSafety, escapeHtml } from "./security.js";

function setStatus(element, message, variant) {
  if (!element) {
    return;
  }

  element.classList.remove("is-error", "is-success");
  element.classList.add(variant === "error" ? "is-error" : "is-success");
  element.innerHTML = message;
  element.hidden = false;
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
    linkedInLink.href = profile.linkedin;
    linkedInLink.textContent = profile.linkedin.replace(/^https?:\/\/(www\.)?/, "");
  }

  if (locationLabel) {
    locationLabel.textContent = profile.location;
  }

  applyExternalLinkSafety();
}

export function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) {
    return;
  }

  const submitButton = document.getElementById("submit-btn");
  const status = document.getElementById("contact-form-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
      website: form.website.value
    };

    if (!String(payload.name || "").trim() || !String(payload.email || "").trim() || !String(payload.message || "").trim()) {
      setStatus(status, "Please complete your name, email, and message before sending.", "error");
      return;
    }

    if (String(payload.message || "").trim().length > 3000) {
      setStatus(status, "Please keep your message under 3000 characters.", "error");
      return;
    }

    status.hidden = true;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Sending <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const result = await submitContactMessage(payload);
      form.reset();
      const deliveredTo = escapeHtml(result?.deliveredTo || "the configured inbox");
      setStatus(
        status,
        `Message sent successfully. Thanks for reaching out — I will reply via <strong>${deliveredTo}</strong>.`,
        "success"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Your message could not be sent right now.";
      setStatus(status, escapeHtml(message), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
    }
  });
}
