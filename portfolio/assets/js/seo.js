import { sanitizeImageUrl, sanitizePlainText, sanitizeUrl } from "./security.js";

const DEFAULT_SITE_NAME = "Ebenezer Ajala";
const DEFAULT_SITE_URL = "https://immaculatedesigns.com.ng";
const DEFAULT_IMAGE_PATH = "assets/images/profile-placeholder.svg";
const ANALYTICS_ID_PATTERN = /^(?:G|AW)-[A-Z0-9]+$/i;

function normalizeSiteUrl(value) {
  const raw = sanitizePlainText(value || "");
  if (!raw) {
    return "";
  }

  const safe = sanitizeUrl(raw);
  if (!safe || safe.startsWith("/")) {
    return "";
  }

  try {
    const parsed = new URL(safe);
    if (!/^https?:$/.test(parsed.protocol)) {
      return "";
    }

    parsed.hash = "";
    parsed.search = "";
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${pathname}`;
  } catch (_error) {
    return "";
  }
}

function resolveAbsoluteUrl(value, siteUrl) {
  const raw = sanitizePlainText(value || "");
  if (!raw) {
    return "";
  }

  try {
    return new URL(raw, `${siteUrl}/`).toString();
  } catch (_error) {
    return "";
  }
}

function upsertMetaTag(selector, attributes, content) {
  if (!content) {
    return;
  }

  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      meta.setAttribute(key, value);
    });
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertLinkTag(rel, href) {
  if (!href) {
    return;
  }

  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

function getExistingMetaContent(selector) {
  return sanitizePlainText(document.querySelector(selector)?.getAttribute("content") || "");
}

function clearManagedVerificationTags() {
  document.querySelectorAll('meta[data-seo-verification="true"]').forEach((node) => node.remove());
}

function appendVerificationTag(name, content) {
  const safeName = sanitizePlainText(name || "");
  const safeContent = sanitizePlainText(content || "");
  if (!safeName || !safeContent) {
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", safeName);
  meta.setAttribute("content", safeContent);
  meta.dataset.seoVerification = "true";
  document.head.appendChild(meta);
}

function applyVerificationTags(rawValue) {
  clearManagedVerificationTags();

  const source = String(rawValue || "").trim();
  if (!source) {
    return;
  }

  if (!source.includes("<")) {
    appendVerificationTag("google-site-verification", source);
    return;
  }

  const template = document.createElement("template");
  template.innerHTML = source;
  template.content.querySelectorAll("meta").forEach((meta) => {
    appendVerificationTag(meta.getAttribute("name") || "", meta.getAttribute("content") || "");
  });
}

export function resolveSiteUrl(preferredUrl = "") {
  return (
    normalizeSiteUrl(preferredUrl) ||
    normalizeSiteUrl(window.EA_RUNTIME_CONFIG?.siteUrl || "") ||
    normalizeSiteUrl(DEFAULT_SITE_URL) ||
    window.location.origin
  );
}

export function applySeo({
  siteUrl = "",
  title = "",
  description = "",
  image = "",
  url = "",
  canonicalUrl = "",
  robots = "",
  type = "website",
  siteName = DEFAULT_SITE_NAME,
  verificationTags = ""
} = {}) {
  const resolvedSiteUrl = resolveSiteUrl(siteUrl);
  const finalTitle = sanitizePlainText(title || document.title);
  const finalDescription = sanitizePlainText(description || getExistingMetaContent('meta[name="description"]'));
  const finalType = sanitizePlainText(type || "website") || "website";
  const finalRobots = sanitizePlainText(robots || getExistingMetaContent('meta[name="robots"]'));
  const fallbackImage = image || DEFAULT_IMAGE_PATH;
  const imageUrl = resolveAbsoluteUrl(sanitizeImageUrl(fallbackImage) || sanitizeUrl(fallbackImage) || fallbackImage, resolvedSiteUrl);
  const pageUrl = resolveAbsoluteUrl(
    canonicalUrl || url || `${window.location.pathname}${window.location.search}`,
    resolvedSiteUrl
  );

  if (finalTitle) {
    document.title = finalTitle;
  }

  upsertLinkTag("canonical", pageUrl);

  upsertMetaTag('meta[name="description"]', { name: "description" }, finalDescription);
  upsertMetaTag('meta[name="robots"]', { name: "robots" }, finalRobots || "index,follow,max-image-preview:large");

  upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, finalTitle);
  upsertMetaTag('meta[property="og:description"]', { property: "og:description" }, finalDescription);
  upsertMetaTag('meta[property="og:type"]', { property: "og:type" }, finalType);
  upsertMetaTag('meta[property="og:url"]', { property: "og:url" }, pageUrl);
  upsertMetaTag('meta[property="og:image"]', { property: "og:image" }, imageUrl);
  upsertMetaTag('meta[property="og:image:alt"]', { property: "og:image:alt" }, finalTitle || siteName);
  upsertMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }, siteName);

  upsertMetaTag('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
  upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, finalTitle);
  upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, finalDescription);
  upsertMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }, imageUrl);
  applyVerificationTags(verificationTags);
}

export function injectAnalytics(measurementId) {
  const normalizedId = sanitizePlainText(measurementId || "").toUpperCase();
  if (!ANALYTICS_ID_PATTERN.test(normalizedId)) {
    return;
  }

  const currentPage = `${window.location.pathname}${window.location.search}`;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const existingLoader = document.querySelector('script[data-analytics="ea-ga"]');
  const activeId = document.documentElement.dataset.analyticsId || "";

  if (existingLoader && activeId === normalizedId) {
    window.gtag("config", normalizedId, { page_path: currentPage });
    return;
  }

  if (existingLoader) {
    existingLoader.remove();
  }

  document.documentElement.dataset.analyticsId = normalizedId;
  window.gtag("js", new Date());

  const loader = document.createElement("script");
  loader.async = true;
  loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(normalizedId)}`;
  loader.dataset.analytics = "ea-ga";
  loader.dataset.measurementId = normalizedId;
  loader.addEventListener("load", () => {
    window.gtag("config", normalizedId, { page_path: currentPage });
  });

  document.head.appendChild(loader);
}
