# Firebase CMS Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Firebase-backed login admin panel so the doctor can manage appointments, gallery cases, testimonials, services, FAQs, and clinic settings without editing code.

**Architecture:** Keep the site static and Pages-friendly, but add Firebase client modules loaded by browser ES modules. Public pages render fallback HTML first, then hydrate from Firestore when Firebase is configured. Admin pages require Firebase Auth and write content metadata to Firestore. Images are stored as public URLs or repo-relative code paths, not Firebase Storage uploads.

**Tech Stack:** Static HTML/CSS/JS, Firebase Web SDK via official CDN modules, Firebase Auth, Firestore, Firebase Hosting or GitHub Pages.

---

### File Structure

- Create `admin.html`: authenticated dashboard shell with panels for appointments, services, gallery, testimonials, FAQs, settings, and setup status.
- Create `assets/js/firebase-config.js`: one editable config object with placeholder values.
- Create `assets/js/firebase-client.js`: Firebase initialization, collections, CRUD helpers, and configured-state detection.
- Create `assets/js/site-cms.js`: public-site hydration from Firestore and appointment submission persistence.
- Create `assets/js/admin.js`: login/logout, list rendering, create/update/delete forms, settings form, and URL/path image fields.
- Modify `assets/js/main.js`: expose public UI helpers without breaking current non-Firebase behavior.
- Modify `assets/css/styles.css`: admin dashboard styles and public dynamic-state styles.
- Create `firebase/firestore.rules`: secure rules for public reads, public appointment creates, and authenticated admin writes.
- Modify `README.md`: Firebase setup, deployment, and required user-provided values.
- Modify tests: cover admin shell, Firebase modules, CMS data hooks, rules files, and existing visual checks.

### Task 1: Static Contract Tests

- [ ] Add tests that fail until `admin.html`, Firebase modules, rules, and public CMS hooks exist.
- [ ] Run `node --test tests/static-site.test.mjs`.
- [ ] Expected: tests fail because new Firebase CMS files and hooks are missing.

### Task 2: Firebase Module Layer

- [ ] Add `firebase-config.js` placeholders with `isFirebaseConfigured`.
- [ ] Add `firebase-client.js` exporting auth/db helpers, CRUD functions, and appointment submission.
- [ ] Keep Firebase SDK imports CDN-based so no build step is required.
- [ ] Run static tests.

### Task 3: Admin Panel

- [ ] Add `admin.html` dashboard markup.
- [ ] Add `admin.js` to handle auth, render lists, process forms, delete records, and save image URLs/code paths.
- [ ] Add admin styles.
- [ ] Run static tests.

### Task 4: Public CMS Hydration

- [ ] Add CMS data hooks to `index.html`.
- [ ] Add `site-cms.js` to load settings/services/gallery/testimonials/faqs from Firestore.
- [ ] Replace current appointment form local-only behavior with Firebase submit when configured, keeping local fallback message otherwise.
- [ ] Run static tests and visual checks.

### Task 5: Firebase Setup Documentation

- [ ] Add Firestore rules.
- [ ] Update README with Firebase project setup, Auth user creation, config copy-paste, and deployment options.
- [ ] Include exactly what is needed from the user: Firebase config, admin email/password setup, and final clinic content.

### Task 6: Verification

- [ ] Run `node --test tests/static-site.test.mjs`.
- [ ] Run visual check: `NODE_PATH=/Users/zeshanashraf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/zeshanashraf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/visual-check.cjs`.
- [ ] If the browser cannot access Firebase placeholders, verify that fallback content and setup warnings render without runtime crashes.
