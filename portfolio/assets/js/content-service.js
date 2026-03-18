import {
  AVAILABLE_TECH_STACKS,
  DEFAULT_AUDIT_LOG,
  DEFAULT_CONTENT_VERSIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_CONTENT,
  DEFAULT_TESTIMONIALS,
  getDefaultState
} from "./default-data.js";
import { getRuntimeConfig, getRuntimeMode, getSupabaseClient, isSupabaseReady } from "./supabase-config.js";
import {
  normalizeArray,
  sanitizeImageUrl,
  sanitizePlainText,
  sanitizeRichHtml,
  sanitizeUrl
} from "./security.js";

const LOCAL_STATE_KEY = "ea_portfolio_state_v4";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"]
]);
const MAIN_IMAGE_MAX_DIMENSION = 2200;
const THUMB_IMAGE_MAX_DIMENSION = 720;
const MAIN_IMAGE_QUALITY = 0.84;
const THUMB_IMAGE_QUALITY = 0.76;

let localStateCache = null;

function clone(value) {
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function readLocalState() {
  if (localStateCache) {
    return clone(localStateCache);
  }

  const defaults = getDefaultState();

  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(defaults));
      localStateCache = defaults;
      return clone(localStateCache);
    }

    const parsed = JSON.parse(raw);
    localStateCache = {
      ...defaults,
      ...parsed,
      siteContent: normalizeSiteContent(parsed.siteContent || defaults.siteContent),
      projects: normalizeArray(parsed.projects).map(normalizeProject),
      testimonials: normalizeArray(parsed.testimonials).map(normalizeTestimonial),
      messages: normalizeArray(parsed.messages).map(normalizeMessage),
      auditLog: normalizeArray(parsed.auditLog).map(normalizeAuditEntry),
      contentVersions: normalizeArray(parsed.contentVersions).map(normalizeVersionRecord)
    };
    return clone(localStateCache);
  } catch (error) {
    localStateCache = defaults;
    return clone(localStateCache);
  }
}

function writeLocalState(nextState) {
  localStateCache = {
    ...getDefaultState(),
    ...nextState,
    siteContent: normalizeSiteContent(nextState.siteContent),
    projects: normalizeArray(nextState.projects).map(normalizeProject),
    testimonials: normalizeArray(nextState.testimonials).map(normalizeTestimonial),
    messages: normalizeArray(nextState.messages).map(normalizeMessage),
    auditLog: normalizeArray(nextState.auditLog).map(normalizeAuditEntry),
    contentVersions: normalizeArray(nextState.contentVersions).map(normalizeVersionRecord)
  };
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(localStateCache));
  return clone(localStateCache);
}

function normalizeSearchConsoleSettings(value) {
  const source = value || {};
  return {
    verificationTags: sanitizePlainText(source.verificationTags || ""),
    sitemapUrl: sanitizeUrl(source.sitemapUrl || ""),
    lastPingAt: sanitizePlainText(source.lastPingAt || ""),
    lastPingStatus: sanitizePlainText(source.lastPingStatus || ""),
    lastPingMessage: sanitizePlainText(source.lastPingMessage || ""),
    indexingNotes: sanitizePlainText(source.indexingNotes || "")
  };
}

function normalizeAiWriterList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizePlainText(item))
      .filter(Boolean)
      .slice(0, 30);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => sanitizePlainText(item))
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeAiWriterSettings(value) {
  const source = value || {};
  return {
    brandVoiceProfile: sanitizePlainText(source.brandVoiceProfile || ""),
    blockedPhrases: normalizeAiWriterList(source.blockedPhrases),
    bannedClaims: normalizeAiWriterList(source.bannedClaims)
  };
}

function normalizeSiteContent(siteContent) {
  const base = clone(DEFAULT_SITE_CONTENT);
  const source = siteContent || {};
  return {
    ...base,
    ...source,
    profile: {
      ...base.profile,
      ...(source.profile || {}),
      profileImage: sanitizeImageUrl(source.profile?.profileImage || base.profile.profileImage || ""),
      profileImageAsset: normalizeImageAsset(
        source.profile?.profileImageAsset,
        source.profile?.profileImage || base.profile.profileImage || ""
      )
    },
    skills: {
      technical: normalizeArray(source.skills?.technical || base.skills.technical).map((item, index) =>
        normalizeTechnicalSkill(item, index)
      ),
      soft: normalizeArray(source.skills?.soft || base.skills.soft).map((item, index) => normalizeSoftSkill(item, index))
    },
    experience: normalizeArray(source.experience || base.experience).map((item, index) => normalizeExperience(item, index)),
    education: normalizeArray(source.education || base.education).map((item, index) => normalizeEducation(item, index)),
    certifications: normalizeArray(source.certifications || base.certifications).map((item, index) => normalizeCertification(item, index)),
    techStacks: normalizeArray(source.techStacks || base.techStacks).filter(Boolean),
    settings: {
      ...base.settings,
      ...(source.settings || {}),
      aiWriter: normalizeAiWriterSettings(source.settings?.aiWriter || base.settings.aiWriter),
      searchConsole: normalizeSearchConsoleSettings(source.settings?.searchConsole || base.settings.searchConsole)
    },
    projectCategories: normalizeArray(source.projectCategories || base.projectCategories)
      .map((s) => sanitizePlainText(s))
      .filter(Boolean)
  };
}

function normalizeTechnicalSkill(item, index) {
  return {
    id: sanitizePlainText(item?.id || `tech-${index + 1}`) || `tech-${index + 1}`,
    category: sanitizePlainText(item?.category || "Skill Group"),
    icon: sanitizePlainText(item?.icon || "fa-solid fa-wrench"),
    items: normalizeArray(item?.items).map((entry) => sanitizePlainText(entry)).filter(Boolean)
  };
}

function normalizeSoftSkill(item, index) {
  return {
    id: sanitizePlainText(item?.id || `soft-${index + 1}`) || `soft-${index + 1}`,
    title: sanitizePlainText(item?.title || "Soft Skill"),
    icon: sanitizePlainText(item?.icon || "fa-solid fa-star"),
    desc: sanitizePlainText(item?.desc || "")
  };
}

function normalizeExperience(item, index) {
  return {
    id: sanitizePlainText(item?.id || `exp-${index + 1}`) || `exp-${index + 1}`,
    role: sanitizePlainText(item?.role || "Role"),
    company: sanitizePlainText(item?.company || "Company"),
    type: sanitizePlainText(item?.type || ""),
    badge: sanitizePlainText(item?.badge || ""),
    badgeClass: sanitizePlainText(item?.badgeClass || ""),
    date: sanitizePlainText(item?.date || ""),
    summary: sanitizePlainText(item?.summary || ""),
    bullets: normalizeArray(item?.bullets).map((entry) => sanitizePlainText(entry)).filter(Boolean)
  };
}

function normalizeEducation(item, index) {
  return {
    degree: sanitizePlainText(item?.degree || `Qualification ${index + 1}`),
    school: sanitizePlainText(item?.school || ""),
    period: sanitizePlainText(item?.period || ""),
    icon: sanitizePlainText(item?.icon || "fa-solid fa-graduation-cap")
  };
}

function normalizeCertification(item, index) {
  return {
    title: sanitizePlainText(item?.title || `Certification ${index + 1}`),
    issuer: sanitizePlainText(item?.issuer || ""),
    date: sanitizePlainText(item?.date || ""),
    icon: sanitizePlainText(item?.icon || "fa-solid fa-certificate"),
    url: sanitizeUrl(item?.url || "")
  };
}

function normalizeFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeImageAsset(asset, fallbackUrl = "") {
  const url = sanitizeImageUrl(asset?.url || fallbackUrl || "");
  if (!url) {
    return null;
  }

  const thumbnailUrl = sanitizeImageUrl(asset?.thumbnailUrl || "");
  const originalUrl = sanitizeImageUrl(asset?.originalUrl || "");

  return {
    url,
    thumbnailUrl,
    originalUrl,
    width: normalizeFiniteNumber(asset?.width),
    height: normalizeFiniteNumber(asset?.height),
    contentType: sanitizePlainText(asset?.contentType || "")
  };
}

function normalizeProject(project) {
  const featuredImage = sanitizeImageUrl(project?.featuredImage || project?.image || "");
  const image = sanitizeImageUrl(project?.image || project?.featuredImage || "");
  const featuredImageAsset = normalizeImageAsset(project?.featuredImageAsset, featuredImage)
    || normalizeImageAsset(project?.imageAsset, image);
  const galleryAssets = normalizeArray(project?.galleryAssets)
    .map((asset, index) => normalizeImageAsset(asset, project?.gallery?.[index] || ""))
    .filter(Boolean);
  const gallery = galleryAssets.length
    ? galleryAssets.map((asset) => asset.url)
    : normalizeArray(project?.gallery).map((url) => sanitizeImageUrl(url)).filter(Boolean);

  return {
    id: sanitizePlainText(project?.id || cryptoRandomId("project")),
    title: sanitizePlainText(project?.title || "Untitled Project"),
    shortDesc: sanitizePlainText(project?.shortDesc || ""),
    longDesc: sanitizeRichHtml(project?.longDesc || ""),
    tags: normalizeArray(project?.tags).map((tag) => sanitizePlainText(tag)).filter(Boolean),
    url: sanitizeUrl(project?.url || ""),
    github: sanitizeUrl(project?.github || ""),
    featuredImage: featuredImageAsset?.url || featuredImage,
    image: featuredImageAsset?.url || image,
    featuredImageAsset,
    gallery,
    galleryAssets,
    featured: Boolean(project?.featured),
    gradient: sanitizePlainText(project?.gradient || "linear-gradient(135deg, #1a1a2e, #16213e)")
  };
}

function normalizeTestimonial(item) {
  const image = sanitizeImageUrl(item?.image || "");
  const imageAsset = normalizeImageAsset(item?.imageAsset, image);
  return {
    id: sanitizePlainText(item?.id || cryptoRandomId("testimonial")),
    name: sanitizePlainText(item?.name || "Client"),
    role: sanitizePlainText(item?.role || ""),
    content: sanitizePlainText(item?.content || ""),
    image: imageAsset?.url || image,
    imageAsset,
    published: item?.published !== false
  };
}

function normalizeMessage(item) {
  return {
    id: sanitizePlainText(item?.id || cryptoRandomId("message")),
    name: sanitizePlainText(item?.name || ""),
    email: sanitizePlainText(item?.email || ""),
    subject: sanitizePlainText(item?.subject || ""),
    message: sanitizePlainText(item?.message || ""),
    createdAt: sanitizePlainText(item?.createdAt || new Date().toISOString()),
    status: ["new", "read", "archived"].includes(item?.status) ? item.status : "new",
    source: "portfolio-contact-form",
    deliveredTo: sanitizePlainText(item?.deliveredTo || "")
  };
}

function normalizeAuditEntry(item) {
  return {
    id: sanitizePlainText(item?.id || cryptoRandomId("audit")),
    actorEmail: sanitizePlainText(item?.actorEmail || item?.actor_email || "").toLowerCase(),
    action: sanitizePlainText(item?.action || "update"),
    entityType: sanitizePlainText(item?.entityType || item?.entity_type || "site_content"),
    entityId: sanitizePlainText(item?.entityId || item?.entity_id || "main"),
    section: sanitizePlainText(item?.section || ""),
    summary: sanitizePlainText(item?.summary || ""),
    details: typeof item?.details === "object" && item.details ? clone(item.details) : {},
    createdAt: sanitizePlainText(item?.createdAt || item?.created_at || new Date().toISOString())
  };
}

function normalizeVersionRecord(item) {
  return {
    id: sanitizePlainText(item?.id || cryptoRandomId("version")),
    section: sanitizePlainText(item?.section || ""),
    entityType: sanitizePlainText(item?.entityType || item?.entity_type || "site_content"),
    entityId: sanitizePlainText(item?.entityId || item?.entity_id || "main"),
    snapshotType: ["auto", "draft", "restore"].includes(item?.snapshotType || item?.snapshot_type)
      ? (item.snapshotType || item.snapshot_type)
      : "auto",
    label: sanitizePlainText(item?.label || ""),
    summary: sanitizePlainText(item?.summary || ""),
    payload: typeof item?.payload === "object" && item.payload ? clone(item.payload) : {},
    createdBy: sanitizePlainText(item?.createdBy || item?.created_by || "").toLowerCase(),
    createdAt: sanitizePlainText(item?.createdAt || item?.created_at || new Date().toISOString())
  };
}

function normalizeAdminUser(row) {
  const role = sanitizePlainText(row?.role || "admin").toLowerCase();
  return {
    email: sanitizePlainText(row?.email || "").toLowerCase(),
    role: ["viewer", "editor", "admin"].includes(role) ? role : "admin",
    createdAt: sanitizePlainText(row?.created_at || row?.createdAt || ""),
    invitedBy: sanitizePlainText(row?.invited_by || row?.invitedBy || "")
  };
}

function mapPayloadRow(row, normalizer) {
  if (!row) {
    return null;
  }
  return normalizer({ id: row.id, ...(row.payload || {}) });
}

function mapMessageRow(row) {
  return normalizeMessage({
    id: row.id,
    ...(row.payload || {}),
    createdAt: row.payload?.createdAt || row.created_at
  });
}

function mapAuditRow(row) {
  return normalizeAuditEntry(row);
}

function mapVersionRow(row) {
  return normalizeVersionRecord(row);
}

function cryptoRandomId(prefix) {
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${seed}`;
}

function sanitizeUploadBaseName(value, fallback) {
  const source = String(value || "").split(/[\\/]/).pop() || fallback;
  const withoutExtension = source.replace(/\.[^.]+$/, "");
  return sanitizePlainText(withoutExtension)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "") || fallback;
}

function validateImageFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  const fileType = sanitizePlainText(file.type || "").toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(fileType)) {
    throw new Error("Only JPG, PNG, WEBP, GIF, or AVIF images are allowed.");
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("The selected image is empty.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  return fileType;
}

function sortProjects(items) {
  return [...items].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }
    return left.title.localeCompare(right.title);
  });
}

function sortMessages(items) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortAuditLog(items) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortContentVersions(items) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function pickObject(source, keys) {
  return keys.reduce((acc, key) => {
    if (key in (source || {})) {
      acc[key] = clone(source[key]);
    }
    return acc;
  }, {});
}

function areJsonValuesEqual(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function humanizeSection(section) {
  return String(section || "site content")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "site content";
}

function extractSiteContentSectionPayload(siteContent, section) {
  const content = normalizeSiteContent(siteContent);
  const profile = content.profile || {};

  switch (String(section || "").trim()) {
    case "hero":
      return pickObject(profile, [
        "name",
        "animatedTitles",
        "tagline",
        "yearsExperience",
        "clientsServed",
        "avgSpeedImprovement",
        "avgTrafficIncrease",
        "availableForFreelance",
        "linkedin",
        "github"
      ]);
    case "profile":
      return pickObject(profile, [
        "bio",
        "bio2",
        "bio3",
        "location",
        "email",
        "phone1",
        "phone2",
        "profileImage",
        "profileImageAsset"
      ]);
    case "project-categories":
      return clone(content.projectCategories || []);
    case "skills":
      return {
        techStacks: clone(content.techStacks || []),
        skills: clone(content.skills || {})
      };
    case "experience":
      return clone(content.experience || []);
    case "education":
      return clone(content.education || []);
    case "certifications":
      return clone(content.certifications || []);
    case "pages":
      return clone(content.pageText || {});
    case "settings":
      return clone(content.settings || {});
    default:
      return clone(content);
  }
}

function applySiteContentSectionPayload(siteContent, section, payload) {
  const next = normalizeSiteContent(siteContent);
  const data = clone(payload);

  switch (String(section || "").trim()) {
    case "hero":
    case "profile":
      next.profile = {
        ...next.profile,
        ...data
      };
      break;
    case "project-categories":
      next.projectCategories = normalizeArray(data).map((item) => sanitizePlainText(item)).filter(Boolean);
      break;
    case "skills":
      next.techStacks = normalizeArray(data?.techStacks).map((item) => sanitizePlainText(item)).filter(Boolean);
      next.skills = {
        technical: normalizeArray(data?.skills?.technical).map((item, index) => normalizeTechnicalSkill(item, index)),
        soft: normalizeArray(data?.skills?.soft).map((item, index) => normalizeSoftSkill(item, index))
      };
      break;
    case "experience":
      next.experience = normalizeArray(data).map((item, index) => normalizeExperience(item, index));
      break;
    case "education":
      next.education = normalizeArray(data).map((item, index) => normalizeEducation(item, index));
      break;
    case "certifications":
      next.certifications = normalizeArray(data).map((item, index) => normalizeCertification(item, index));
      break;
    case "pages":
      next.pageText = typeof data === "object" && data ? clone(data) : {};
      break;
    case "settings":
      next.settings = {
        ...next.settings,
        ...(typeof data === "object" && data ? data : {}),
        aiWriter: normalizeAiWriterSettings(data?.aiWriter || next.settings.aiWriter),
        searchConsole: normalizeSearchConsoleSettings(data?.searchConsole || next.settings.searchConsole)
      };
      break;
    default:
      return normalizeSiteContent(data);
  }

  return normalizeSiteContent(next);
}

function filterContentVersions(items, filters = {}) {
  const section = sanitizePlainText(filters.section || "");
  const entityType = sanitizePlainText(filters.entityType || "");
  const entityId = sanitizePlainText(filters.entityId || "");
  const snapshotType = sanitizePlainText(filters.snapshotType || "");
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 0;

  const filtered = sortContentVersions(items).filter((item) => {
    if (section && item.section !== section) return false;
    if (entityType && item.entityType !== entityType) return false;
    if (entityId && item.entityId !== entityId) return false;
    if (snapshotType && item.snapshotType !== snapshotType) return false;
    return true;
  });

  return limit ? filtered.slice(0, limit) : filtered;
}

async function getCurrentActorEmail() {
  if (!isSupabaseReady()) {
    return sanitizePlainText(getRuntimeConfig().adminEmail || "").toLowerCase();
  }

  const client = getClient();
  const { data } = await client.auth.getUser();
  return sanitizePlainText(data?.user?.email || getRuntimeConfig().adminEmail || "").toLowerCase();
}

function appendAuditLogLocal(entry) {
  const state = readLocalState();
  state.auditLog = sortAuditLog([normalizeAuditEntry(entry), ...normalizeArray(state.auditLog)]);
  writeLocalState(state);
  return state.auditLog[0];
}

async function insertAuditLog(entry) {
  const normalized = appendAuditLogLocal(entry);

  if (!isSupabaseReady()) {
    return normalized;
  }

  try {
    const client = getClient();
    const { error } = await client.from("admin_audit_log").insert({
      id: normalized.id,
      actor_email: normalized.actorEmail,
      action: normalized.action,
      entity_type: normalized.entityType,
      entity_id: normalized.entityId,
      section: normalized.section,
      summary: normalized.summary,
      details: normalized.details,
      created_at: normalized.createdAt
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("Saving the admin audit log remotely failed; local history was kept.", error);
  }

  return normalized;
}

function appendContentVersionLocal(entry) {
  const state = readLocalState();
  state.contentVersions = sortContentVersions([normalizeVersionRecord(entry), ...normalizeArray(state.contentVersions)]);
  writeLocalState(state);
  return state.contentVersions[0];
}

async function insertContentVersion(entry) {
  const normalized = appendContentVersionLocal(entry);

  if (!isSupabaseReady()) {
    return normalized;
  }

  try {
    const client = getClient();
    const { error } = await client.from("content_versions").insert({
      id: normalized.id,
      section: normalized.section,
      entity_type: normalized.entityType,
      entity_id: normalized.entityId,
      snapshot_type: normalized.snapshotType,
      label: normalized.label,
      summary: normalized.summary,
      payload: normalized.payload,
      created_by: normalized.createdBy,
      created_at: normalized.createdAt
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("Saving the content version remotely failed; local history was kept.", error);
  }

  return normalized;
}

async function withRemote(action, fallback) {
  if (!isSupabaseReady()) {
    return fallback();
  }

  try {
    return await action();
  } catch (error) {
    console.warn("Remote operation failed, using cached local data instead.", error);
    return fallback();
  }
}

function getClient() {
  return getSupabaseClient();
}

async function parseFunctionError(error, fallbackMessage) {
  if (error?.context && typeof error.context === "object" && typeof error.context.error === "string") {
    return error.context.error;
  }

  const response = error?.context;
  if (response && typeof response === "object") {
    const readable = typeof response.clone === "function" ? response.clone() : response;

    if (typeof readable.json === "function") {
      try {
        const parsed = await readable.json();
        if (typeof parsed?.error === "string") {
          return parsed.error;
        }
        if (typeof parsed?.message === "string") {
          return parsed.message;
        }
      } catch (_error) {
        // Fall through to plain-text parsing.
      }
    }

    if (typeof readable.text === "function") {
      try {
        const text = String(await readable.text()).trim();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (typeof parsed?.error === "string") {
              return parsed.error;
            }
            if (typeof parsed?.message === "string") {
              return parsed.message;
            }
          } catch (_error) {
            return text;
          }
        }
      } catch (_error) {
        // Ignore unreadable bodies and fall through.
      }
    }

    if (Number.isFinite(response.status) && response.status > 0) {
      const label = String(response.statusText || "").trim();
      return label ? `${response.status} ${label}` : `Request failed with status ${response.status}.`;
    }
  }

  if (typeof error?.context === "string") {
    try {
      const parsed = JSON.parse(error.context);
      if (typeof parsed?.error === "string") {
        return parsed.error;
      }
    } catch (_error) {
      // Ignore invalid JSON and fall through to the generic message.
    }
  }

  return error?.message || fallbackMessage;
}

async function upsertPayloadRow(table, id, payload) {
  const client = getClient();
  const { error } = await client.from(table).upsert(
    {
      id,
      payload
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message || `Unable to save ${table}.`);
  }
}

async function deletePayloadRow(table, id) {
  const client = getClient();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) {
    throw new Error(error.message || `Unable to delete from ${table}.`);
  }
}

export function getAvailableTechStacks() {
  return clone(AVAILABLE_TECH_STACKS);
}

export function getContentRuntimeMode() {
  return getRuntimeMode();
}

/**
 * Synchronous helpers — read instantly from the in-memory / localStorage cache.
 * These never hit the network, so they return in < 1 ms and can be used for the
 * first render pass before the Supabase fetches complete.
 */
export function loadSiteContentSync() {
  return readLocalState().siteContent;
}

export function loadProjectsSync() {
  return sortProjects(readLocalState().projects);
}

export function loadTestimonialsSync() {
  return readLocalState().testimonials;
}

export async function loadSiteContent() {
  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client.from("site_content").select("id, payload").eq("id", "main").maybeSingle();
      if (error && error.code !== "PGRST116") {
        throw new Error(error.message || "Unable to load site content.");
      }

      const normalized = data ? normalizeSiteContent(data.payload || {}) : clone(DEFAULT_SITE_CONTENT);
      const state = readLocalState();
      state.siteContent = normalized;
      writeLocalState(state);
      return normalized;
    },
    async () => readLocalState().siteContent
  );
}

export async function saveSiteContent(content, options = {}) {
  const actorEmail = await getCurrentActorEmail();
  const section = sanitizePlainText(options.section || "");
  const normalized = normalizeSiteContent(content);
  const state = readLocalState();
  const previousSiteContent = normalizeSiteContent(state.siteContent);
  const previousPayload = section
    ? extractSiteContentSectionPayload(previousSiteContent, section)
    : clone(previousSiteContent);
  const nextPayload = section
    ? extractSiteContentSectionPayload(normalized, section)
    : clone(normalized);
  const hasChanged = !areJsonValuesEqual(previousPayload, nextPayload);
  state.siteContent = normalized;
  writeLocalState(state);

  if (isSupabaseReady()) {
    try {
      await upsertPayloadRow("site_content", "main", normalized);
    } catch (error) {
      console.warn("Saving site content remotely failed; cached local state was kept.", error);
    }
  }

  if (hasChanged && !options.skipVersionSnapshot) {
    await insertContentVersion({
      id: cryptoRandomId("version"),
      section: section || "site-content",
      entityType: "site_content",
      entityId: "main",
      snapshotType: "auto",
      label: sanitizePlainText(options.versionLabel || ""),
      summary: sanitizePlainText(options.versionSummary || `Restore point before updating ${humanizeSection(section)}`),
      payload: previousPayload,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    });
  }

  if (hasChanged && !options.skipAudit) {
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: "update",
      entityType: "site_content",
      entityId: "main",
      section: section || "site-content",
      summary: sanitizePlainText(options.summary || `Updated ${humanizeSection(section)}`),
      details: typeof options.details === "object" && options.details ? clone(options.details) : {},
      createdAt: new Date().toISOString()
    });
  }

  return normalized;
}

export async function loadProjects() {
  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client.from("projects").select("id, payload");
      if (error) {
        throw new Error(error.message || "Unable to load projects.");
      }

      const items = (data || []).map((row) => mapPayloadRow(row, normalizeProject)).filter(Boolean);
      const normalized = sortProjects(items.length ? items : DEFAULT_PROJECTS.map(normalizeProject));
      const state = readLocalState();
      state.projects = normalized;
      writeLocalState(state);
      return normalized;
    },
    async () => sortProjects(readLocalState().projects)
  );
}

export async function loadProject(id) {
  const safeId = sanitizePlainText(id);
  if (!safeId) {
    return null;
  }

  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client.from("projects").select("id, payload").eq("id", safeId).maybeSingle();
      if (error && error.code !== "PGRST116") {
        throw new Error(error.message || "Unable to load the project.");
      }
      return data ? mapPayloadRow(data, normalizeProject) : null;
    },
    async () => readLocalState().projects.find((item) => item.id === safeId) || null
  );
}

export async function saveProject(project, options = {}) {
  const actorEmail = await getCurrentActorEmail();
  const normalized = normalizeProject(project);
  const state = readLocalState();
  const existing = state.projects.find((item) => item.id === normalized.id) || null;
  const hasChanged = !existing || !areJsonValuesEqual(existing, normalized);
  const nextProjects = state.projects.filter((item) => item.id !== normalized.id);
  nextProjects.push(normalized);
  state.projects = sortProjects(nextProjects);
  writeLocalState(state);

  let remoteSaved = false;
  if (isSupabaseReady()) {
    try {
      await upsertPayloadRow("projects", normalized.id, normalized);
      remoteSaved = true;
    } catch (error) {
      if (options.requireRemote) {
        throw error instanceof Error ? error : new Error(String(error || "Remote save failed."));
      }
      console.warn("Saving the project remotely failed; cached local state was kept.", error);
    }
  }

  if (existing && hasChanged && !options.skipVersionSnapshot) {
    await insertContentVersion({
      id: cryptoRandomId("version"),
      section: "projects",
      entityType: "project",
      entityId: normalized.id,
      snapshotType: "auto",
      label: sanitizePlainText(options.versionLabel || ""),
      summary: sanitizePlainText(options.versionSummary || `Restore point before updating ${existing.title}`),
      payload: existing,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    });
  }

  if (hasChanged && !options.skipAudit) {
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: existing ? "update" : "create",
      entityType: "project",
      entityId: normalized.id,
      section: "projects",
      summary: sanitizePlainText(options.summary || `${existing ? "Updated" : "Created"} project ${normalized.title}`),
      details: {
        title: normalized.title,
        featured: normalized.featured,
        imageUrl: normalized.featuredImage || normalized.image || ""
      },
      createdAt: new Date().toISOString()
    });
  }

  if (options.returnMeta) {
    return { project: normalized, remoteSaved };
  }
  return normalized;
}

export async function deleteProject(projectId) {
  const safeId = sanitizePlainText(projectId);
  const state = readLocalState();
  const existing = state.projects.find((item) => item.id === safeId) || null;
  const actorEmail = await getCurrentActorEmail();
  state.projects = state.projects.filter((item) => item.id !== safeId);
  writeLocalState(state);

  if (isSupabaseReady()) {
    try {
      await deletePayloadRow("projects", safeId);
    } catch (error) {
      console.warn("Deleting the project remotely failed; cached local state was kept.", error);
    }
  }

  if (existing) {
    await insertContentVersion({
      id: cryptoRandomId("version"),
      section: "projects",
      entityType: "project",
      entityId: safeId,
      snapshotType: "auto",
      label: "",
      summary: `Restore point before deleting ${existing.title}`,
      payload: existing,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    });
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: "delete",
      entityType: "project",
      entityId: safeId,
      section: "projects",
      summary: `Deleted project ${existing.title}`,
      details: { title: existing.title },
      createdAt: new Date().toISOString()
    });
  }
}

export async function loadTestimonials() {
  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client.from("testimonials").select("id, payload");
      if (error) {
        throw new Error(error.message || "Unable to load testimonials.");
      }

      const items = (data || []).map((row) => mapPayloadRow(row, normalizeTestimonial)).filter(Boolean);
      const normalized = items.length ? items : DEFAULT_TESTIMONIALS.map(normalizeTestimonial);
      const state = readLocalState();
      state.testimonials = normalized;
      writeLocalState(state);
      return normalized;
    },
    async () => readLocalState().testimonials
  );
}

export async function saveTestimonial(item, options = {}) {
  const actorEmail = await getCurrentActorEmail();
  const normalized = normalizeTestimonial(item);
  const state = readLocalState();
  const existing = state.testimonials.find((entry) => entry.id === normalized.id) || null;
  const hasChanged = !existing || !areJsonValuesEqual(existing, normalized);
  const nextItems = state.testimonials.filter((entry) => entry.id !== normalized.id);
  nextItems.push(normalized);
  state.testimonials = nextItems;
  writeLocalState(state);

  if (isSupabaseReady()) {
    try {
      await upsertPayloadRow("testimonials", normalized.id, normalized);
    } catch (error) {
      console.warn("Saving the testimonial remotely failed; cached local state was kept.", error);
    }
  }

  if (existing && hasChanged && !options.skipVersionSnapshot) {
    await insertContentVersion({
      id: cryptoRandomId("version"),
      section: "testimonials",
      entityType: "testimonial",
      entityId: normalized.id,
      snapshotType: "auto",
      label: sanitizePlainText(options.versionLabel || ""),
      summary: sanitizePlainText(options.versionSummary || `Restore point before updating ${existing.name}`),
      payload: existing,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    });
  }

  if (hasChanged && !options.skipAudit) {
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: existing ? "update" : "create",
      entityType: "testimonial",
      entityId: normalized.id,
      section: "testimonials",
      summary: sanitizePlainText(options.summary || `${existing ? "Updated" : "Created"} testimonial ${normalized.name}`),
      details: { name: normalized.name, published: normalized.published },
      createdAt: new Date().toISOString()
    });
  }

  return normalized;
}

export async function deleteTestimonial(testimonialId) {
  const safeId = sanitizePlainText(testimonialId);
  const state = readLocalState();
  const existing = state.testimonials.find((entry) => entry.id === safeId) || null;
  const actorEmail = await getCurrentActorEmail();
  state.testimonials = state.testimonials.filter((entry) => entry.id !== safeId);
  writeLocalState(state);

  if (isSupabaseReady()) {
    try {
      await deletePayloadRow("testimonials", safeId);
    } catch (error) {
      console.warn("Deleting the testimonial remotely failed; cached local state was kept.", error);
    }
  }

  if (existing) {
    await insertContentVersion({
      id: cryptoRandomId("version"),
      section: "testimonials",
      entityType: "testimonial",
      entityId: safeId,
      snapshotType: "auto",
      label: "",
      summary: `Restore point before deleting ${existing.name}`,
      payload: existing,
      createdBy: actorEmail,
      createdAt: new Date().toISOString()
    });
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: "delete",
      entityType: "testimonial",
      entityId: safeId,
      section: "testimonials",
      summary: `Deleted testimonial ${existing.name}`,
      details: { name: existing.name },
      createdAt: new Date().toISOString()
    });
  }
}

export async function loadMessages() {
  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client.from("messages").select("id, payload, created_at").order("created_at", { ascending: false });
      if (error) {
        throw new Error(error.message || "Unable to load messages.");
      }

      const messages = sortMessages((data || []).map(mapMessageRow));
      const state = readLocalState();
      state.messages = messages;
      writeLocalState(state);
      return messages;
    },
    async () => sortMessages(readLocalState().messages)
  );
}

export async function updateMessageStatus(id, status) {
  const safeId = sanitizePlainText(id);
  const safeStatus = ["new", "read", "archived"].includes(status) ? status : "read";
  const state = readLocalState();
  const target = state.messages.find((item) => item.id === safeId);
  state.messages = state.messages.map((item) => (item.id === safeId ? { ...item, status: safeStatus } : item));
  writeLocalState(state);

  if (!isSupabaseReady() || !target) {
    return;
  }

  try {
    const client = getClient();
    const { error } = await client
      .from("messages")
      .update({
        payload: {
          ...target,
          status: safeStatus
        }
      })
      .eq("id", safeId);

    if (error) {
      throw new Error(error.message || "Unable to update the message.");
    }
  } catch (error) {
    console.warn("Updating the message remotely failed; cached local state was kept.", error);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode the selected image."));
    };
    image.src = objectUrl;
  });
}

function fitInside(width, height, maxDimension) {
  const safeWidth = Math.max(1, Math.round(Number(width) || 1));
  const safeHeight = Math.max(1, Math.round(Number(height) || 1));
  const longestSide = Math.max(safeWidth, safeHeight);
  if (!maxDimension || longestSide <= maxDimension) {
    return { width: safeWidth, height: safeHeight };
  }

  const ratio = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(safeWidth * ratio)),
    height: Math.max(1, Math.round(safeHeight * ratio))
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to process the image."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function renderImageVariantBlob(image, width, height, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvasToBlob(canvas, "image/webp", quality);
}

async function processImageVariants(file) {
  const originalType = validateImageFile(file);
  const sourceImage = await loadImageElement(file);
  const width = Math.max(1, Math.round(sourceImage.naturalWidth || sourceImage.width || 1));
  const height = Math.max(1, Math.round(sourceImage.naturalHeight || sourceImage.height || 1));
  const mainSize = fitInside(width, height, MAIN_IMAGE_MAX_DIMENSION);
  const thumbSize = fitInside(width, height, THUMB_IMAGE_MAX_DIMENSION);
  const [mainBlob, thumbBlob] = await Promise.all([
    renderImageVariantBlob(sourceImage, mainSize.width, mainSize.height, MAIN_IMAGE_QUALITY),
    renderImageVariantBlob(sourceImage, thumbSize.width, thumbSize.height, THUMB_IMAGE_QUALITY)
  ]);

  return {
    width,
    height,
    originalType,
    originalExtension: ALLOWED_IMAGE_TYPES.get(originalType) || "img",
    mainBlob,
    thumbBlob
  };
}

async function uploadBinary(path, blob, contentType) {
  const client = getClient();
  const bucket = sanitizePlainText(getRuntimeConfig().storageBucket || "portfolio-assets");
  const { error } = await client.storage.from(bucket).upload(path, blob, {
    upsert: true,
    contentType: contentType || undefined
  });

  if (error) {
    throw new Error(error.message || "Unable to upload the file.");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadImage(baseDir, file, options = {}) {
  if (!file) {
    return null;
  }

  const safeBaseDir = String(baseDir || "").replace(/^\/+|\/+$/g, "");
  if (!safeBaseDir) {
    throw new Error("Upload path is missing.");
  }

  const actorEmail = await getCurrentActorEmail();
  const baseName = sanitizeUploadBaseName(file?.name, options.fallbackBase || "image");
  const stamp = Date.now();
  const processed = await processImageVariants(file);
  const mainPath = `${safeBaseDir}/${stamp}-${baseName}.webp`;
  const thumbPath = `${safeBaseDir}/${stamp}-${baseName}-thumb.webp`;
  const originalPath = `${safeBaseDir}/${stamp}-${baseName}-orig.${processed.originalExtension}`;
  let asset;

  if (!isSupabaseReady()) {
    asset = normalizeImageAsset({
      url: await fileToDataUrl(processed.mainBlob),
      thumbnailUrl: await fileToDataUrl(processed.thumbBlob),
      originalUrl: await fileToDataUrl(file),
      width: processed.width,
      height: processed.height,
      contentType: "image/webp"
    });
  } else {
    const [url, thumbnailUrl, originalUrl] = await Promise.all([
      uploadBinary(mainPath, processed.mainBlob, "image/webp"),
      uploadBinary(thumbPath, processed.thumbBlob, "image/webp"),
      uploadBinary(originalPath, file, file.type || undefined)
    ]);

    asset = normalizeImageAsset({
      url,
      thumbnailUrl,
      originalUrl,
      width: processed.width,
      height: processed.height,
      contentType: "image/webp"
    });
  }

  await insertAuditLog({
    id: cryptoRandomId("audit"),
    actorEmail,
    action: "upload",
    entityType: sanitizePlainText(options.entityType || "asset"),
    entityId: sanitizePlainText(options.entityId || safeBaseDir),
    section: sanitizePlainText(options.section || ""),
    summary: sanitizePlainText(options.summary || `Uploaded ${sanitizePlainText(options.label || "image")}`),
    details: {
      url: asset?.url || "",
      thumbnailUrl: asset?.thumbnailUrl || "",
      originalUrl: asset?.originalUrl || "",
      width: asset?.width || 0,
      height: asset?.height || 0
    },
    createdAt: new Date().toISOString()
  });

  return asset;
}

export async function uploadProfileImage(file, options = {}) {
  return uploadImage("profile", file, {
    fallbackBase: "profile-image",
    entityType: "site_content",
    entityId: "main",
    section: options.section || "profile",
    label: "profile image",
    summary: options.summary || "Uploaded profile image"
  });
}

export async function uploadProjectImage(projectId, file, options = {}) {
  const safeId = sanitizePlainText(projectId || cryptoRandomId("project"));
  return uploadImage(`projects/${safeId}`, file, {
    fallbackBase: "project-image",
    entityType: "project",
    entityId: safeId,
    section: options.section || "projects",
    label: "project image",
    summary: options.summary || "Uploaded project image"
  });
}

export async function uploadTestimonialImage(testimonialId, file, options = {}) {
  const safeId = sanitizePlainText(testimonialId || cryptoRandomId("testimonial"));
  return uploadImage(`testimonials/${safeId}`, file, {
    fallbackBase: "testimonial-image",
    entityType: "testimonial",
    entityId: safeId,
    section: options.section || "testimonials",
    label: "testimonial image",
    summary: options.summary || "Uploaded testimonial image"
  });
}

export async function loadAuditLog(limit = 40) {
  const safeLimit = Number(limit) > 0 ? Math.min(Number(limit), 200) : 40;
  return withRemote(
    async () => {
      const client = getClient();
      const { data, error } = await client
        .from("admin_audit_log")
        .select("id, actor_email, action, entity_type, entity_id, section, summary, details, created_at")
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (error) {
        throw new Error(error.message || "Unable to load the audit log.");
      }

      const entries = sortAuditLog((data || []).map(mapAuditRow));
      const state = readLocalState();
      state.auditLog = entries;
      writeLocalState(state);
      return entries;
    },
    async () => sortAuditLog(readLocalState().auditLog).slice(0, safeLimit)
  );
}

export async function loadContentVersions(filters = {}) {
  const safeFilters = {
    section: sanitizePlainText(filters.section || ""),
    entityType: sanitizePlainText(filters.entityType || ""),
    entityId: sanitizePlainText(filters.entityId || ""),
    snapshotType: sanitizePlainText(filters.snapshotType || ""),
    limit: Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 200) : 0
  };

  return withRemote(
    async () => {
      const client = getClient();
      let query = client
        .from("content_versions")
        .select("id, section, entity_type, entity_id, snapshot_type, label, summary, payload, created_by, created_at")
        .order("created_at", { ascending: false });

      if (safeFilters.section) query = query.eq("section", safeFilters.section);
      if (safeFilters.entityType) query = query.eq("entity_type", safeFilters.entityType);
      if (safeFilters.entityId) query = query.eq("entity_id", safeFilters.entityId);
      if (safeFilters.snapshotType) query = query.eq("snapshot_type", safeFilters.snapshotType);
      if (safeFilters.limit) query = query.limit(safeFilters.limit);

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message || "Unable to load content versions.");
      }

      const entries = sortContentVersions((data || []).map(mapVersionRow));
      if (!safeFilters.section && !safeFilters.entityType && !safeFilters.entityId && !safeFilters.snapshotType) {
        const state = readLocalState();
        state.contentVersions = entries;
        writeLocalState(state);
      }

      return entries;
    },
    async () => filterContentVersions(readLocalState().contentVersions, safeFilters)
  );
}

export async function createVersionSnapshot(input) {
  const actorEmail = await getCurrentActorEmail();
  const version = await insertContentVersion({
    id: cryptoRandomId("version"),
    section: sanitizePlainText(input?.section || ""),
    entityType: sanitizePlainText(input?.entityType || "site_content"),
    entityId: sanitizePlainText(input?.entityId || "main"),
    snapshotType: ["auto", "draft", "restore"].includes(input?.snapshotType) ? input.snapshotType : "draft",
    label: sanitizePlainText(input?.label || ""),
    summary: sanitizePlainText(input?.summary || ""),
    payload: typeof input?.payload === "object" && input.payload ? clone(input.payload) : {},
    createdBy: actorEmail,
    createdAt: new Date().toISOString()
  });

  if (!input?.skipAudit) {
    await insertAuditLog({
      id: cryptoRandomId("audit"),
      actorEmail,
      action: "snapshot",
      entityType: version.entityType,
      entityId: version.entityId,
      section: version.section,
      summary: sanitizePlainText(
        input?.auditSummary || `Saved ${version.snapshotType} snapshot for ${humanizeSection(version.section || version.entityType)}`
      ),
      details: { snapshotType: version.snapshotType, label: version.label },
      createdAt: new Date().toISOString()
    });
  }

  return version;
}

async function loadVersionRecord(versionId) {
  const safeId = sanitizePlainText(versionId || "");
  if (!safeId) {
    throw new Error("Version ID is required.");
  }

  const localVersion = normalizeArray(readLocalState().contentVersions).find((entry) => entry.id === safeId);
  if (localVersion) {
    return normalizeVersionRecord(localVersion);
  }

  if (!isSupabaseReady()) {
    throw new Error("Version not found.");
  }

  const client = getClient();
  const { data, error } = await client
    .from("content_versions")
    .select("id, section, entity_type, entity_id, snapshot_type, label, summary, payload, created_by, created_at")
    .eq("id", safeId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message || "Unable to load the version.");
  }

  if (!data) {
    throw new Error("Version not found.");
  }

  return mapVersionRow(data);
}

export async function restoreContentVersion(versionId) {
  const actorEmail = await getCurrentActorEmail();
  const version = await loadVersionRecord(versionId);
  const restoreSummaryBase = humanizeSection(version.section || version.entityType);
  let restoredPayload = null;

  if (version.entityType === "site_content") {
    const current = await loadSiteContent();
    const next = applySiteContentSectionPayload(current, version.section, version.payload);
    await saveSiteContent(next, {
      section: version.section,
      summary: `Restored ${restoreSummaryBase}`,
      versionSummary: `Restore point before restoring ${restoreSummaryBase}`
    });
    restoredPayload = extractSiteContentSectionPayload(next, version.section);
  } else if (version.entityType === "project") {
    const restoredProject = await saveProject(version.payload, {
      summary: `Restored project ${sanitizePlainText(version.payload?.title || version.entityId)}`,
      versionSummary: `Restore point before restoring ${sanitizePlainText(version.payload?.title || version.entityId)}`
    });
    restoredPayload = restoredProject;
  } else if (version.entityType === "testimonial") {
    const restoredTestimonial = await saveTestimonial(version.payload, {
      summary: `Restored testimonial ${sanitizePlainText(version.payload?.name || version.entityId)}`,
      versionSummary: `Restore point before restoring ${sanitizePlainText(version.payload?.name || version.entityId)}`
    });
    restoredPayload = restoredTestimonial;
  } else {
    throw new Error("This version type cannot be restored automatically.");
  }

  await createVersionSnapshot({
    section: version.section,
    entityType: version.entityType,
    entityId: version.entityId,
    snapshotType: "restore",
    label: version.label,
    summary: `Restored ${restoreSummaryBase}`,
    payload: restoredPayload,
    skipAudit: true
  });

  await insertAuditLog({
    id: cryptoRandomId("audit"),
    actorEmail,
    action: "restore",
    entityType: version.entityType,
    entityId: version.entityId,
    section: version.section,
    summary: `Restored ${restoreSummaryBase} from version history`,
    details: { versionId: version.id, snapshotType: version.snapshotType, label: version.label },
    createdAt: new Date().toISOString()
  });

  return version;
}

/* ── GitHub Contributions ─────────────────────────────────────── */
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export async function loadGitHubContributions(username) {
  const safeUsername = String(username || "").trim();
  if (!safeUsername || !GITHUB_USERNAME_RE.test(safeUsername)) {
    throw new Error("Invalid GitHub username.");
  }

  const runtime = getRuntimeConfig();
  const supabaseUrl = sanitizePlainText(runtime?.supabase?.url || "");
  const anonKey = sanitizePlainText(runtime?.supabase?.anonKey || "");
  if (!supabaseUrl) {
    throw new Error("Supabase runtime config is missing.");
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/github-activity?username=${encodeURIComponent(safeUsername)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    headers: anonKey
      ? { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: "application/json" }
      : { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = String(await response.text()).trim();
    if (text) {
      let message = text;
      try {
        const parsed = JSON.parse(text);
        message = parsed?.error || parsed?.message || text;
      } catch (_) {/* keep raw text */}
      throw new Error(message);
    }
    throw new Error(`GitHub activity request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const markup = String(data?.markup || "").trim();
  if (!markup) {
    throw new Error("GitHub activity markup was empty.");
  }

  return markup;
}

export async function pingSearchConsoleSitemap(input) {
  if (!isSupabaseReady()) {
    throw new Error("Supabase is not configured.");
  }

  const client = getClient();
  const { data, error } = await client.functions.invoke("admin-search-console", {
    body: {
      action: "pingSitemap",
      siteUrl: sanitizeUrl(input?.siteUrl || ""),
      sitemapUrl: sanitizeUrl(input?.sitemapUrl || "")
    }
  });

  if (error) {
    throw new Error(await parseFunctionError(error, "Unable to ping the sitemap."));
  }

  return {
    checkedAt: sanitizePlainText(data?.checkedAt || ""),
    submitted: Boolean(data?.submitted),
    reachable: Boolean(data?.reachable),
    sitemapUrl: sanitizeUrl(data?.sitemapUrl || ""),
    status: sanitizePlainText(data?.status || ""),
    message: sanitizePlainText(data?.message || "")
  };
}

export async function loadAdminUsers() {
  if (!isSupabaseReady()) {
    throw new Error("Supabase is not configured.");
  }

  const client = getClient();
  const { data, error } = await client
    .from("admin_users")
    .select("email, role, invited_by, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load admin users.");
  }

  return (data || []).map(normalizeAdminUser).filter((entry) => entry.email);
}

export async function inviteAdminUser(input) {
  if (!isSupabaseReady()) {
    throw new Error("Supabase is not configured.");
  }

  const actorEmail = await getCurrentActorEmail();
  const email = sanitizePlainText(input?.email || "").toLowerCase();
  const role = ["viewer", "editor", "admin"].includes(input?.role) ? input.role : "editor";

  if (!email) {
    throw new Error("Email is required.");
  }

  const client = getClient();
  const { data, error } = await client.functions.invoke("admin-invite", {
    body: { email, role }
  });

  if (error) {
    throw new Error(await parseFunctionError(error, "Unable to invite the admin user."));
  }

  await insertAuditLog({
    id: cryptoRandomId("audit"),
    actorEmail,
    action: "access-grant",
    entityType: "admin_user",
    entityId: email,
    section: "settings",
    summary: `Updated admin access for ${email}`,
    details: { email, role, existingUser: Boolean(data?.existingUser) },
    createdAt: new Date().toISOString()
  });

  return {
    invited: Boolean(data?.invited),
    email,
    role,
    existingUser: Boolean(data?.existingUser),
    createdAt: sanitizePlainText(data?.createdAt || ""),
    invitedBy: sanitizePlainText(data?.invitedBy || "")
  };
}

export async function removeAdminUser(email) {
  if (!isSupabaseReady()) {
    throw new Error("Supabase is not configured.");
  }

  const actorEmail = await getCurrentActorEmail();
  const safeEmail = sanitizePlainText(email || "").toLowerCase();
  if (!safeEmail) {
    throw new Error("Email is required.");
  }

  const client = getClient();
  const { error } = await client.from("admin_users").delete().eq("email", safeEmail);
  if (error) {
    throw new Error(error.message || "Unable to remove the admin user.");
  }

  await insertAuditLog({
    id: cryptoRandomId("audit"),
    actorEmail,
    action: "access-revoke",
    entityType: "admin_user",
    entityId: safeEmail,
    section: "settings",
    summary: `Removed admin access for ${safeEmail}`,
    details: { email: safeEmail },
    createdAt: new Date().toISOString()
  });
}

export async function generateAdminAiText(input) {
  if (!isSupabaseReady()) {
    throw new Error("Supabase is not configured.");
  }

  const variantCount = Math.min(3, Math.max(1, Number(input?.variantCount) || 1));
  const relatedFields = Array.isArray(input?.relatedFields)
    ? input.relatedFields
      .map((entry) => ({
        label: sanitizePlainText(entry?.label || ""),
        value: sanitizePlainText(entry?.value || "")
      }))
      .filter((entry) => entry.label && entry.value)
      .slice(0, 20)
    : [];
  const blockedPhrases = normalizeAiWriterList(input?.blockedPhrases);
  const bannedClaims = normalizeAiWriterList(input?.bannedClaims);

  const payload = {
    task: sanitizePlainText(input?.task || "generate").toLowerCase(),
    prompt: sanitizePlainText(input?.prompt || ""),
    currentText: sanitizePlainText(input?.currentText || ""),
    fieldContext: sanitizePlainText(input?.fieldContext || ""),
    fieldLabel: sanitizePlainText(input?.fieldLabel || ""),
    sectionContext: sanitizePlainText(input?.sectionContext || ""),
    fieldType: sanitizePlainText(input?.fieldType || ""),
    contextNotes: sanitizePlainText(input?.contextNotes || ""),
    relatedFields,
    tone: sanitizePlainText(input?.tone || "professional").toLowerCase(),
    length: sanitizePlainText(input?.length || "medium").toLowerCase(),
    variantCount,
    brandVoiceProfile: sanitizePlainText(input?.brandVoiceProfile || ""),
    blockedPhrases,
    bannedClaims
  };

  if (!payload.prompt && !payload.currentText) {
    throw new Error("A prompt or current text is required.");
  }

  const client = getClient();
  const { data, error } = await client.functions.invoke("admin-ai", {
    body: payload
  });

  if (error) {
    throw new Error(await parseFunctionError(error, "Unable to generate AI copy."));
  }

  const variants = Array.isArray(data?.variants)
    ? data.variants
      .map((entry) => sanitizePlainText(entry))
      .filter(Boolean)
      .slice(0, variantCount)
    : [];
  const text = String(data?.text || variants[0] || "").trim();
  if (!text) {
    throw new Error("The AI response was empty.");
  }

  return {
    text,
    variants: variants.length ? variants : [text],
    provider: sanitizePlainText(data?.provider || "google-gemini"),
    model: sanitizePlainText(data?.model || "")
  };
}

export async function submitContactMessage(input) {
  const siteContent = await loadSiteContent();
  const payload = normalizeMessage({
    id: cryptoRandomId("message"),
    name: input?.name,
    email: input?.email,
    subject: input?.subject,
    message: input?.message,
    createdAt: new Date().toISOString(),
    status: "new",
    deliveredTo: siteContent.settings.contactRecipientEmail || siteContent.profile.email
  });

  const honeypot = sanitizePlainText(input?.website || "");
  if (honeypot) {
    throw new Error("Spam validation failed.");
  }

  if (!payload.name || !payload.email || !payload.message) {
    throw new Error("Name, email, and message are required.");
  }

  if (payload.message.length > 3000) {
    throw new Error("Message is too long.");
  }

  if (!isSupabaseReady()) {
    const state = readLocalState();
    state.messages.unshift(payload);
    writeLocalState(state);
    return { mode: "fallback", deliveredTo: payload.deliveredTo };
  }

  const client = getClient();
  const { data, error } = await client.functions.invoke("submit-contact", {
    body: {
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      website: honeypot,
      turnstileToken: sanitizePlainText(input?.turnstileToken || "")
    }
  });

  if (error) {
    throw new Error(error.message || "Unable to send the message.");
  }

  return data || { mode: "supabase", deliveredTo: payload.deliveredTo };
}

export function exportStateSnapshot() {
  return clone(readLocalState());
}

export async function importStateSnapshot(payload) {
  const state = writeLocalState({
    siteContent: payload?.siteContent || DEFAULT_SITE_CONTENT,
    projects: normalizeArray(payload?.projects).map(normalizeProject),
    testimonials: normalizeArray(payload?.testimonials).map(normalizeTestimonial),
    messages: normalizeArray(payload?.messages).map(normalizeMessage),
    auditLog: normalizeArray(payload?.auditLog || DEFAULT_AUDIT_LOG).map(normalizeAuditEntry),
    contentVersions: normalizeArray(payload?.contentVersions || DEFAULT_CONTENT_VERSIONS).map(normalizeVersionRecord)
  });

  if (!isSupabaseReady()) {
    return state;
  }

  await saveSiteContent(state.siteContent, { skipAudit: true, skipVersionSnapshot: true });
  await Promise.all(state.projects.map((item) => saveProject(item, { skipAudit: true, skipVersionSnapshot: true })));
  await Promise.all(state.testimonials.map((item) => saveTestimonial(item, { skipAudit: true, skipVersionSnapshot: true })));
  return state;
}

export async function seedRemoteContent() {
  const defaults = getDefaultState();
  writeLocalState(defaults);

  if (!isSupabaseReady()) {
    return defaults;
  }

  await saveSiteContent(defaults.siteContent, { skipAudit: true, skipVersionSnapshot: true });
  await Promise.all(defaults.projects.map((project) => saveProject(project, { skipAudit: true, skipVersionSnapshot: true })));
  await Promise.all(defaults.testimonials.map((item) => saveTestimonial(item, { skipAudit: true, skipVersionSnapshot: true })));
  return defaults;
}
