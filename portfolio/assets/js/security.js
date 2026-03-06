const ALLOWED_TAGS = new Set(["A", "BLOCKQUOTE", "EM", "H2", "H3", "IMG", "LI", "OL", "P", "STRONG", "U", "UL", "BR"]);
const ALLOWED_ATTRS = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt"])
};

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

export function sanitizePlainText(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

export function escapeHtml(value) {
  return sanitizePlainText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
    return raw;
  }

  try {
    const parsed = new URL(raw, window.location.origin);
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? parsed.toString() : "";
  } catch (error) {
    return "";
  }
}

export function sanitizeImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  // Local-mode uploads are stored as data URLs in localStorage.
  if (raw.startsWith("data:image/")) {
    return raw;
  }

  const safe = sanitizeUrl(raw);
  if (!safe) {
    return "";
  }

  if (safe.startsWith(window.location.origin) || safe.startsWith("data:image/")) {
    return safe;
  }

  if (
    safe.includes(".supabase.co/storage/v1/object/public/") ||
    safe.includes(".supabase.in/storage/v1/object/public/")
  ) {
    return safe;
  }

  return "";
}

function replaceNodeWithChildren(node) {
  const parent = node.parentNode;
  if (!parent) {
    return;
  }

  while (node.firstChild) {
    parent.insertBefore(node.firstChild, node);
  }
  parent.removeChild(node);
}

function sanitizeElementAttributes(node) {
  Array.from(node.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const allowed = ALLOWED_ATTRS[node.tagName];
    const isAllowed = allowed && allowed.has(attribute.name);

    if (name.startsWith("on") || !isAllowed) {
      node.removeAttribute(attribute.name);
      return;
    }

    if (node.tagName === "A" && attribute.name === "href") {
      const safeHref = sanitizeUrl(attribute.value);
      if (!safeHref) {
        node.removeAttribute("href");
        return;
      }
      node.setAttribute("href", safeHref);
      if (safeHref.startsWith("http")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
      return;
    }

    if (node.tagName === "IMG" && attribute.name === "src") {
      const safeSrc = sanitizeImageUrl(attribute.value);
      if (!safeSrc) {
        node.remove();
        return;
      }
      node.setAttribute("src", safeSrc);
    }
  });
}

export function sanitizeRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const elements = [];

  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }

  elements.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    if (!ALLOWED_TAGS.has(node.tagName)) {
      replaceNodeWithChildren(node);
      return;
    }

    sanitizeElementAttributes(node);
  });

  return template.innerHTML;
}

export function safeSetHtml(element, html) {
  if (!element) {
    return;
  }
  element.innerHTML = sanitizeRichHtml(html);
}

export function applyExternalLinkSafety(scope = document) {
  scope.querySelectorAll('a[target="_blank"]').forEach((anchor) => {
    anchor.setAttribute("rel", "noopener noreferrer");
  });
}

export function attachImageFallbacks(scope = document, fallbackSrc = "assets/images/profile-placeholder.svg") {
  scope.querySelectorAll("img").forEach((image) => {
    if (image.dataset.fallbackBound === "true") {
      return;
    }

    image.dataset.fallbackBound = "true";
    image.addEventListener("error", () => {
      if (image.dataset.fallbackApplied === "true") {
        return;
      }

      image.dataset.fallbackApplied = "true";
      image.src = fallbackSrc;
      image.classList.add("image-fallback");
    });
  });
}

export function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}
