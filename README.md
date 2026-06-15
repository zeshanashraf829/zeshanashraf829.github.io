# Dentist Doctor Portfolio

Static dentist portfolio website with an optional Firebase CMS admin panel.

## What Exists

- `index.html` - public one-page dental portfolio.
- `admin.html` - login-based admin panel for the doctor.
- `assets/js/firebase-config.js` - Firebase project config and admin email allowlist.
- `assets/js/firebase-client.js` - Firebase Auth and Firestore helpers.
- `assets/js/site-cms.js` - loads public content from Firebase and submits appointments.
- `assets/js/admin.js` - dashboard login, forms, lists, edit/delete, and starter content.
- `firebase/firestore.rules` - Firestore security rules.
- `firebase.json` - Firebase Hosting/rules config.

The public site still has fallback content. If Firebase is not configured, it will look normal, but appointment requests will not be saved.

## What I Need From You

1. Final clinic details:
   - doctor name and credentials
   - phone, WhatsApp, email
   - clinic address and hours
   - final gallery/review images if available

Firebase web config has already been added to `assets/js/firebase-config.js`. This config is safe to place in frontend code. Security comes from Firebase Auth and Security Rules, not from hiding this config.

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app in Firebase project settings.
3. Confirm the Firebase config in `assets/js/firebase-config.js`.
4. Enable Authentication:
   - Authentication > Sign-in method > Email/Password > Enable.
   - Authentication > Users > Add user.
   - Use `ranazeshi41@gmail.com`.
5. Confirm the admin email allowlist is `ranazeshi41@gmail.com` in:
   - `assets/js/firebase-config.js`
   - `firebase/firestore.rules`
6. Create Firestore Database.
7. Publish rules:

```bash
firebase deploy --only firestore:rules
```

8. Open `/admin.html`, log in, then click **Load Starter Content** once.

The currently published Firestore rule intentionally allows public appointment creates:

```js
match /appointmentRequests/{document} {
  allow create: if true;
  allow read, update, delete: if isAdmin();
}
```

That is the simplest working setup for the website form. Admin-only collections still require the signed-in `ranazeshi41@gmail.com` user.

## Image Flow Without Firebase Storage

Firebase Storage is not used.

For gallery and testimonial images, use one of these no-paid-storage options:

1. Commit image files into the repo, for example:
   - `assets/images/gallery/before-case-1.jpg`
   - `assets/images/gallery/after-case-1.jpg`
   - `assets/images/testimonials/patient-1.jpg`
2. Paste that relative path into the admin image field.
3. Or paste any public image URL, such as an existing CDN, clinic website, or GitHub raw/public asset URL.

Important: a browser-based admin panel cannot safely upload files directly into your GitHub repository without exposing a GitHub token or using a backend. This project avoids that security risk by storing only image paths/URLs in Firestore.

## Deploy Options

### Recommended: Firebase Hosting

```bash
firebase login
firebase init hosting
firebase deploy
```

Choose the current folder as the public site root if prompted. This repo already includes `firebase.json`.

### Alternative: GitHub Pages

You can host the static files on GitHub Pages and still use Firebase for Auth and Firestore. In Firebase Authentication settings, add your GitHub Pages domain under authorized domains.

## Data Collections

- `siteSettings/main` - doctor, hero, contact, hours, social links.
- `services` - treatment cards.
- `galleryCases` - before/after cases.
- `testimonials` - patient reviews.
- `faqs` - FAQ accordion.
- `appointmentRequests` - public form submissions.

## Verify Locally

```bash
python3 -m http.server 4173
node --test tests/static-site.test.mjs
NODE_PATH=/Users/zeshanashraf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/zeshanashraf/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/visual-check.cjs
```
