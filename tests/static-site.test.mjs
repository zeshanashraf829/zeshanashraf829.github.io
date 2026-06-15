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
    "Dental Cleaning",
    "Root Canal Treatment",
    "Teeth Whitening",
    "Dental Implants",
    "Braces & Orthodontics",
    "Tooth Extraction",
    "Fillings",
    "Cosmetic Dentistry",
  ];
  const trustItems = [
    "10+ Years Experience",
    "1000+ Happy Patients",
    "Modern Equipment",
    "Experienced Dentist",
    "Latest Technology",
    "Sterilized Environment",
    "Affordable Treatment",
    "Emergency Support",
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

  for (const source of [html, admin, adminJs]) {
    assert.match(source, /Dr Asif Mushtaq/);
    assert.match(source, /asifmushtaq@gmail\.com/);
    assert.match(source, /\+92 300 9844763/);
    assert.match(source, /857-A, J-2 Block Market, Phase 2, Johar Town, Lahore/);
    assert.doesNotMatch(source, /Dr\. Hazzar Ahmed|Hazzar Dental|appointments@hazzardental\.com|\+92 300 1234567|Suite 12, Main Boulevard/);
  }

  assert.match(html, /assets\/images\/dr-asif-logo\.jpg/);
  assert.match(admin, /assets\/images\/dr-asif-logo\.jpg/);
  assert.match(css, /\.brand-mark\s+img\s*\{[^}]*border-radius:\s*50%/s);
});

test("footer social links use recognizable brand icons and CMS-managed URLs", () => {
  const html = readHtml();
  const admin = readFileSync(adminPath, "utf8");
  const adminJs = readFileSync(adminJsPath, "utf8");
  const siteCms = readFileSync(siteCmsPath, "utf8");
  const css = readFileSync(stylesPath, "utf8");

  for (const network of ["instagram", "facebook", "linkedin"]) {
    assert.match(html, new RegExp(`data-cms-social="${network}"`), `${network} link should be CMS-managed`);
    assert.match(html, new RegExp(`data-social-icon="${network}"`), `${network} should use a brand SVG icon`);
    assert.match(siteCms, new RegExp(`social\\?\\.${network}`), `${network} URL should hydrate from site settings`);
    assert.match(adminJs, new RegExp(`${network}: ""`), `${network} should exist in starter content`);
  }

  assert.match(admin, /name="social\.linkedin"/, "Admin settings should include a LinkedIn URL field");
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

  assert.match(html, /assets\/js\/site-cms\.js/);
  assert.match(html, /data-cms-root/);
  assert.match(html, /data-cms-section="services"/);
  assert.match(html, /data-cms-section="gallery"/);
  assert.match(html, /data-cms-section="testimonials"/);
  assert.match(html, /data-cms-section="faqs"/);
  assert.match(html, /data-cms-field="hero\.headline"/);
  assert.match(html, /data-cms-field="contact\.phone"/);
  assert.match(html, /data-appointment-form/);
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
    "FAQ",
    "Clinic Settings",
    "data-admin-view",
  ]) {
    assert.match(admin, new RegExp(text));
  }

  assert.match(config, /firebaseConfig/);
  assert.match(config, /isFirebaseConfigured/);
  assert.match(config, /ranazeshi41@gmail\.com/);
  assert.doesNotMatch(config, /admin@doctorsport\.com|doctor@example\.com/);

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
  assert.match(adminJs, /signInAdmin/);
  assert.doesNotMatch(adminJs, /uploadImageFile|uploadOptionalFile/);
});

test("Firebase security rules are included for Firestore only", () => {
  assert.ok(existsSync(firestoreRulesPath), "Firestore rules should exist");
  assert.ok(!existsSync(new URL("../firebase/storage.rules", import.meta.url)), "Storage rules should not be used");

  const firestoreRules = readFileSync(firestoreRulesPath, "utf8");

  assert.match(firestoreRules, /match \/siteSettings\/\{document\}/);
  assert.match(firestoreRules, /ranazeshi41@gmail\.com/);
  assert.doesNotMatch(firestoreRules, /admin@doctorsport\.com|doctor@example\.com/);
  assert.match(firestoreRules, /match \/appointmentRequests\/\{document\}/);
  assert.match(firestoreRules, /allow create: if true/);
  assert.match(firestoreRules, /allow write: if request\.auth != null/);
});
