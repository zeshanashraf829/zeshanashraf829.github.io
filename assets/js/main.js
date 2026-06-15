document.documentElement.classList.remove("no-js");

const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const navLinks = [...document.querySelectorAll(".nav-menu a")];
const year = document.querySelector("[data-year]");

if (window.lucide) {
  window.lucide.createIcons();
}

if (year) {
  year.textContent = new Date().getFullYear();
}

const closeMenu = () => {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
  navMenu.classList.remove("open");
  document.body.classList.remove("nav-open");
};

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
    navMenu.classList.toggle("open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => observer.observe(section));
}

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const getCaseCards = () => [...document.querySelectorAll("[data-category]")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    getCaseCards().forEach((card) => {
      const isVisible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !isVisible);
    });
  });
});

const lightbox = document.querySelector("[data-lightbox-modal]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPlaceholder = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
let activeLightboxTrigger = null;

const openLightbox = (trigger) => {
  if (!lightbox || !lightboxImage || !lightboxCaption) return;
  activeLightboxTrigger = trigger;
  lightboxImage.src = trigger.dataset.image;
  lightboxImage.alt = trigger.dataset.title || "Dental case preview";
  lightboxCaption.textContent = trigger.dataset.title || "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = lightboxPlaceholder;
  document.body.style.overflow = "";
  activeLightboxTrigger?.focus();
};

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-lightbox]");
  if (!trigger) return;
  openLightbox(trigger);
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeLightbox();
  }
});

const testimonialTrack = document.querySelector("[data-testimonial-track]");
const testimonialPrev = document.querySelector("[data-testimonial-prev]");
const testimonialNext = document.querySelector("[data-testimonial-next]");

const scrollTestimonials = (direction) => {
  if (!testimonialTrack) return;
  const firstCard = testimonialTrack.querySelector(".testimonial-card");
  const distance = firstCard ? firstCard.getBoundingClientRect().width + 18 : 420;
  testimonialTrack.scrollBy({ left: distance * direction, behavior: "smooth" });
};

testimonialPrev?.addEventListener("click", () => scrollTestimonials(-1));
testimonialNext?.addEventListener("click", () => scrollTestimonials(1));

function setupFaqAccordions(root = document) {
  root.querySelectorAll(".faq-item").forEach((item) => {
    if (item.dataset.faqBound === "true") return;
    item.dataset.faqBound = "true";
    const button = item.querySelector("button");
    const panel = item.querySelector(".faq-panel");
    if (!button || !panel) return;

    const setPanelHeight = () => {
      panel.style.maxHeight = item.classList.contains("open") ? `${panel.scrollHeight}px` : "0px";
    };

    setPanelHeight();

    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
      setPanelHeight();
    });

    window.addEventListener("resize", setPanelHeight, { passive: true });
  });
}

setupFaqAccordions();

window.DentalSite = {
  refreshCmsInteractions() {
    window.lucide?.createIcons();
    setupFaqAccordions();
  },
};
