import {
  AVAILABLE_TECH_STACKS,
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

let localStateCache = null;

function clone(value) {
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
      messages: normalizeArray(parsed.messages).map(normalizeMessage)
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
    messages: normalizeArray(nextState.messages).map(normalizeMessage)
  };
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(localStateCache));
  return clone(localStateCache);
}

function normalizeSiteContent(siteContent) {
  const base = clone(DEFAULT_SITE_CONTENT);
  const source = siteContent || {};
  return {
    ...base,
    ...source,
    profile: {
      ...base.profile,
      ...(source.profile || {})
    },
    skills: {
      technical: normalizeArray(source.skills?.technical || base.skills.technical).map((item, index) =>
        normalizeTechnicalSkill(item, index)
      ),
      soft: normalizeArray(source.skills?.soft || base.skills.soft).map((item, index) => normalizeSoftSkill(item, index))
    },
    experience: normalizeArray(source.experience || base.experience).map((item, index) => normalizeExperience(item, index)),
    education: normalizeArray(source.education || base.education).map((item, index) => normalizeEducation(item, index)),
    techStacks: normalizeArray(source.techStacks || base.techStacks).filter(Boolean),
    settings: {
      ...base.settings,
      ...(source.settings || {})
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

function normalizeProject(project) {
  return {
    id: sanitizePlainText(project?.id || cryptoRandomId("project")),
    title: sanitizePlainText(project?.title || "Untitled Project"),
    shortDesc: sanitizePlainText(project?.shortDesc || ""),
    longDesc: sanitizeRichHtml(project?.longDesc || ""),
    tags: normalizeArray(project?.tags).map((tag) => sanitizePlainText(tag)).filter(Boolean),
    url: sanitizeUrl(project?.url || ""),
    github: sanitizeUrl(project?.github || ""),
    image: sanitizeImageUrl(project?.image || ""),
    featured: Boolean(project?.featured),
    gradient: sanitizePlainText(project?.gradient || "linear-gradient(135deg, #1a1a2e, #16213e)")
  };
}

function normalizeTestimonial(item) {
  return {
    id: sanitizePlainText(item?.id || cryptoRandomId("testimonial")),
    name: sanitizePlainText(item?.name || "Client"),
    role: sanitizePlainText(item?.role || ""),
    content: sanitizePlainText(item?.content || ""),
    image: sanitizeImageUrl(item?.image || ""),
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

function cryptoRandomId(prefix) {
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${seed}`;
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

export async function saveSiteContent(content) {
  const normalized = normalizeSiteContent(content);
  const state = readLocalState();
  state.siteContent = normalized;
  writeLocalState(state);

  if (!isSupabaseReady()) {
    return normalized;
  }

  try {
    await upsertPayloadRow("site_content", "main", normalized);
  } catch (error) {
    console.warn("Saving site content remotely failed; cached local state was kept.", error);
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

export async function saveProject(project) {
  const normalized = normalizeProject(project);
  const state = readLocalState();
  const nextProjects = state.projects.filter((item) => item.id !== normalized.id);
  nextProjects.push(normalized);
  state.projects = sortProjects(nextProjects);
  writeLocalState(state);

  if (!isSupabaseReady()) {
    return normalized;
  }

  try {
    await upsertPayloadRow("projects", normalized.id, normalized);
  } catch (error) {
    console.warn("Saving the project remotely failed; cached local state was kept.", error);
  }

  return normalized;
}

export async function deleteProject(projectId) {
  const safeId = sanitizePlainText(projectId);
  const state = readLocalState();
  state.projects = state.projects.filter((item) => item.id !== safeId);
  writeLocalState(state);

  if (!isSupabaseReady()) {
    return;
  }

  try {
    await deletePayloadRow("projects", safeId);
  } catch (error) {
    console.warn("Deleting the project remotely failed; cached local state was kept.", error);
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

export async function saveTestimonial(item) {
  const normalized = normalizeTestimonial(item);
  const state = readLocalState();
  const nextItems = state.testimonials.filter((entry) => entry.id !== normalized.id);
  nextItems.push(normalized);
  state.testimonials = nextItems;
  writeLocalState(state);

  if (!isSupabaseReady()) {
    return normalized;
  }

  try {
    await upsertPayloadRow("testimonials", normalized.id, normalized);
  } catch (error) {
    console.warn("Saving the testimonial remotely failed; cached local state was kept.", error);
  }

  return normalized;
}

export async function deleteTestimonial(testimonialId) {
  const safeId = sanitizePlainText(testimonialId);
  const state = readLocalState();
  state.testimonials = state.testimonials.filter((entry) => entry.id !== safeId);
  writeLocalState(state);

  if (!isSupabaseReady()) {
    return;
  }

  try {
    await deletePayloadRow("testimonials", safeId);
  } catch (error) {
    console.warn("Deleting the testimonial remotely failed; cached local state was kept.", error);
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

async function uploadImage(path, file) {
  if (!file) {
    return "";
  }

  if (!isSupabaseReady()) {
    return fileToDataUrl(file);
  }

  const client = getClient();
  const bucket = sanitizePlainText(getRuntimeConfig().storageBucket || "portfolio-assets");
  const { error } = await client.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined
  });

  if (error) {
    throw new Error(error.message || "Unable to upload the file.");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfileImage(file) {
  const fileName = sanitizePlainText(file?.name || "profile-image").replace(/\s+/g, "-").toLowerCase();
  return uploadImage(`profile/${Date.now()}-${fileName}`, file);
}

export async function uploadProjectImage(projectId, file) {
  const fileName = sanitizePlainText(file?.name || "project-image").replace(/\s+/g, "-").toLowerCase();
  const safeId = sanitizePlainText(projectId || cryptoRandomId("project"));
  return uploadImage(`projects/${safeId}/${Date.now()}-${fileName}`, file);
}

export async function uploadTestimonialImage(testimonialId, file) {
  const fileName = sanitizePlainText(file?.name || "testimonial-image").replace(/\s+/g, "-").toLowerCase();
  const safeId = sanitizePlainText(testimonialId || cryptoRandomId("testimonial"));
  return uploadImage(`testimonials/${safeId}/${Date.now()}-${fileName}`, file);
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
      website: honeypot
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
    messages: normalizeArray(payload?.messages).map(normalizeMessage)
  });

  if (!isSupabaseReady()) {
    return state;
  }

  await saveSiteContent(state.siteContent);
  await Promise.all(state.projects.map((item) => saveProject(item)));
  await Promise.all(state.testimonials.map((item) => saveTestimonial(item)));
  return state;
}

export async function seedRemoteContent() {
  const defaults = getDefaultState();
  writeLocalState(defaults);

  if (!isSupabaseReady()) {
    return defaults;
  }

  await saveSiteContent(defaults.siteContent);
  await Promise.all(defaults.projects.map((project) => saveProject(project)));
  await Promise.all(defaults.testimonials.map((item) => saveTestimonial(item)));
  return defaults;
}
