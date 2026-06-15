const { mkdirSync, writeFileSync } = require("node:fs");
const { chromium } = require("playwright");

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:4173/";

async function collectMetrics(page) {
  return page.evaluate(() => ({
    title: document.title,
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    imageCount: document.images.length,
    brokenImages: [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.src),
    sections: [...document.querySelectorAll("main section[id]")].map((section) => section.id),
  }));
}

async function main() {
  mkdirSync("previews", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const desktopMetrics = await collectMetrics(page);
  await page.screenshot({ path: "previews/desktop-preview.png", fullPage: true });

  const galleryButton = page.locator("[data-category='whitening'] [data-lightbox]");
  await galleryButton.click();
  const lightboxOpen = await page.locator("[data-lightbox-modal].open").isVisible();
  await page.keyboard.press("Escape");

  const faqButton = page.locator(".faq-item").nth(1).locator("button");
  await faqButton.click();
  const faqExpanded = await faqButton.getAttribute("aria-expanded");

  await page.locator("#fullName").fill("Test Patient");
  await page.locator("#phone").fill("+92 300 0000000");
  await page.locator("#email").fill("patient@example.com");
  await page.selectOption("#service", "Dental Cleaning");
  await page.locator("#preferredDate").fill("2026-07-01");
  await page.locator("#message").fill("Routine checkup request.");
  await page.locator(".form-submit").click();
  await page
    .waitForFunction(() => !document.querySelector("[data-form-status]")?.textContent.includes("Saving your appointment request"), null, { timeout: 15000 })
    .catch(() => {});
  const formStatus = await page.locator("[data-form-status]").innerText();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const mobileMetrics = await collectMetrics(page);
  const navToggleVisible = await page.locator("[data-nav-toggle]").isVisible();
  await page.screenshot({ path: "previews/mobile-preview.png", fullPage: true });
  await page.locator("[data-nav-toggle]").click();
  const mobileMenuOpen = await page.locator("[data-nav-menu].open").isVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl.replace(/\/$/, "")}/admin.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const adminMetrics = {
    ...(await collectMetrics(page)),
    configWarningVisible: await page.locator("[data-config-warning]").isVisible(),
    loginVisible: await page.locator("[data-login-form]").isVisible(),
    dashboardVisible: await page.locator("[data-dashboard-screen]").isVisible(),
  };
  await page.screenshot({ path: "previews/admin-preview.png", fullPage: true });

  await browser.close();

  const result = {
    desktopMetrics,
    mobileMetrics,
    adminMetrics,
    interactions: {
      lightboxOpen,
      faqExpanded,
      formStatus,
      navToggleVisible,
      mobileMenuOpen,
    },
  };

  const failures = [];
  if (desktopMetrics.scrollWidth > desktopMetrics.width) failures.push("Desktop has horizontal overflow");
  if (mobileMetrics.scrollWidth > mobileMetrics.width) failures.push("Mobile has horizontal overflow");
  if (adminMetrics.scrollWidth > adminMetrics.width) failures.push("Admin page has horizontal overflow");
  if (desktopMetrics.brokenImages.length || mobileMetrics.brokenImages.length) failures.push("One or more images failed to load");
  if (!lightboxOpen) failures.push("Lightbox did not open");
  if (faqExpanded !== "true") failures.push("FAQ did not expand");
  if (
    !formStatus.includes("Firebase is not configured yet") &&
    !formStatus.includes("Test Patient") &&
    !formStatus.includes("could not be saved")
  ) {
    failures.push("Appointment form did not show a save, setup, or backend error status");
  }
  if (!navToggleVisible || !mobileMenuOpen) failures.push("Mobile navigation did not open");
  if (!adminMetrics.loginVisible || adminMetrics.dashboardVisible) failures.push("Admin setup/login state did not render correctly");

  console.log(JSON.stringify(result, null, 2));

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
