import {
  CMS_COLLECTIONS,
  getOrderedCollection,
  getSiteSettings,
  isFirebaseConfigured,
  saveAppointmentRequest,
} from "./firebase-client.js";

const fallbackNotice = "Firebase is not configured yet. Your form is working locally, but requests will not be saved until Firebase config is added.";
const CURRENT_CONTENT_VERSION = "dr-asif-mushtaq-2026-06";
const LEGACY_CONTENT_PATTERN = /Creating Healthy & Confident Smiles|asifmushtaq@gmail\.com|\+92 300 9844763|facebook\.com|linkedin\.com/i;
window.__siteCmsLoaded = true;

document.addEventListener("DOMContentLoaded", () => {
  loadPublicCms();
  bindAppointmentForm();
});

export async function loadPublicCms() {
  const root = document.querySelector("[data-cms-root]");
  if (!root || !isFirebaseConfigured()) return;

  try {
    const [settings, services, gallery, testimonials, publications, socialLinks, faqs, cvHighlights] = await Promise.all([
      getSiteSettings(),
      getOrderedCollection(CMS_COLLECTIONS.services),
      getOrderedCollection(CMS_COLLECTIONS.gallery),
      getOrderedCollection(CMS_COLLECTIONS.testimonials),
      getOrderedCollection(CMS_COLLECTIONS.publications),
      getOrderedCollection(CMS_COLLECTIONS.socialLinks),
      getOrderedCollection(CMS_COLLECTIONS.faqs),
      getOrderedCollection(CMS_COLLECTIONS.cvHighlights),
    ]);

    if (!isCurrentCmsContent(settings)) {
      console.info("Ignoring older Firebase CMS content. Use the admin Seed Starter Content button to publish the current Dr Asif defaults.");
      return;
    }

    if (settings) applySettings(settings);
    renderServices(services.filter(isActive));
    renderGallery(gallery.filter(isActive));
    renderTestimonials(testimonials.filter(isActive));
    renderPublications(publications.filter(isActive));
    renderSocialLinks(socialLinks);
    renderFaqs(faqs.filter(isActive));
    renderCvHighlights(cvHighlights.filter(isActive));
    window.DentalSite?.refreshCmsInteractions();
  } catch (error) {
    console.warn("Could not load Firebase CMS content.", error);
  }
}

function isCurrentCmsContent(settings) {
  if (!settings) return true;
  if (settings.contentVersion === CURRENT_CONTENT_VERSION) return true;
  return !LEGACY_CONTENT_PATTERN.test(JSON.stringify(settings));
}

function bindAppointmentForm() {
  const form = document.querySelector("[data-appointment-form]");
  const status = document.querySelector("[data-form-status]");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const name = data.fullName || "there";

    if (!isFirebaseConfigured()) {
      status.textContent = fallbackNotice;
      return;
    }

    status.textContent = "Saving your appointment request...";

    try {
      await withTimeout(saveAppointmentRequest(data), 12000);
      status.textContent = `Thank you, ${name}. Your request has been saved and the clinic will contact you for confirmation.`;
      form.reset();
    } catch (error) {
      status.textContent = "Sorry, the request could not be saved. Please call or WhatsApp the clinic directly.";
      console.error(error);
    }
  });
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Request timed out.")), timeoutMs);
    }),
  ]);
}

function isActive(item) {
  return item.active !== false;
}

function applySettings(settings) {
  document.querySelectorAll("[data-cms-field]").forEach((element) => {
    const value = getNested(settings, element.dataset.cmsField);
    if (value === undefined || value === null || value === "") return;
    element.textContent = value;
  });

  setLink("[data-cms-phone-link]", `tel:${settings.contact?.phone || ""}`);
  setLink("[data-cms-email-link]", `mailto:${settings.contact?.email || ""}`);
  setLink("[data-cms-whatsapp-link]", buildWhatsappUrl(settings.contact?.whatsapp, settings.doctor?.name));
  setLink("[data-cms-map-link]", `https://maps.google.com/?q=${encodeURIComponent(settings.contact?.address || "")}`);

  document.querySelectorAll("[data-cms-social='instagram']").forEach((link) => setHref(link, settings.social?.instagram));
  document.querySelectorAll("[data-cms-social='tiktok']").forEach((link) => setHref(link, settings.social?.tiktok));
}

const SOCIAL_ICON_RENDERERS = {
  instagram: () => `
    <svg class="social-icon" data-social-icon="instagram" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2" />
      <circle cx="17" cy="7" r="1.25" fill="currentColor" />
    </svg>
  `,
  tiktok: () => `
    <svg class="social-icon" data-social-icon="tiktok" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 4c.4 2.4 1.8 3.9 4.2 4.2v3.1c-1.5-.1-2.9-.6-4.2-1.4v5.3c0 3.2-2.1 5.4-5.2 5.4-2.8 0-5-2-5-4.7 0-2.9 2.3-5 5.3-4.8.3 0 .6.1.9.1v3.2c-.3-.1-.6-.2-.9-.2-1.1 0-1.9.7-1.9 1.7 0 1 .7 1.7 1.7 1.7 1.2 0 1.9-.8 1.9-2.2V4h3.2Z" fill="currentColor" />
    </svg>
  `,
  facebook: () => `
    <svg class="social-icon" data-social-icon="facebook" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 8h2.2V4.4c-.4-.1-1.7-.2-3.1-.2-3.1 0-5.1 1.9-5.1 5.3V12H4.7v4H8v7h4.1v-7h3.4l.5-4h-3.9V9.9c0-1.2.3-1.9 1.9-1.9Z" fill="currentColor" />
    </svg>
  `,
  linkedin: () => `
    <svg class="social-icon" data-social-icon="linkedin" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.4 8.8H2.8V21h3.6V8.8ZM4.6 3C3.4 3 2.5 3.9 2.5 5s.9 2 2.1 2 2.1-.9 2.1-2S5.8 3 4.6 3Zm7.6 5.8H8.8V21h3.6v-6.4c0-1.7.8-2.8 2.3-2.8 1.3 0 1.9.9 1.9 2.7V21h3.6v-7.1c0-3.7-1.9-5.5-4.6-5.5-1.7 0-2.8.9-3.4 1.8V8.8Z" fill="currentColor" />
    </svg>
  `,
  youtube: () => `
    <svg class="social-icon" data-social-icon="youtube" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.5 7.1c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.7.3c-.9.2-1.6.9-1.8 1.8C2.2 8.7 2.2 12 2.2 12s0 3.3.3 4.9c.2.9.9 1.6 1.8 1.8 1.6.3 7.7.3 7.7.3s6.1 0 7.7-.3c.9-.2 1.6-.9 1.8-1.8.3-1.6.3-4.9.3-4.9s0-3.3-.3-4.9ZM10.1 15.1V8.9l5.4 3.1-5.4 3.1Z" fill="currentColor" />
    </svg>
  `,
  website: () => `<i data-lucide="globe-2" class="social-icon" aria-hidden="true"></i>`,
};

function getNested(target, path) {
  return path.split(".").reduce((value, key) => value?.[key], target);
}

function setLink(selector, href) {
  document.querySelectorAll(selector).forEach((link) => setHref(link, href));
}

function setHref(link, href) {
  if (!href) return;
  link.href = href;
}

function buildWhatsappUrl(phone = "", doctorName = "the clinic") {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${doctorName}, I would like a dental consultation.`)}`;
}

function renderServices(items) {
  const container = document.querySelector("[data-cms-section='services']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="service-card">
          <i data-lucide="${escapeAttribute(item.icon || "sparkles")}" aria-hidden="true"></i>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a href="#appointment">Learn More</a>
        </article>
      `
    )
    .join("");
}

function renderGallery(items) {
  const container = document.querySelector("[data-cms-section='gallery']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="case-card" data-category="${escapeAttribute(item.category || "cosmetic-dentistry")}">
          <button
            type="button"
            data-lightbox
            data-image="${escapeAttribute(item.afterImageUrl || item.beforeImageUrl || "")}"
            data-title="${escapeAttribute(item.title || "Gallery case")}"
            aria-label="Open image preview for ${escapeAttribute(item.title || "gallery case")}"
          >
            <span class="comparison">
              <img src="${escapeAttribute(item.beforeImageUrl || item.afterImageUrl || "")}" alt="Before ${escapeAttribute(item.title || "dental treatment")}" />
              <img src="${escapeAttribute(item.afterImageUrl || item.beforeImageUrl || "")}" alt="After ${escapeAttribute(item.title || "dental treatment")}" />
            </span>
          </button>
          <div>
            <span>${escapeHtml(formatCategory(item.category))}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTestimonials(items) {
  const container = document.querySelector("[data-cms-section='testimonials']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="testimonial-card">
          <img src="${escapeAttribute(item.photoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80")}" alt="Patient ${escapeAttribute(item.patientName || "testimonial")}" />
          <div>
            <div class="stars" aria-label="${Number(item.rating || 5)} out of 5 stars">${"★".repeat(Number(item.rating || 5))}</div>
            <p>"${escapeHtml(item.review)}"</p>
            <h3>${escapeHtml(item.patientName)}</h3>
            <span>${escapeHtml(item.role)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPublications(items) {
  const container = document.querySelector("[data-cms-section='publications']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item) => `
        <article class="publication-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a href="${escapeAttribute(item.link || "#")}" target="_blank" rel="noopener">
            <i data-lucide="external-link" aria-hidden="true"></i>
            View publication
          </a>
        </article>
      `
    )
    .join("");
}

function renderSocialLinks(items) {
  const container = document.querySelector("[data-cms-section='social-links']");
  if (!container || !items.length) return;

  const activeItems = items.filter(isActive).filter((item) => item.url);
  container.innerHTML = activeItems
    .map((item) => {
      const iconRenderer = SOCIAL_ICON_RENDERERS[item.icon] || SOCIAL_ICON_RENDERERS.website;
      return `
        <a href="${escapeAttribute(item.url)}" aria-label="${escapeAttribute(item.platform || "Social profile")}" target="_blank" rel="noopener">
          ${iconRenderer()}
        </a>
      `;
    })
    .join("");
}

function renderCvHighlights(items) {
  const container = document.querySelector("[data-cms-section='cv-highlights']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item) => `
        <article>
          <i data-lucide="${escapeAttribute(item.icon || "circle")}" aria-hidden="true"></i>
          <h3>${escapeHtml(item.title)}</h3>
          <ul>
            ${(Array.isArray(item.items) ? item.items : [])
              .map((line) => `<li>${escapeHtml(line)}</li>`)
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderFaqs(items) {
  const container = document.querySelector("[data-cms-section='faqs']");
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item, index) => `
        <div class="faq-item ${index === 0 ? "open" : ""}">
          <button type="button" aria-expanded="${index === 0 ? "true" : "false"}">
            <span>${escapeHtml(item.question)}</span>
            <i data-lucide="chevron-down" aria-hidden="true"></i>
          </button>
          <div class="faq-panel">
            <p>${escapeHtml(item.answer)}</p>
          </div>
        </div>
      `
    )
    .join("");
}

function formatCategory(category = "") {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
