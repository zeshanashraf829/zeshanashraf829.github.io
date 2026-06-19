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
    const [settings, services, gallery, testimonials, publications, faqs] = await Promise.all([
      getSiteSettings(),
      getOrderedCollection(CMS_COLLECTIONS.services),
      getOrderedCollection(CMS_COLLECTIONS.gallery),
      getOrderedCollection(CMS_COLLECTIONS.testimonials),
      getOrderedCollection(CMS_COLLECTIONS.publications),
      getOrderedCollection(CMS_COLLECTIONS.faqs),
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
    renderFaqs(faqs.filter(isActive));
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
