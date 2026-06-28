import {
  CMS_COLLECTIONS,
  deleteDocument,
  getSiteSettings,
  isFirebaseConfigured,
  onAdminAuthStateChanged,
  saveDocument,
  saveSiteSettings,
  signInAdmin,
  signOutAdmin,
  subscribeCollection,
} from "./firebase-client.js";

document.documentElement.classList.remove("no-js");

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => window.lucide?.createIcons());
}

const state = {
  records: {
    appointments: [],
    services: [],
    gallery: [],
    testimonials: [],
    publications: [],
    cvHighlights: [],
    socialLinks: [],
    faqs: [],
  },
  unsubs: [],
};

const CURRENT_CONTENT_VERSION = "dr-asif-mushtaq-2026-06";

const starterContent = {
  settings: {
    contentVersion: CURRENT_CONTENT_VERSION,
    doctor: {
      name: "Dr Asif Mushtaq",
      credentials: "FCPS Prosthodontics, BDS",
    },
    hero: {
      headline: "Advanced Prosthodontic & Implant Rehabilitation",
      description:
        "Licensed Senior Registrar Prosthodontist and Assistant Professor providing comprehensive oral rehabilitation, implant-supported prostheses, crowns, veneers, dentures, and esthetic restorative care.",
    },
    contact: {
      phone: "+92 334 9844763",
      whatsapp: "+92 334 9844763",
      email: "dr.asif100@yahoo.com",
      address: "857-A, J-2 Block Market, Phase 2, Johar Town, Lahore",
    },
    hours: {
      weekdays: "9:00 AM - 6:00 PM",
      weekend: "10:00 AM - 4:00 PM",
    },
  },
  services: [
    ["full-mouth-rehabilitation", { title: "Full Mouth Rehabilitation", icon: "scan-face", description: "Comprehensive planning for worn, missing, failing, or collapsed dentitions using fixed, removable, and implant-supported options.", order: 1, active: true }],
    ["crowns-bridges-veneers", { title: "Crowns, Bridges & Veneers", icon: "badge-check", description: "PFM, all-ceramic crowns, bridges, veneers, and smile-defining restorations for function and natural esthetics.", order: 2, active: true }],
    ["implant-supported-prostheses", { title: "Implant-Supported Prostheses", icon: "circle-dot", description: "Single implant restorations, implant-supported bridges, overdentures, and full-arch prosthetic rehabilitation.", order: 3, active: true }],
    ["complete-partial-dentures", { title: "Complete & Partial Dentures", icon: "smile", description: "Complete dentures, cast partial dentures, flexible dentures, and immediate dentures designed for comfort and retention.", order: 4, active: true }],
    ["smile-design", { title: "Smile Design", icon: "wand-sparkles", description: "Esthetic rehabilitation, veneers, tooth proportions, and restorative planning for confident, natural-looking smiles.", order: 5, active: true }],
    ["occlusal-splints", { title: "Occlusal Splints", icon: "moon", description: "Night guards, bite stabilization, occlusal analysis, and temporomandibular treatment planning support.", order: 6, active: true }],
    ["maxillofacial-prosthodontics", { title: "Maxillofacial Prosthodontics", icon: "shield-plus", description: "Special prosthodontic support including obturators and coordinated multidisciplinary rehabilitation for complex needs.", order: 7, active: true }],
    ["digital-implant-planning", { title: "Digital Implant Planning", icon: "scan-line", description: "Digital impressions, restorative workflow planning, laboratory coordination, and prosthesis delivery protocols.", order: 8, active: true }],
  ],
  gallery: [
    ["whitening-case", { title: "In-Clinic Whitening", category: "whitening", description: "Shade improvement with supervised enamel-safe whitening.", beforeImageUrl: "https://images.unsplash.com/photo-1667133295315-820bb6481730?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 1, active: true }],
    ["braces-case", { title: "Alignment Case", category: "braces", description: "Bite-focused planning for cleaner alignment and function.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 2, active: true }],
    ["implant-case", { title: "Single-Tooth Implant", category: "implants", description: "Digitally planned replacement for comfort and stability.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80", order: 3, active: true }],
    ["cosmetic-case", { title: "Smile Design", category: "cosmetic-dentistry", description: "Subtle refinements for shape, brightness, and symmetry.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814594-6d444894210e?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 4, active: true }],
  ],
  testimonials: [
    ["sara-malik", { patientName: "Sara Malik", role: "Cosmetic Dentistry Patient", rating: 5, review: "The consultation was calm and clear. I understood the treatment plan before we started, and the final result feels completely natural.", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", order: 1, active: true }],
    ["hamza-farooq", { patientName: "Hamza Farooq", role: "Crown & Bite Rehabilitation Patient", rating: 5, review: "My crowns and bite were planned with great care. The treatment felt organized, and my smile looks natural.", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", order: 2, active: true }],
    ["amina-sheikh", { patientName: "Amina Sheikh", role: "Implant Patient", rating: 5, review: "The clinic feels modern, clean, and welcoming. My implant planning was explained step by step, which made the process easier.", photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80", order: 3, active: true }],
  ],
  publications: [
    ["impression-disinfection", { title: "An overview of dental impression disinfection techniques", description: "JPDA literature review on infection control and dental impression disinfection protocols.", link: "https://www.jpda.com.pk/an-overview-of-dental-impression-disinfection-techniques-a-literature-review", order: 1, active: true }],
    ["denture-hyperplasia", { title: "A Massive Denture Induced Hyperplastic Lesion in Maxilla", description: "Case report covering surgical management and prosthodontic rehabilitation after denture-induced hyperplasia.", link: "https://doi.org/10.25301/JPDA.281.47", order: 2, active: true }],
    ["pharyngeal-obturator", { title: "Pharyngeal Obturator Prosthetic Rehabilitation of Velopharyngeal Insufficiency", description: "JCPSP case report on maxillofacial prosthodontic rehabilitation with a pharyngeal obturator.", link: "https://pubmed.ncbi.nlm.nih.gov/31839102/", order: 3, active: true }],
    ["denture-hygiene", { title: "Assessment of Knowledge and Practices about Denture Hygiene among Complete Denture Wearers in Lahore City", description: "JPDA research on denture hygiene awareness and patient practices among complete denture wearers.", link: "https://www.jpda.com.pk/assessment-of-knowledge-and-practices-about-denture-hygiene-among-complete-denture-wearers-in-lahore-city", order: 4, active: true }],
    ["alginate-disinfection", { title: "The effect of sodium hypochlorite disinfectant on alginate impression material", description: "Professional Medical Journal study on dimensional stability after sodium hypochlorite disinfection.", link: "https://theprofesional.com/index.php/tpmj/article/view/6200", order: 5, active: true }],
    ["golden-proportion", { title: "Analysis of Golden Proportion in Maxillary Anterior Dentition", description: "Pakistan Oral & Dental Journal article on esthetic proportions in maxillary anterior teeth.", link: "https://podj.com.pk/index.php/podj/article/view/690", order: 6, active: true }],
  ],
  socialLinks: [
    ["instagram", { platform: "Instagram", icon: "instagram", url: "https://www.instagram.com/dr.muhammadasifmushtaq", order: 1, active: true }],
    ["tiktok", { platform: "TikTok", icon: "tiktok", url: "https://www.tiktok.com/@dr_asifmushtaq", order: 2, active: true }],
    ["facebook", { platform: "Facebook", icon: "facebook", url: "", order: 3, active: false }],
    ["linkedin", { platform: "LinkedIn", icon: "linkedin", url: "", order: 4, active: false }],
  ],
  faqs: [
    ["full-mouth-rehab", { question: "Who needs full mouth rehabilitation?", answer: "It is considered for patients with multiple missing, worn, broken, or failing teeth, bite collapse, or complex restorative needs that require coordinated prosthodontic planning.", order: 1, active: true }],
    ["implant-prostheses", { question: "What is an implant-supported prosthesis?", answer: "It is a crown, bridge, overdenture, or full-arch restoration supported by dental implants and planned to restore function, comfort, and esthetics.", order: 2, active: true }],
    ["prosthodontist", { question: "Why see a prosthodontist?", answer: "A prosthodontist has specialist training in restoring and replacing teeth, including crowns, bridges, dentures, veneers, implants, bite rehabilitation, and complex oral rehabilitation.", order: 3, active: true }],
    ["cv-download", { question: "Can I review Dr Asif's professional CV?", answer: "Yes. Use the Download CV button on the website to review his FCPS Prosthodontics training, clinical experience, publications, and professional background.", order: 4, active: true }],
  ],
  cvHighlights: [
    ["clinical-procedure-experience", { title: "Clinical Procedure Experience", icon: "bar-chart-3", items: ["Full mouth rehabilitation cases - 100+", "Porcelain fused to metal crowns - 1000+", "All ceramic crowns and veneers - 1000+", "Conventional and cantilever bridges - 500+", "Implant-supported fixed prostheses - 500+"], order: 1, active: true }],
    ["academic-specialist-training", { title: "Academic & Specialist Training", icon: "graduation-cap", items: ["FCPS Prosthodontics, College of Physicians & Surgeons Pakistan", "BDS, de'Montmorency College of Dentistry, Lahore", "Assistant Professor, Akhtar Saeed Medical & Dental College", "Senior Registrar experience in Lahore and Riyadh", "English C2 and Arabic clinical communication experience"], order: 2, active: true }],
    ["selected-publications", { title: "Selected Publications", icon: "book-open-check", items: ["An overview of dental impression disinfection techniques - JPDA, 2018", "Pharyngeal obturator prosthetic rehabilitation of velopharyngeal insufficiency - JCPSP, 2019", "Assessment of denture hygiene knowledge and practices among complete denture wearers - JPDA, 2019", "Analysis of golden proportion in maxillary anterior dentition - 2022"], order: 3, active: true }],
  ],
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const loginScreen = $("[data-login-screen]");
const dashboardScreen = $("[data-dashboard-screen]");
const loginForm = $("[data-login-form]");
const loginStatus = $("[data-login-status]");
const configWarning = $("[data-config-warning]");
const adminStatus = $("[data-admin-status]");
const adminEmail = $("[data-admin-email]");

configWarning.hidden = isFirebaseConfigured();

function setStatus(message, type = "info") {
  if (!adminStatus) return;
  adminStatus.textContent = message;
  adminStatus.dataset.type = type;
}

function setLoginStatus(message) {
  if (loginStatus) loginStatus.textContent = message;
}

function setScreen(user) {
  loginScreen.hidden = Boolean(user);
  dashboardScreen.hidden = !user;
  if (adminEmail && user) adminEmail.textContent = user.email;
}

function showPanel(name) {
  $$("[data-admin-view]").forEach((button) => button.classList.toggle("active", button.dataset.adminView === name));
  $$("[data-admin-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === name));
}

function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (value instanceof File) return;
    if (key === "id") return;
    if (key.includes(".")) {
      setNested(data, key, value);
    } else {
      data[key] = value;
    }
  });

  $$("input[type='checkbox']", form).forEach((input) => {
    data[input.name] = input.checked;
  });

  $$("input[type='number']", form).forEach((input) => {
    if (input.name) data[input.name] = Number(input.value || 0);
  });

  return data;
}

function setNested(target, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((object, key) => {
    object[key] = object[key] || {};
    return object[key];
  }, target);
  parent[last] = value;
}

function getNested(target, path) {
  return path.split(".").reduce((value, key) => value?.[key], target);
}

function fillForm(form, data) {
  $$("input, textarea, select", form).forEach((input) => {
    if (!input.name) return;
    if (input.type === "file") {
      input.value = "";
      return;
    }
    if (input.type === "checkbox") {
      input.checked = Boolean(data[input.name]);
      return;
    }
    input.value = getNested(data, input.name) ?? data[input.name] ?? "";
  });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatDate(value) {
  if (!value) return "No date";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toLocaleString();
  return String(value);
}

function cardActions(collection, id) {
  return `
    <div class="admin-card-actions">
      <button type="button" class="btn btn-secondary" data-edit-record="${collection}" data-id="${id}">Edit</button>
      <button type="button" class="btn btn-secondary danger" data-delete-record="${collection}" data-id="${id}">Delete</button>
    </div>
  `;
}

function renderAppointments(rows) {
  const list = $("[data-list='appointments']");
  if (!list) return;
  list.innerHTML = rows.length
    ? rows
        .map(
          (item) => `
            <article class="admin-card">
              <div>
                <span class="admin-pill">${item.status || "new"}</span>
                <h3>${escapeHtml(item.fullName || "Unnamed Patient")}</h3>
                <p>${escapeHtml(item.service || "Consultation")} • ${escapeHtml(item.preferredDate || "No date selected")}</p>
                <p>${escapeHtml(item.phone || "")} · ${escapeHtml(item.email || "")}</p>
                <p>${escapeHtml(item.message || "No message")}</p>
                <small>${formatDate(item.createdAt)}</small>
              </div>
              <div class="admin-card-actions">
                <button type="button" class="btn btn-secondary" data-appointment-status="contacted" data-id="${item.id}">Mark Contacted</button>
                <button type="button" class="btn btn-secondary" data-appointment-status="completed" data-id="${item.id}">Mark Completed</button>
                <button type="button" class="btn btn-secondary danger" data-delete-record="appointments" data-id="${item.id}">Delete</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="admin-empty">No appointment requests yet.</div>`;
}

function renderServices(rows) {
  renderSimpleList("services", rows, (item) => `
    <i data-lucide="${escapeHtml(item.icon || "circle")}" aria-hidden="true"></i>
    <h3>${escapeHtml(item.title || "Untitled service")}</h3>
    <p>${escapeHtml(item.description || "")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
}

function renderGallery(rows) {
  renderSimpleList("gallery", rows, (item) => `
    <div class="admin-thumbs">
      ${item.beforeImageUrl ? `<img src="${escapeAttribute(item.beforeImageUrl)}" alt="" />` : ""}
      ${item.afterImageUrl ? `<img src="${escapeAttribute(item.afterImageUrl)}" alt="" />` : ""}
    </div>
    <h3>${escapeHtml(item.title || "Untitled case")}</h3>
    <p>${escapeHtml(item.category || "gallery")} • ${escapeHtml(item.description || "")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
}

function renderTestimonials(rows) {
  renderSimpleList("testimonials", rows, (item) => `
    <div class="admin-person">
      ${item.photoUrl ? `<img src="${escapeAttribute(item.photoUrl)}" alt="" />` : ""}
      <div>
        <h3>${escapeHtml(item.patientName || "Unnamed Patient")}</h3>
        <p>${escapeHtml(item.role || "")} • ${"★".repeat(Number(item.rating || 5))}</p>
      </div>
    </div>
    <p>${escapeHtml(item.review || "")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
}

function renderPublications(rows) {
  const list = $("[data-list='publications']");
  if (!list) return;

  list.innerHTML = rows.length
    ? rows
        .map(
          (item) => `
            <article class="admin-card">
              <div>
                <i data-lucide="book-open-check" aria-hidden="true"></i>
                <h3>${escapeHtml(item.title || "Untitled publication")}</h3>
                <p>${escapeHtml(item.description || "")}</p>
                ${item.link ? `<a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener">Open link</a>` : ""}
                <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
              </div>
              ${cardActions("publications", item.id)}
            </article>
          `
        )
        .join("")
    : `
      <div class="admin-empty">
        <h3>Default publications are not loaded yet</h3>
        <p>The public website can show fallback publication cards, but they become editable here only after they are saved in Firestore.</p>
        <button class="btn btn-secondary" type="button" data-seed-content>
          <i data-lucide="database" aria-hidden="true"></i>
          <span>Load Default Publications</span>
        </button>
      </div>
    `;
  window.lucide?.createIcons();
}

function renderSocialLinks(rows) {
  renderSimpleList("socialLinks", rows, (item) => `
    <i data-lucide="share-2" aria-hidden="true"></i>
    <h3>${escapeHtml(item.platform || "Social Link")}</h3>
    <p>${escapeHtml(item.url || "No URL set")} • Icon: ${escapeHtml(item.icon || "website")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
}

function renderFaqs(rows) {
  renderSimpleList("faqs", rows, (item) => `
    <h3>${escapeHtml(item.question || "Untitled question")}</h3>
    <p>${escapeHtml(item.answer || "")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
}

function renderCvHighlights(rows) {
  const list = $("[data-list='cvHighlights']");
  if (!list) return;

  list.innerHTML = rows.length
    ? rows
        .map(
          (item) => `
            <article class="admin-card">
              <div>
                <i data-lucide="${escapeHtml(item.icon || "circle")}" aria-hidden="true"></i>
                <h3>${escapeHtml(item.title || "Untitled card")}</h3>
                <ul>${(Array.isArray(item.items) ? item.items : []).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
                <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
              </div>
              ${cardActions("cvHighlights", item.id)}
            </article>
          `
        )
        .join("")
    : `
      <div class="admin-empty">
        <h3>Default highlights are not loaded yet</h3>
        <p>The public website can show fallback highlight cards, but they become editable here only after they are saved in Firestore.</p>
        <button class="btn btn-secondary" type="button" data-seed-cv-highlights>
          <i data-lucide="database" aria-hidden="true"></i>
          <span>Load Default Highlights</span>
        </button>
      </div>
    `;
  window.lucide?.createIcons();
}

function renderSimpleList(collection, rows, bodyRenderer) {
  const list = $(`[data-list='${collection}']`);
  if (!list) return;
  list.innerHTML = rows.length
    ? rows
        .map(
          (item) => `
            <article class="admin-card">
              <div>${bodyRenderer(item)}</div>
              ${cardActions(collection, item.id)}
            </article>
          `
        )
        .join("")
    : `<div class="admin-empty">No records yet. Add the first one above.</div>`;
  window.lucide?.createIcons();
}

async function handleCollectionForm(event, collection) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id?.value?.trim() || "";
  const data = formToObject(form);

  if (collection === "cvHighlights" && typeof data.items === "string") {
    data.items = data.items
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  await saveDocument(getFirestoreCollection(collection), data, id);
  form.reset();
  if (form.elements.id) form.elements.id.value = "";
  setStatus("Saved successfully.", "success");
}

function getFirestoreCollection(collection) {
  const firestoreCollection = collectionToFirestore(collection);
  if (!firestoreCollection) throw new Error(`Unknown admin collection: ${collection || "missing"}.`);
  return firestoreCollection;
}

function collectionToFirestore(collection) {
  return {
    appointments: CMS_COLLECTIONS.appointments,
    services: CMS_COLLECTIONS.services,
    gallery: CMS_COLLECTIONS.gallery,
    testimonials: CMS_COLLECTIONS.testimonials,
    publications: CMS_COLLECTIONS.publications,
    cvHighlights: CMS_COLLECTIONS.cvHighlights,
    socialLinks: CMS_COLLECTIONS.socialLinks,
    faqs: CMS_COLLECTIONS.faqs,
  }[collection];
}

async function loadSettingsForm() {
  const form = $("[data-settings-form]");
  if (!form) return;
  const settings = await getSiteSettings();
  if (settings) fillForm(form, settings);
}

async function startSubscriptions() {
  state.unsubs.forEach((unsubscribe) => unsubscribe());
  state.unsubs = [];

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.appointments, (rows) => {
    state.records.appointments = rows;
    renderAppointments(rows);
  }, { orderBy: false }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.services, (rows) => {
    state.records.services = rows;
    renderServices(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.gallery, (rows) => {
    state.records.gallery = rows;
    renderGallery(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.testimonials, (rows) => {
    state.records.testimonials = rows;
    renderTestimonials(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.publications, (rows) => {
    state.records.publications = rows;
    renderPublications(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.socialLinks, (rows) => {
    state.records.socialLinks = rows;
    renderSocialLinks(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.faqs, (rows) => {
    state.records.faqs = rows;
    renderFaqs(rows);
  }));

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.cvHighlights, (rows) => {
    state.records.cvHighlights = rows;
    renderCvHighlights(rows);
  }));

  await loadSettingsForm();
}

function bindEvents() {
  $$("[data-admin-view]").forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.adminView));
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    setLoginStatus("Signing in...");
    try {
      await signInAdmin(data.get("email"), data.get("password"));
      setLoginStatus("");
    } catch (error) {
      setLoginStatus(error.message);
    }
  });

  $("[data-signout]")?.addEventListener("click", async () => {
    await signOutAdmin();
    setStatus("");
  });

  async function seedCvHighlights() {
    if (!window.confirm("Load default highlights into Firebase? Existing matching default records will be updated.")) return;
    try {
      setStatus("Loading default highlights...");
      await Promise.all(
        starterContent.cvHighlights.map(([id, data]) => saveDocument(CMS_COLLECTIONS.cvHighlights, data, id))
      );
      setStatus("Default highlights loaded.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function seedStarterContent() {
    if (!window.confirm("Load starter content into Firebase? Existing matching starter records will be updated.")) return;
    try {
      setStatus("Loading starter content...");
      await saveSiteSettings(starterContent.settings);
      await Promise.all([
        ...starterContent.services.map(([id, data]) => saveDocument(CMS_COLLECTIONS.services, data, id)),
        ...starterContent.gallery.map(([id, data]) => saveDocument(CMS_COLLECTIONS.gallery, data, id)),
        ...starterContent.testimonials.map(([id, data]) => saveDocument(CMS_COLLECTIONS.testimonials, data, id)),
        ...starterContent.publications.map(([id, data]) => saveDocument(CMS_COLLECTIONS.publications, data, id)),
        ...starterContent.cvHighlights.map(([id, data]) => saveDocument(CMS_COLLECTIONS.cvHighlights, data, id)),
        ...starterContent.socialLinks.map(([id, data]) => saveDocument(CMS_COLLECTIONS.socialLinks, data, id)),
        ...starterContent.faqs.map(([id, data]) => saveDocument(CMS_COLLECTIONS.faqs, data, id)),
      ]);
      await loadSettingsForm();
      setStatus("Starter content loaded.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  $$("[data-admin-form]").forEach((form) => {
    form.addEventListener("submit", (event) => handleCollectionForm(event, form.dataset.adminForm).catch((error) => setStatus(error.message, "error")));
    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        if (form.elements.id) form.elements.id.value = "";
      }, 0);
    });
  });

  $("[data-settings-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await saveSiteSettings({ ...formToObject(event.currentTarget), contentVersion: CURRENT_CONTENT_VERSION });
      setStatus("Clinic settings saved.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.addEventListener("click", async (event) => {
    const seedButton = event.target.closest("[data-seed-content]");
    const seedCvHighlightsButton = event.target.closest("[data-seed-cv-highlights]");
    const editButton = event.target.closest("[data-edit-record]");
    const deleteButton = event.target.closest("[data-delete-record]");
    const statusButton = event.target.closest("[data-appointment-status]");

    if (seedButton) {
      await seedStarterContent();
      return;
    }

    if (seedCvHighlightsButton) {
      await seedCvHighlights();
      return;
    }

    if (editButton) {
      const collection = editButton.dataset.editRecord;
      const record = state.records[collection]?.find((item) => item.id === editButton.dataset.id);
      const form = $(`[data-admin-form='${collection}']`);
      if (record && form) {
        fillForm(form, record);
        if (collection === "cvHighlights" && form.elements.items) {
          form.elements.items.value = Array.isArray(record.items) ? record.items.join("\n") : String(record.items || "");
        }
      }
    }

    if (deleteButton) {
      const collection = deleteButton.dataset.deleteRecord;
      const id = deleteButton.dataset.id;
      if (!id) {
        setStatus("Could not delete this record because its document id is missing.", "error");
        return;
      }
      if (!window.confirm("Delete this record?")) return;
      await deleteDocument(getFirestoreCollection(collection), id);
      setStatus("Deleted.", "success");
    }

    if (statusButton) {
      const id = statusButton.dataset.id;
      if (!id) {
        setStatus("Could not update this appointment because its document id is missing.", "error");
        return;
      }
      await saveDocument(CMS_COLLECTIONS.appointments, { status: statusButton.dataset.appointmentStatus }, id);
      setStatus("Appointment updated.", "success");
    }
  });
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

bindEvents();

onAdminAuthStateChanged(async (user) => {
  setScreen(user);
  if (user) {
    setStatus("Loading website content...");
    await startSubscriptions();
    setStatus("Ready.", "success");
  }
});
