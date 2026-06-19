import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const htmlPath = new URL("../index.html", import.meta.url);
const adminPath = new URL("../admin.html", import.meta.url);
const firebaseConfigPath = new URL("../assets/js/firebase-config.js", import.meta.url);
const firebaseClientPath = new URL("../assets/js/firebase-client.js", import.meta.url);
const siteCmsPath = new URL("../assets/js/site-cms.js", import.meta.url);
const adminJsPath = new URL("../assets/js/admin.js", import.meta.url);
const stylesPath = new URL("../assets/css/styles.css", import.meta.url);
const logoPath = new URL("../assets/images/dr-asif-logo.jpg", import.meta.url);
const cvPath = new URL("../assets/docs/asif-mushtaq-prosthodontist-cv.pdf", import.meta.url);
const firestoreRulesPath = new URL("../firebase/firestore.rules", import.meta.url);

function readHtml() {
  assert.ok(existsSync(htmlPath), "index.html should exist at the site root");
  return readFileSync(htmlPath, "utf8");
}

function visibleText(html) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&copy;/g, "(c)")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("portfolio page includes required landing sections and navigation", () => {
  const html = readHtml();
  const requiredIds = [
    "home",
    "about",
    "services",
    "gallery",
    "testimonials",
    "faq",
    "appointment",
    "contact",
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing #${id} section`);
    assert.match(html, new RegExp(`href="#${id}"`), `Missing #${id} nav or CTA link`);
  }

  assert.match(html, /Book Appointment/);
  assert.match(html, /WhatsApp Consultation/);
});

test("services and trust content match the dental portfolio brief", () => {
  const html = readHtml();
  const pageText = visibleText(html);
  const services = [
    "Full Mouth Rehabilitation",
    "Crowns, Bridges & Veneers",
    "Implant-Supported Prostheses",
    "Complete & Partial Dentures",
    "Smile Design",
    "Occlusal Splints",
    "Maxillofacial Prosthodontics",
    "Digital Implant Planning",
  ];
  const trustItems = [
    "Senior Registrar Prosthodontist",
    "500+ Implant Restorations",
    "1000+ Crowns & Veneers",
    "FCPS Prosthodontics",
    "SCFHS Licensed",
    "Assistant Professor",
    "Digital Workflow",
    "Hospital-Based Experience",
    "Patient-Centered Care",
  ];

  for (const text of [...services, ...trustItems]) {
    assert.match(pageText, new RegExp(text.replace(/[+&]/g, "\\$&")), `Missing ${text}`);
  }
});

test("appointment form exposes all required fields", () => {
  const html = readHtml();
  const requiredNames = [
    "fullName",
    "phone",
    "email",
    "service",
    "preferredDate",
    "message",
  ];

  for (const name of requiredNames) {
    assert.match(html, new RegExp(`name="${name}"`), `Missing form field ${name}`);
  }

  assert.match(html, /Schedule Your Visit/);
});

test("gallery, testimonials, FAQ, SEO, and local assets are wired", () => {
  const html = readHtml();

  for (const filter of ["Whitening", "Braces", "Implants", "Cosmetic Dentistry"]) {
    assert.match(html, new RegExp(`data-filter="${filter.toLowerCase().replace(/\s+/g, "-")}"`));
  }

  assert.match(html, /data-lightbox/);
  assert.match(html, /aria-label="Open image preview/);
  assert.match(html, /testimonial-track/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /assets\/css\/styles.css/);
  assert.match(html, /assets\/js\/main.js/);

  const imageTags = html.match(/<img\b/g) ?? [];
  assert.ok(imageTags.length >= 8, "Expected at least 8 image assets");
  assert.doesNotMatch(html, /<img(?![^>]*alt=)/, "Every image should have alt text");
});

test("gallery comparison labels stay attached to the before and after image grid", () => {
  assert.ok(existsSync(stylesPath), "styles.css should exist");

  const css = readFileSync(stylesPath, "utf8");

  assert.match(css, /\.comparison\s*\{[^}]*display:\s*grid/s, "Comparison wrapper should remain a grid");
  assert.doesNotMatch(
    css,
    /\.case-card\s+span\s*\{/,
    "Generic case-card span styles should not override the comparison wrapper"
  );
  assert.match(
    css,
    /\.case-card\s*>\s*div\s*>\s*span\s*\{/,
    "Case category styling should be scoped to the content metadata span"
  );
});

test("default clinic identity uses Dr Asif Mushtaq details and circular logo", () => {
  const html = readHtml();
  const admin = readFileSync(adminPath, "utf8");
  const adminJs = readFileSync(adminJsPath, "utf8");
  const css = readFileSync(stylesPath, "utf8");

  assert.ok(existsSync(logoPath), "Dr Asif logo should be committed as a local site asset");
  assert.ok(existsSync(cvPath), "Dr Asif CV should be committed as a downloadable local site asset");

  for (const source of [html, admin, adminJs]) {
    assert.match(source, /Dr Asif Mushtaq/);
    assert.match(source, /dr\.asif100@yahoo\.com/);
    assert.match(source, /\+92 334 9844763/);
    assert.match(source, /857-A, J-2 Block Market, Phase 2, Johar Town, Lahore/);
    assert.doesNotMatch(source, /Dr\. Hazzar Ahmed|Hazzar Dental|appointments@hazzardental\.com|asifmushtaq@gmail\.com|\+92 300 9844763|\+92 300 1234567|Suite 12, Main Boulevard/);
  }

  assert.match(html, /assets\/images\/dr-asif-logo\.jpg/);
  assert.match(html, /assets\/docs\/asif-mushtaq-prosthodontist-cv\.pdf/);
  assert.match(html, /Download CV/);
  assert.match(html, /Senior Registrar Prosthodontist/);
  assert.match(html, /SCFHS \(14RD0039936\)/);
  assert.match(html, /FCPS Prosthodontics/);
  assert.match(admin, /assets\/images\/dr-asif-logo\.jpg/);
  assert.match(css, /\.brand-mark\s+img\s*\{[^}]*border-radius:\s*50%/s);
});

test("footer social links use recognizable brand icons and CMS-managed URLs", () => {
  const html = readHtml();
  const admin = readFileSync(adminPath, "utf8");
  const adminJs = readFileSync(adminJsPath, "utf8");
  const siteCms = readFileSync(siteCmsPath, "utf8");
  const css = readFileSync(stylesPath, "utf8");

  for (const network of ["instagram", "tiktok"]) {
    assert.match(html, new RegExp(`data-cms-social="${network}"`), `${network} link should be CMS-managed`);
    assert.match(html, new RegExp(`data-social-icon="${network}"`), `${network} should use a brand SVG icon`);
    assert.match(siteCms, new RegExp(`social\\?\\.${network}`), `${network} URL should hydrate from site settings`);
    assert.match(adminJs, new RegExp(`${network}: "https://`), `${network} should have a default starter URL`);
  }

  assert.match(html, /https:\/\/www\.instagram\.com\/dr\.muhammadasifmushtaq/);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@dr_asifmushtaq/);
  assert.match(admin, /name="social\.tiktok"/, "Admin settings should include a TikTok URL field");
  assert.match(css, /\.social-icon\s*\{[^}]*width:\s*20px/s, "Brand SVG icons should have stable sizing");
  assert.match(
    css,
    /\.social-links\s+a\s*\{[^}]*display:\s*inline-grid;[^}]*place-items:\s*center/s,
    "Footer social links should center icons inside their square buttons"
  );
  assert.doesNotMatch(html, /data-lucide="(?:camera|message-square|briefcase-business)"/);
});

test("public site is wired for Firebase CMS hydration and appointment storage", () => {
  const html = readHtml();
  const siteCms = readFileSync(siteCmsPath, "utf8");
  const mainJs = readFileSync(new URL("../assets/js/main.js", import.meta.url), "utf8");
  const css = readFileSync(stylesPath, "utf8");

  assert.match(html, /assets\/js\/site-cms\.js/);
  assert.match(html, /data-cms-root/);
  assert.match(html, /data-cms-section="services"/);
  assert.match(html, /data-cms-section="gallery"/);
  assert.match(html, /data-cms-section="testimonials"/);
  assert.match(html, /data-cms-section="faqs"/);
  assert.match(html, /data-cms-section="publications"/);
  assert.match(html, /data-cms-field="hero\.headline"/);
  assert.match(html, /data-cms-field="contact\.phone"/);
  assert.match(html, /data-appointment-form/);
  assert.match(siteCms, /CURRENT_CONTENT_VERSION/);
  assert.match(siteCms, /isCurrentCmsContent/);
  assert.match(siteCms, /renderPublications/);
  assert.match(siteCms, /CMS_COLLECTIONS\.publications/);
  assert.match(mainJs, /setupScrollReveals/);
  assert.match(mainJs, /refreshCmsInteractions\(\)[\s\S]*setupScrollReveals/);
  assert.match(css, /\.reveal-on-scroll/);
  assert.match(css, /\.reveal-on-scroll\.is-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("admin dashboard and Firebase modules exist with required capabilities", () => {
  assert.ok(existsSync(adminPath), "admin.html should exist");
  assert.ok(existsSync(firebaseConfigPath), "Firebase config module should exist");
  assert.ok(existsSync(firebaseClientPath), "Firebase client module should exist");
  assert.ok(existsSync(siteCmsPath), "Public CMS module should exist");
  assert.ok(existsSync(adminJsPath), "Admin JS module should exist");

  const admin = readFileSync(adminPath, "utf8");
  const config = readFileSync(firebaseConfigPath, "utf8");
  const client = readFileSync(firebaseClientPath, "utf8");
  const siteCms = readFileSync(siteCmsPath, "utf8");
  const adminJs = readFileSync(adminJsPath, "utf8");

  for (const text of [
    "Admin Login",
    "Appointments",
    "Services",
    "Gallery",
    "Testimonials",
    "Publications",
    "FAQ",
    "Clinic Settings",
    "data-admin-view",
  ]) {
    assert.match(admin, new RegExp(text));
  }

  assert.match(config, /firebaseConfig/);
  assert.match(config, /isFirebaseConfigured/);
  assert.match(config, /dr\.asifdentalimplantcenter@gmail\.com/);
  assert.doesNotMatch(config, /ranazeshi41@gmail\.com|admin@doctorsport\.com|doctor@example\.com/);
  assert.match(admin, /placeholder="you@example\.com"/);
  assert.doesNotMatch(admin, /placeholder="ranazeshi41@gmail\.com"|type="password"[^>]*value=/);

  for (const fn of [
    "saveAppointmentRequest",
    "subscribeCollection",
    "saveDocument",
    "deleteDocument",
    "signInAdmin",
    "signOutAdmin",
  ]) {
    assert.match(client, new RegExp(`export async function ${fn}|export function ${fn}`), `Missing ${fn}`);
  }

  assert.doesNotMatch(client, /firebase-storage|uploadImageFile|getStorage|uploadBytes/);
  assert.doesNotMatch(admin, /type="file"|beforeFile|afterFile|photoFile/);
  assert.match(admin, /assets\/images\/gallery/);
  assert.match(siteCms, /loadPublicCms/);
  assert.match(siteCms, /saveAppointmentRequest/);
  assert.match(adminJs, /contentVersion:\s*CURRENT_CONTENT_VERSION/);
  assert.match(admin, /data-admin-view="publications"/);
  assert.match(admin, /data-admin-form="publications"/);
  assert.match(admin, /Add \/ Edit Publication/);
  assert.match(admin, /Existing Publications/);
  assert.match(admin, /name="title"[^>]*placeholder="Publication title"/);
  assert.match(admin, /name="description"/);
  assert.match(admin, /name="link"[^>]*type="url"/);
  assert.match(admin, /data-publications-list-heading/);
  assert.match(adminJs, /publications:\s*\[/);
  assert.match(adminJs, /Default publications are not loaded yet/);
  assert.match(adminJs, /\$\$\(\"\[data-seed-content\]\"\)/);
  assert.match(client, /publications:\s*"publications"/);
  assert.match(adminJs, /signInAdmin/);
  assert.doesNotMatch(adminJs, /uploadImageFile|uploadOptionalFile/);
});

test("admin dashboard CSS supports responsive, consistent management views", () => {
  const css = readFileSync(stylesPath, "utf8");

  assert.match(css, /\.admin-shell\s*\{[^}]*background:\s*var\(--surface\)/s);
  assert.match(css, /\.admin-sidebar\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(css, /\.admin-nav\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(css, /\.admin-nav button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.admin-panel\.active\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.admin-topbar-actions\s+\.btn/s);
  assert.match(css, /@media \(max-width:\s*760px\)\s*\{[\s\S]*\.admin-card-actions\s+\.btn/s);
  assert.match(css, /@media \(max-width:\s*520px\)\s*\{[\s\S]*\.admin-sidebar\s+\.brand/s);
});

test("Firebase security rules are included for Firestore only", () => {
  assert.ok(existsSync(firestoreRulesPath), "Firestore rules should exist");
  assert.ok(!existsSync(new URL("../firebase/storage.rules", import.meta.url)), "Storage rules should not be used");

  const firestoreRules = readFileSync(firestoreRulesPath, "utf8");

  assert.match(firestoreRules, /match \/siteSettings\/\{document\}/);
  assert.match(firestoreRules, /dr\.asifdentalimplantcenter@gmail\.com/);
  assert.doesNotMatch(firestoreRules, /ranazeshi41@gmail\.com|admin@doctorsport\.com|doctor@example\.com/);
  assert.match(firestoreRules, /match \/publications\/\{document\}/);
  assert.match(firestoreRules, /match \/appointmentRequests\/\{document\}/);
  assert.match(firestoreRules, /allow create: if true/);
  assert.match(firestoreRules, /allow write: if request\.auth != null/);
});

test("publications render as professional outbound links and are manageable from admin", () => {
  const html = readHtml();
  const siteCms = readFileSync(siteCmsPath, "utf8");
  const adminJs = readFileSync(adminJsPath, "utf8");

  assert.match(html, /id="publications"/);
  assert.match(html, /data-cms-section="publications"/);
  assert.match(html, /href="#publications"/);
  assert.match(html, /An overview of dental impression disinfection techniques/);
  assert.match(html, /target="_blank" rel="noopener"/);
  assert.doesNotMatch(html, /<article class="publication-card">\s*<i data-lucide="external-link"/);
  assert.match(html, /<a href="https:\/\/www\.jpda\.com\.pk\/an-overview-of-dental-impression-disinfection-techniques-a-literature-review" target="_blank" rel="noopener">\s*<i data-lucide="external-link"/);

  for (const field of ["title", "description", "link", "order", "active"]) {
    assert.match(adminJs, new RegExp(field), `Publication seed/admin code should include ${field}`);
  }

  assert.match(siteCms, /function renderPublications/);
  assert.match(siteCms, /target="_blank" rel="noopener"/);
  assert.match(siteCms, /escapeAttribute\(item\.link/);
  assert.doesNotMatch(siteCms, /<article class="publication-card">\s*<i data-lucide="\$\{escapeAttribute\(item\.icon/);
  assert.match(siteCms, /<a href="\$\{escapeAttribute\(item\.link \|\| "#"\)\}" target="_blank" rel="noopener">\s*<i data-lucide="external-link"/);
});
