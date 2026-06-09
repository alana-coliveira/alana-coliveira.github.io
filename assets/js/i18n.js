const supportedLanguages = ["pt", "en", "es"];
const defaultLanguage = "pt";
let translations = {};

const getNestedValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);

async function loadTranslations(lang) {
  if (!translations[lang]) {
    const response = await fetch(`translations/${lang}.json`);
    translations[lang] = await response.json();
  }
  return translations[lang];
}

function applyTranslations(dictionary) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = getNestedValue(dictionary, element.dataset.i18n);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(";").forEach((entry) => {
      const [attribute, key] = entry.split(":");
      const value = getNestedValue(dictionary, key);
      if (attribute && typeof value === "string") {
        element.setAttribute(attribute, value);
      }
    });
  });

  if (dictionary.meta?.title) {
    document.title = dictionary.meta.title;
  }
}

async function setLanguage(lang) {
  const nextLanguage = supportedLanguages.includes(lang) ? lang : defaultLanguage;
  const dictionary = await loadTranslations(nextLanguage);
  applyTranslations(dictionary);
  document.documentElement.lang = dictionary.meta.lang;
  localStorage.setItem("preferredLanguage", nextLanguage);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === nextLanguage);
  });
}

function setTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("preferredTheme", nextTheme);
}

function initializeTheme() {
  const storedTheme = localStorage.getItem("preferredTheme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(storedTheme || systemTheme);

  document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

function initializeNavigation() {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initializeReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function initializeContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("[data-contact-name]").value.trim();
    const email = document.querySelector("[data-contact-email]").value.trim();
    const message = document.querySelector("[data-contact-message]").value.trim();
    const subject = encodeURIComponent(`Contato pelo site - ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    window.location.href = `mailto:acoliveira.ppgecb@uesc.br?subject=${subject}&body=${body}`;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initializeTheme();
  initializeNavigation();
  initializeReveals();
  initializeContactForm();

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  await setLanguage(localStorage.getItem("preferredLanguage") || defaultLanguage);
});
