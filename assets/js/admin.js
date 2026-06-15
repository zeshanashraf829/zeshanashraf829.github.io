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
    faqs: [],
  },
  unsubs: [],
};

const starterContent = {
  settings: {
    doctor: {
      name: "Dr. Hazzar Ahmed",
      credentials: "BDS, FCPS - Oral & Maxillofacial Surgery",
    },
    hero: {
      headline: "Creating Healthy & Confident Smiles",
      description:
        "Personalized dental surgery, restorative dentistry, and cosmetic care in a calm, modern clinic designed around comfort, clarity, and long-term oral health.",
    },
    contact: {
      phone: "+92 300 1234567",
      whatsapp: "+92 300 1234567",
      email: "appointments@hazzardental.com",
      address: "Suite 12, Main Boulevard, Lahore",
    },
    hours: {
      weekdays: "9:00 AM - 6:00 PM",
      weekend: "10:00 AM - 4:00 PM",
    },
    social: {
      instagram: "",
      facebook: "",
    },
  },
  services: [
    ["dental-cleaning", { title: "Dental Cleaning", icon: "sparkles", description: "Professional scaling, polishing, and gum-health checks to keep your smile fresh and healthy.", order: 1, active: true }],
    ["root-canal-treatment", { title: "Root Canal Treatment", icon: "activity", description: "Comfort-led endodontic care that saves infected teeth and relieves pain precisely.", order: 2, active: true }],
    ["teeth-whitening", { title: "Teeth Whitening", icon: "sun", description: "Clinician-supervised whitening plans for a brighter smile with enamel-safe protocols.", order: 3, active: true }],
    ["dental-implants", { title: "Dental Implants", icon: "circle-dot", description: "Natural-looking tooth replacement planned for stability, function, and long-term confidence.", order: 4, active: true }],
    ["braces-orthodontics", { title: "Braces & Orthodontics", icon: "align-center-horizontal", description: "Alignment options for better bite balance, aesthetics, and easier daily oral hygiene.", order: 5, active: true }],
    ["tooth-extraction", { title: "Tooth Extraction", icon: "shield-plus", description: "Careful removal of damaged or impacted teeth with strong comfort and recovery guidance.", order: 6, active: true }],
    ["fillings", { title: "Fillings", icon: "badge-plus", description: "Tooth-colored restorations designed to protect structure and blend with your smile.", order: 7, active: true }],
    ["cosmetic-dentistry", { title: "Cosmetic Dentistry", icon: "wand-sparkles", description: "Veneers, bonding, contouring, and smile design for refined, natural-looking results.", order: 8, active: true }],
  ],
  gallery: [
    ["whitening-case", { title: "In-Clinic Whitening", category: "whitening", description: "Shade improvement with supervised enamel-safe whitening.", beforeImageUrl: "https://images.unsplash.com/photo-1667133295315-820bb6481730?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 1, active: true }],
    ["braces-case", { title: "Alignment Case", category: "braces", description: "Bite-focused planning for cleaner alignment and function.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 2, active: true }],
    ["implant-case", { title: "Single-Tooth Implant", category: "implants", description: "Digitally planned replacement for comfort and stability.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80", order: 3, active: true }],
    ["cosmetic-case", { title: "Smile Design", category: "cosmetic-dentistry", description: "Subtle refinements for shape, brightness, and symmetry.", beforeImageUrl: "https://images.unsplash.com/photo-1588776814594-6d444894210e?auto=format&fit=crop&w=700&q=80", afterImageUrl: "https://images.unsplash.com/photo-1617812191081-2a24e3f30e45?auto=format&fit=crop&w=700&q=80", order: 4, active: true }],
  ],
  testimonials: [
    ["sara-malik", { patientName: "Sara Malik", role: "Cosmetic Dentistry Patient", rating: 5, review: "The consultation was calm and clear. I understood the treatment plan before we started, and the final result feels completely natural.", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", order: 1, active: true }],
    ["hamza-farooq", { patientName: "Hamza Farooq", role: "Root Canal Patient", rating: 5, review: "I came in with severe tooth pain and was treated the same day. The root canal was much easier than I expected.", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", order: 2, active: true }],
    ["amina-sheikh", { patientName: "Amina Sheikh", role: "Implant Patient", rating: 5, review: "The clinic feels modern, clean, and welcoming. My implant planning was explained step by step, which made the process easier.", photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80", order: 3, active: true }],
  ],
  faqs: [
    ["whitening-enamel", { question: "Does professional whitening damage enamel?", answer: "Professional whitening is planned around your tooth condition and gum health. Protective barriers and controlled materials help reduce sensitivity and protect enamel.", order: 1, active: true }],
    ["implant-longevity", { question: "How long do dental implants last?", answer: "With careful planning, healthy gums, and regular maintenance visits, dental implants can last many years and often become a long-term tooth replacement option.", order: 2, active: true }],
    ["root-canal-pain", { question: "Is root canal treatment painful?", answer: "Local anesthesia and modern techniques make root canal treatment much more comfortable than many patients expect.", order: 3, active: true }],
    ["emergency-booking", { question: "Can I book an emergency appointment?", answer: "Yes. Call or send a WhatsApp message for toothache, swelling, trauma, broken restorations, or urgent dental pain.", order: 4, active: true }],
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

function renderFaqs(rows) {
  renderSimpleList("faqs", rows, (item) => `
    <h3>${escapeHtml(item.question || "Untitled question")}</h3>
    <p>${escapeHtml(item.answer || "")}</p>
    <small>Order ${Number(item.order || 0)} ${item.active === false ? "• Hidden" : "• Visible"}</small>
  `);
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
  const id = form.elements.id.value;
  const data = formToObject(form);

  await saveDocument(collectionToFirestore(collection), data, id);
  form.reset();
  form.elements.id.value = "";
  setStatus("Saved successfully.", "success");
}

function collectionToFirestore(collection) {
  return {
    appointments: CMS_COLLECTIONS.appointments,
    services: CMS_COLLECTIONS.services,
    gallery: CMS_COLLECTIONS.gallery,
    testimonials: CMS_COLLECTIONS.testimonials,
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

  state.unsubs.push(await subscribeCollection(CMS_COLLECTIONS.faqs, (rows) => {
    state.records.faqs = rows;
    renderFaqs(rows);
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

  $("[data-seed-content]")?.addEventListener("click", async () => {
    if (!window.confirm("Load starter content into Firebase? Existing matching starter records will be updated.")) return;
    try {
      setStatus("Loading starter content...");
      await saveSiteSettings(starterContent.settings);
      await Promise.all([
        ...starterContent.services.map(([id, data]) => saveDocument(CMS_COLLECTIONS.services, data, id)),
        ...starterContent.gallery.map(([id, data]) => saveDocument(CMS_COLLECTIONS.gallery, data, id)),
        ...starterContent.testimonials.map(([id, data]) => saveDocument(CMS_COLLECTIONS.testimonials, data, id)),
        ...starterContent.faqs.map(([id, data]) => saveDocument(CMS_COLLECTIONS.faqs, data, id)),
      ]);
      await loadSettingsForm();
      setStatus("Starter content loaded.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

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
      await saveSiteSettings(formToObject(event.currentTarget));
      setStatus("Clinic settings saved.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  document.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-record]");
    const deleteButton = event.target.closest("[data-delete-record]");
    const statusButton = event.target.closest("[data-appointment-status]");

    if (editButton) {
      const collection = editButton.dataset.editRecord;
      const record = state.records[collection]?.find((item) => item.id === editButton.dataset.id);
      const form = $(`[data-admin-form='${collection}']`);
      if (record && form) fillForm(form, record);
    }

    if (deleteButton) {
      const collection = deleteButton.dataset.deleteRecord;
      const id = deleteButton.dataset.id;
      if (!window.confirm("Delete this record?")) return;
      await deleteDocument(collectionToFirestore(collection), id);
      setStatus("Deleted.", "success");
    }

    if (statusButton) {
      await saveDocument(CMS_COLLECTIONS.appointments, { status: statusButton.dataset.appointmentStatus }, statusButton.dataset.id);
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
