let pageName =
  typeof window !== "undefined" && typeof window.__PAGE__ === "string" ? window.__PAGE__ : "";

const ADMIN_FRAGMENT_ENDPOINT = "/api/admin/fragments";
const ADMIN_PAGE_RE = /^admin-[a-z0-9-]+\.html$/i;

const NAV_DESTINATIONS = {
  home: "/index.html",
  "shop all": "/index.html",
  dogs: "/dogs.html",
  cats: "/cats.html",
  accessories: "/accessories.html",
  blog: "/blog.html"
};

const SHARED_STOREFRONT_NAVBAR_PAGES = new Set([
  "index.html",
  "dogs.html",
  "cats.html",
  "accessories.html",
  "blog.html",
  "cart.html",
  "profile.html",
  "product-detail.html",
  "deals.html",
  "contact.html"
]);

const STOREFRONT_PRIMARY_NAV_LINKS = [
  { key: "home", label: "Home", href: "/index.html" },
  { key: "dogs", label: "Dogs", href: "/dogs.html" },
  { key: "cats", label: "Cats", href: "/cats.html" },
  { key: "accessories", label: "Accessories", href: "/accessories.html" },
  { key: "blog", label: "Blog", href: "/blog.html" }
];

const PRODUCT_ID_BY_NAME = {
  "premium grain-free kibble": "dogs-kibble-premium",
  "indestructible rubber bone": "dogs-bone-indestructible",
  "orthopedic memory foam bed": "dogs-bed-orthopedic",
  "adjustable leather harness": "dogs-harness-leather",
  "calming hemp treats": "dogs-hemp-treats",
  "waterproof raincoat": "dogs-raincoat"
};

const HOMEPAGE_PRODUCT_ALIAS_BY_NAME = {
  "smart puzzle feeder": "dogs-bone-indestructible",
  "comfort pro harness": "dogs-harness-leather",
  "zen bamboo bowl": "accessories-collar-tan",
  "sisal wave scratcher": "cats-ocean-grain",
  "pure pet shampoo": "accessories-collar-tan"
};

const HOMEPAGE_CARD_PRODUCT_ID_BY_NAME = {
  "velvet orthopedic bed": "deals-bed-velvet",
  "smart puzzle feeder": "dogs-bone-indestructible",
  "comfort pro harness": "dogs-harness-leather",
  "zen bamboo bowl": "accessories-collar-tan",
  "wild ocean cat grain": "cats-ocean-grain",
  "tan leather collar": "accessories-collar-tan",
  "sisal wave scratcher": "cats-ocean-grain",
  "pure pet shampoo": "accessories-collar-tan"
};

const INDEX_HEADING_EXCLUSIONS = new Set(["flash sale", "best sellers", "browse categories"]);

const FLASH_SALE_FALLBACK_BY_INDEX = [
  "deals-bed-velvet",
  "dogs-bone-indestructible",
  "cats-ocean-grain",
  "accessories-collar-tan"
];

const BEST_SELLERS_FALLBACK_BY_INDEX = [
  "dogs-harness-leather",
  "accessories-collar-tan",
  "cats-ocean-grain",
  "accessories-collar-tan"
];

const STOREFRONT_CARD_SELECTORS_BY_PAGE = {
  "index.html": ["main .group.bg-surface-container-lowest.rounded-xl.p-6"],
  "dogs.html": ["main .group.bg-surface-container-lowest.p-6.rounded-lg"],
  "cats.html": ["main .bg-surface-container-lowest.rounded-lg.overflow-hidden.flex.flex-col.h-full"],
  "accessories.html": ["main .group.bg-surface-container-lowest.rounded-lg.overflow-hidden"],
  "deals.html": [".grid-4 .card", ".bundle-grid .bundle"]
};

const STOREFRONT_INTERACTIVE_DESCENDANT_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"]';

const STOREFRONT_PRODUCT_ALIAS_BY_NAME = {
  "premium salmon pate": "cats-ocean-grain",
  "natural clumping litter": "cats-ocean-grain",
  "multi-level cat tree": "cats-ocean-grain",
  "organic catnip mice": "cats-ocean-grain",
  "self-grooming wall brush": "cats-ocean-grain",
  "grain-free kibble": "dogs-kibble-premium",
  "leather comfort collar": "accessories-collar-tan",
  "luxe orthopedic bed": "deals-bed-velvet",
  "adventure harness": "dogs-harness-leather",
  "ceramic duo bowls": "accessories-collar-tan",
  "orthopedic comfort bed": "deals-bed-velvet",
  "wild ocean cat formula": "cats-ocean-grain",
  "adventure mesh harness": "dogs-harness-leather",
  "play & enrich toy pack": "dogs-bone-indestructible",
  "happy dog starter set": "dogs-kibble-premium",
  "purrfect home essentials": "cats-ocean-grain"
};

document.addEventListener("DOMContentLoaded", () => {
  enhanceTopNavLinks();

  if (document.body.hasAttribute("data-ps-admin-shell")) {
    initAdminShell();
    return;
  }

  enhanceForPage(currentPage());
});

function setCurrentPage(page) {
  pageName = typeof page === "string" ? page : "";

  if (typeof window !== "undefined") {
    window.__PAGE__ = pageName;
  }
}

function currentPage() {
  return pageName;
}

function enhanceForPage(page) {
  setCurrentPage(page);

  if (isAdminPage()) {
    normalizeAdminSidebar();
  }

  ensureSharedStorefrontNavbar();
  wireCartIcon();
  wireProfileIcon();
  wireIndexPrimaryCtas();
  wireCartCheckoutButton();

  if (!isAdminPage()) {
    hydrateCartIconCount();
    wireStorefrontProductClickthrough();
  }

  if (currentPage() === "dogs.html") {
    wireDogsAddToCart();
  }

  if (currentPage() === "index.html") {
    wireIndexAddToCart();
  }

  if (currentPage() === "product-detail.html") {
    hydrateProductDetailPage();
    wireProductDetailCtas();
  }

  if (currentPage() === "cart.html") {
    hydrateCartPage();
  }

  if (currentPage() === "checkout.html") {
    wirePlaceOrder();
  }

  if (currentPage() === "admin-login.html") {
    wireAdminLoginPage();
  }

  if (currentPage() === "profile.html") {
    hydrateProfileOrders();
  }

  if (currentPage() === "admin-products.html") {
    hydrateAdminProductsPage();
  }

  if (currentPage() === "admin-product-form.html") {
    hydrateAdminProductForm();
  }

  if (currentPage() === "admin-orders.html") {
    hydrateAdminOrdersPage();
  }

  if (currentPage() === "admin-users.html") {
    hydrateAdminUsersPage();
  }
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isAdminPage() {
  return normalizeText(currentPage()).startsWith("admin-");
}

function currentPageName() {
  if (currentPage()) {
    return currentPage();
  }

  const path = window.location.pathname || "";
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "";
}

const ADMIN_NAV_HREF_ENDINGS = [
  "admin-products.html",
  "admin-product-form.html",
  "admin-pricing.html",
  "admin-orders.html",
  "admin-blog.html",
  "admin-users.html",
  "admin-user-verification.html",
  "admin-login.html"
];

function isAdminNavHref(href) {
  if (!href) {
    return false;
  }

  return ADMIN_NAV_HREF_ENDINGS.some((ending) => href.endsWith(ending));
}

function isStorefrontNavHref(href, text) {
  if (href && href.endsWith("index.html")) {
    return true;
  }

  return normalizeText(text).includes("storefront") || Boolean(href && href.includes("storefront"));
}

function normalizeLinkHref(link) {
  const rawHref = link.getAttribute("href") || "";

  if (!rawHref) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawHref, window.location.origin);
    return parsedUrl.pathname.toLowerCase();
  } catch {
    return rawHref.split("#")[0].split("?")[0].toLowerCase();
  }
}

function selectAdminSidebar() {
  const asides = Array.from(document.querySelectorAll("aside"));

  if (asides.length === 0) {
    return null;
  }

  let bestAside = null;
  let bestScore = 0;

  asides.forEach((aside) => {
    if (!(aside instanceof HTMLElement)) {
      return;
    }

    const links = Array.from(aside.querySelectorAll("nav a[href]"));
    const score = links.reduce((count, link) => {
      if (!(link instanceof HTMLAnchorElement)) {
        return count;
      }

      const href = normalizeLinkHref(link);
      const text = link.textContent || "";
      if (isAdminNavHref(href) || isStorefrontNavHref(href, text)) {
        return count + 1;
      }

      return count;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestAside = aside;
    }
  });

  if (bestAside instanceof HTMLElement && bestScore > 0) {
    return bestAside;
  }

  return asides[0] instanceof HTMLElement ? asides[0] : null;
}

function tagAdminSidebarBrand(aside) {
  const nav = aside.querySelector("nav");
  const textCandidates = Array.from(
    aside.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, strong, div")
  ).filter((candidate) => {
    if (!(candidate instanceof HTMLElement)) {
      return false;
    }

    if (nav instanceof HTMLElement && nav.contains(candidate)) {
      return false;
    }

    const text = normalizeText(candidate.textContent);
    return text.includes("petshop") && text.length <= 80;
  });

  const title = textCandidates[0];
  if (!(title instanceof HTMLElement)) {
    return;
  }

  title.dataset.psAdminSidebarBrandTitle = "true";

  const nearbyContainers = [];
  if (title.parentElement instanceof HTMLElement) {
    nearbyContainers.push(title.parentElement);

    if (title.parentElement.previousElementSibling instanceof HTMLElement) {
      nearbyContainers.push(title.parentElement.previousElementSibling);
    }

    if (title.parentElement.nextElementSibling instanceof HTMLElement) {
      nearbyContainers.push(title.parentElement.nextElementSibling);
    }
  }

  let caption = null;

  nearbyContainers.some((container) => {
    const options = Array.from(container.querySelectorAll("small, span, p, div"));
    const match = options.find((candidate) => {
      if (!(candidate instanceof HTMLElement)) {
        return false;
      }

      if (candidate === title || candidate.contains(title)) {
        return false;
      }

      if (nav instanceof HTMLElement && nav.contains(candidate)) {
        return false;
      }

      const text = normalizeText(candidate.textContent);
      return text.length > 0 && text.length <= 80 && !text.includes("petshop");
    });

    if (match instanceof HTMLElement) {
      caption = match;
      return true;
    }

    return false;
  });

  if (caption instanceof HTMLElement) {
    caption.dataset.psAdminSidebarBrandCaption = "true";
  }
}

function normalizeAdminSidebar() {
  const aside = selectAdminSidebar();

  if (!(aside instanceof HTMLElement)) {
    return;
  }

  document.body.dataset.psAdmin = "true";
  aside.dataset.psAdminSidebar = "true";

  const isFixedSidebar =
    getComputedStyle(aside).position === "fixed" || aside.classList.contains("fixed");
  document.body.dataset.psAdminSidebarFixed = isFixedSidebar ? "true" : "false";

  const activePage = currentPageName();
  const navLinks = aside.querySelectorAll("nav a[href]");

  navLinks.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    link.classList.add("ps-admin-nav-link");

    const href = normalizeLinkHref(link);
    const isActive = Boolean(activePage) && href.endsWith(activePage);
    link.classList.toggle("ps-admin-nav-active", isActive);
    link.classList.toggle("active", isActive);
  });

  tagAdminSidebarBrand(aside);

  injectAdminSidebarStyle();
}

function injectAdminSidebarStyle() {
  if (document.querySelector("#ps-admin-sidebar-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "ps-admin-sidebar-style";
  style.textContent = `
body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] {
  background: linear-gradient(180deg, #306bac 0%, #1f5a93 100%);
  width: 280px !important;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}

body[data-ps-admin-sidebar-fixed="true"] main {
  margin-left: 280px !important;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.625rem;
  border-left: 3px solid transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  text-decoration: none;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link.ps-admin-nav-active {
  background: rgba(255, 255, 255, 0.16);
  border-left-color: #ff8c42;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] [data-ps-admin-sidebar-brand-title="true"] {
  font-family: Poppins, Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] [data-ps-admin-sidebar-brand-caption="true"] {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.65);
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link > * {
  color: inherit;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link span {
  color: inherit;
}

body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link i,
body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link svg,
body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link span.material-symbols-outlined,
body[data-ps-admin="true"] aside[data-ps-admin-sidebar="true"] nav a.ps-admin-nav-link [class*="icon"] {
  color: inherit;
  fill: currentColor;
  stroke: currentColor;
}
`;

  document.head.appendChild(style);
}

function getAdminShellHost() {
  const host = document.querySelector('[data-ps-admin-shell-host="true"]');
  return host instanceof HTMLElement ? host : null;
}

function getPageFromPath(pathname) {
  const segment = (pathname || "").split("/").filter(Boolean).pop() || "";

  if (!ADMIN_PAGE_RE.test(segment) || normalizeText(segment) === "admin-login.html") {
    return null;
  }

  return segment;
}

function getAdminShellStyleTag() {
  const existing = document.querySelector('style[data-ps-admin-page-style="true"]');

  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const style = document.createElement("style");
  style.dataset.psAdminPageStyle = "true";
  document.head.appendChild(style);
  return style;
}

async function fetchAdminFragment(page) {
  const response = await fetch(`${ADMIN_FRAGMENT_ENDPOINT}?page=${encodeURIComponent(page)}`, {
    cache: "no-store",
    credentials: "same-origin"
  });

  if (response.status === 401) {
    redirectToAdminLogin();
    const unauthorizedError = new Error("UNAUTHORIZED");
    unauthorizedError.status = 401;
    throw unauthorizedError;
  }

  if (!response.ok) {
    throw new Error("Unable to load admin fragment");
  }

  return response.json();
}

async function loadAdminShellFragment(page, fallbackUrl) {
  const host = getAdminShellHost();

  if (!host) {
    throw new Error("Admin shell host not found");
  }

  try {
    const payload = await fetchAdminFragment(page);
    host.innerHTML = typeof payload.mainInnerHtml === "string" ? payload.mainInnerHtml : "";

    const styleTag = getAdminShellStyleTag();
    styleTag.textContent = typeof payload.inlineCss === "string" ? payload.inlineCss : "";

    if (typeof payload.title === "string" && payload.title.trim()) {
      document.title = payload.title;
    }

    setCurrentPage(page);
    window.tailwind?.refresh?.();
    enhanceForPage(page);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return;
    }

    window.location.href = fallbackUrl;
  }
}

function adminPathToUrl(page) {
  return `/${page}`;
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function resolveAdminPageFromLink(link) {
  const href = link.getAttribute("href") || "";

  if (!href) {
    return null;
  }

  try {
    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const page = getPageFromPath(url.pathname);
    if (!page) {
      return null;
    }

    return {
      page,
      url: `${url.pathname}${url.search}${url.hash}`
    };
  } catch {
    return null;
  }
}

function initAdminShell() {
  const host = getAdminShellHost();

  if (!host) {
    return;
  }

  const initialPage = currentPage() || getPageFromPath(window.location.pathname) || "admin-products.html";
  void loadAdminShellFragment(initialPage, adminPathToUrl(initialPage));

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !isPlainLeftClick(event)) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const resolved = resolveAdminPageFromLink(link);

    if (!resolved || normalizeText(resolved.page) === "admin-login.html") {
      return;
    }

    event.preventDefault();

    if (adminPathToUrl(resolved.page) !== window.location.pathname) {
      window.history.pushState({ page: resolved.page }, "", adminPathToUrl(resolved.page));
    }

    void loadAdminShellFragment(resolved.page, resolved.url);
  });

  window.addEventListener("popstate", () => {
    const page = getPageFromPath(window.location.pathname);

    if (!page) {
      return;
    }

    void loadAdminShellFragment(page, adminPathToUrl(page));
  });
}

function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

async function apiFetch(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init && init.headers ? init.headers : {})
    }
  });

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  let payload = null;
  let textPayload = "";

  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    textPayload = await response.text().catch(() => "");

    if (textPayload) {
      try {
        payload = JSON.parse(textPayload);
      } catch {
        payload = null;
      }
    }
  }

  if (!response.ok) {
    const compactText = textPayload.replace(/\s+/g, " ").trim();
    const message =
      (payload && payload.error) ||
      (payload && payload.message) ||
      compactText ||
      `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;

    if (payload && payload.code) {
      error.code = payload.code;
    }

    if (payload && payload.hint) {
      error.hint = payload.hint;
    }

    throw error;
  }

  return payload;
}

function isUnauthorizedError(error) {
  return Boolean(error && typeof error === "object" && error.status === 401);
}

function currentPagePath() {
  return `${window.location.pathname}${window.location.search}`;
}

function redirectToAdminLogin() {
  const next = encodeURIComponent(currentPagePath());
  window.location.href = `/admin-login.html?next=${next}`;
}

async function withAdminAuth(work) {
  try {
    return await work();
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    redirectToAdminLogin();
    return null;
  }
}

function setAdminLoginError(message) {
  const errorEl = document.querySelector("#login-error");

  if (!(errorEl instanceof HTMLElement)) {
    return;
  }

  errorEl.textContent = message || "\u00a0";
}

function wireAdminLoginPage() {
  const form =
    document.querySelector('form[data-ps-admin-login-form]') || document.querySelector("form");
  const emailInput =
    (form && form.querySelector('#email, input[name="email"], input[type="email"]')) ||
    document.querySelector('#email, input[name="email"], input[type="email"]');
  const passwordInput =
    (form && form.querySelector('#password, input[name="password"], input[type="password"]')) ||
    document.querySelector('#password, input[name="password"], input[type="password"]');
  const submitButton =
    (form &&
      (form.querySelector('button[data-ps-admin-login-submit]') ||
        form.querySelector('button[type="submit"]'))) ||
    document.querySelector('button[data-ps-admin-login-submit]') ||
    document.querySelector('button[type="submit"]');

  if (
    !(form instanceof HTMLFormElement) ||
    !(emailInput instanceof HTMLInputElement) ||
    !(passwordInput instanceof HTMLInputElement)
  ) {
    return;
  }

  const completeLogin = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setAdminLoginError("");

    try {
      await apiFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      const search = new URLSearchParams(window.location.search);
      const next = search.get("next");
      const destination = next && next.startsWith("/") ? next : "/admin-products.html";
      window.location.href = destination;
    } catch (error) {
      const message =
        error && typeof error === "object" && typeof error.message === "string"
          ? error.message
          : "Unable to sign in";
      setAdminLoginError(message);
    }
  };

  form.addEventListener("submit", completeLogin);

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.addEventListener("click", completeLogin);
  }
}

function enhanceTopNavLinks() {
  const candidates = document.querySelectorAll('a[href="#"]');

  candidates.forEach((link) => {
    const key = normalizeText(link.textContent);
    const destination = NAV_DESTINATIONS[key];

    if (destination) {
      link.setAttribute("href", destination);
    }
  });
}

function normalizePageNameForNavbar(page) {
  return normalizeText(page || currentPageName());
}

function isSharedStorefrontNavbarPage(page) {
  const normalizedPage = normalizePageNameForNavbar(page);

  if (!normalizedPage) {
    return false;
  }

  if (normalizedPage === "checkout.html") {
    return false;
  }

  return SHARED_STOREFRONT_NAVBAR_PAGES.has(normalizedPage);
}

function activeStorefrontNavKey(page) {
  const normalizedPage = normalizePageNameForNavbar(page);

  if (normalizedPage === "index.html") {
    return "home";
  }

  if (normalizedPage === "dogs.html") {
    return "dogs";
  }

  if (normalizedPage === "cats.html") {
    return "cats";
  }

  if (normalizedPage === "accessories.html") {
    return "accessories";
  }

  if (normalizedPage === "blog.html") {
    return "blog";
  }

  return "";
}

function injectSharedStorefrontNavbarStyle() {
  if (document.querySelector("#ps-storefront-navbar-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "ps-storefront-navbar-style";
  style.textContent = `
[data-ps-storefront-navbar="true"] {
  --ps-nav-bg: rgba(255, 255, 255, 0.9);
  --ps-nav-border: rgba(15, 23, 42, 0.08);
  --ps-nav-text: #1e293b;
  --ps-nav-muted: #475569;
  --ps-nav-active: #1d4ed8;
  --ps-nav-active-bg: rgba(29, 78, 216, 0.12);
  --ps-nav-cta: #1d4ed8;
  --ps-nav-cta-hover: #1e40af;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  background: var(--ps-nav-bg);
  border-bottom: 1px solid var(--ps-nav-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__brand {
  color: var(--ps-nav-active);
  text-decoration: none;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  transition: color 140ms ease;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__brand:hover,
[data-ps-storefront-navbar="true"] .ps-storefront-navbar__brand:focus-visible {
  color: var(--ps-nav-cta-hover);
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__links {
  display: none;
  align-items: center;
  gap: 8px;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__link {
  color: var(--ps-nav-muted);
  text-decoration: none;
  font-size: 0.95rem;
  line-height: 1.2;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 999px;
  transition: color 140ms ease, background-color 140ms ease;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__link:hover {
  color: var(--ps-nav-text);
  background: rgba(15, 23, 42, 0.06);
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__link[data-active="true"] {
  color: var(--ps-nav-active);
  background: var(--ps-nav-active-bg);
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__search {
  display: none;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  padding: 8px 12px;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__search input {
  background: transparent;
  border: none;
  outline: none;
  width: 130px;
  font-size: 0.875rem;
  color: var(--ps-nav-text);
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__icon-btn {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ps-nav-muted);
  cursor: pointer;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  text-decoration: none;
  color: #fff;
  background: var(--ps-nav-cta);
  padding: 10px 16px;
  font-size: 0.88rem;
  font-weight: 700;
  transition: background-color 140ms ease;
  white-space: nowrap;
}

[data-ps-storefront-navbar="true"] .ps-storefront-navbar__cta:hover {
  background: var(--ps-nav-cta-hover);
}

[data-ps-storefront-navbar="true"] [data-role="cart-count-pill"] {
  margin-left: 4px;
}

[data-ps-storefront-navbar-spacer="true"] {
  width: 100%;
}

@media (min-width: 860px) {
  [data-ps-storefront-navbar="true"] .ps-storefront-navbar__links {
    display: flex;
  }

  [data-ps-storefront-navbar="true"] .ps-storefront-navbar__search {
    display: inline-flex;
  }
}
`;

  document.head.appendChild(style);
}

function hideLegacyStorefrontTopNav() {
  if (!document.body) {
    return;
  }

  const topLevelBars = Array.from(document.body.children).filter((node) => {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    if (node.dataset.psStorefrontNavbar === "true") {
      return false;
    }

    const tagName = node.tagName.toLowerCase();
    if (tagName !== "nav" && tagName !== "header") {
      return false;
    }

    if (node.closest("main, footer")) {
      return false;
    }

    const classes = node.className || "";
    const style = getComputedStyle(node);
    const isFixedLike =
      style.position === "fixed" ||
      style.position === "sticky" ||
      /\bfixed\b|\bsticky\b|\btop-0\b|\bz-\d+\b/i.test(classes);

    return isFixedLike;
  });

  topLevelBars.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    node.dataset.psLegacyTopNavHidden = "true";
    node.style.display = "none";
  });
}

function buildSharedStorefrontNavbar() {
  const bar = document.createElement("header");
  bar.dataset.psStorefrontNavbar = "true";

  const activeKey = activeStorefrontNavKey(currentPageName());
  const linksMarkup = STOREFRONT_PRIMARY_NAV_LINKS.map((link) => {
    const active = activeKey === link.key;
    return `<a class="ps-storefront-navbar__link" data-ps-nav-key="${link.key}" data-active="${
      active ? "true" : "false"
    }" href="${link.href}">${link.label}</a>`;
  }).join("");

  bar.innerHTML = `
    <div class="ps-storefront-navbar__inner">
      <a class="ps-storefront-navbar__brand" href="/index.html">PetShop</a>
      <nav class="ps-storefront-navbar__links" aria-label="Primary storefront">
        ${linksMarkup}
      </nav>
      <div class="ps-storefront-navbar__actions">
        <label class="ps-storefront-navbar__search" aria-label="Search products">
          <span class="material-symbols-outlined" aria-hidden="true">search</span>
          <input type="text" placeholder="Search..." aria-label="Search" />
        </label>
        <button class="ps-storefront-navbar__icon-btn" type="button" aria-label="Go to cart">
          <span class="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
        </button>
        <button class="ps-storefront-navbar__icon-btn" type="button" aria-label="Go to profile">
          <span class="material-symbols-outlined" data-icon="person">person</span>
        </button>
        <a class="ps-storefront-navbar__cta" href="/dogs.html">Shop Now</a>
      </div>
    </div>
  `;

  return bar;
}

function updateSharedStorefrontNavbarActiveState(navbar) {
  if (!(navbar instanceof HTMLElement)) {
    return;
  }

  const activeKey = activeStorefrontNavKey(currentPageName());
  const links = navbar.querySelectorAll(".ps-storefront-navbar__link[data-ps-nav-key]");

  links.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    link.dataset.active = link.dataset.psNavKey === activeKey ? "true" : "false";
  });
}

function ensureStorefrontNavbarSpacer(navbar) {
  if (!(navbar instanceof HTMLElement)) {
    return;
  }

  let spacer = navbar.nextElementSibling;
  if (!(spacer instanceof HTMLElement) || spacer.dataset.psStorefrontNavbarSpacer !== "true") {
    spacer = document.createElement("div");
    spacer.dataset.psStorefrontNavbarSpacer = "true";
    navbar.insertAdjacentElement("afterend", spacer);
  }

  const syncHeight = () => {
    const navHeight = Math.ceil(navbar.getBoundingClientRect().height);
    spacer.style.height = `${Math.max(navHeight, 1)}px`;
  };

  syncHeight();

  if (navbar.dataset.psSpacerWired === "true") {
    return;
  }

  navbar.dataset.psSpacerWired = "true";
  window.addEventListener("resize", syncHeight);
}

function ensureSharedStorefrontNavbar() {
  if (isAdminPage() || !isSharedStorefrontNavbarPage(currentPageName())) {
    return;
  }

  injectSharedStorefrontNavbarStyle();
  hideLegacyStorefrontTopNav();

  const existing = document.querySelector('[data-ps-storefront-navbar="true"]');
  if (existing instanceof HTMLElement) {
    updateSharedStorefrontNavbarActiveState(existing);
    ensureStorefrontNavbarSpacer(existing);
    return;
  }

  const navbar = buildSharedStorefrontNavbar();
  document.body.insertAdjacentElement("afterbegin", navbar);
  updateSharedStorefrontNavbarActiveState(navbar);
  ensureStorefrontNavbarSpacer(navbar);
}

function wireIndexPrimaryCtas() {
  if (currentPage() !== "index.html") {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("button"));

  buttons.forEach((button) => {
    const label = normalizeText(button.textContent);

    if (label === "shop now" || label === "browse categories") {
      button.addEventListener("click", () => {
        window.location.href = "/dogs.html";
      });
    }
  });
}

function wireCartCheckoutButton() {
  if (currentPage() !== "cart.html") {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("button"));
  const checkoutButton = buttons.find(
    (button) => normalizeText(button.textContent) === "proceed to checkout"
  );

  if (!checkoutButton) {
    return;
  }

  checkoutButton.addEventListener("click", () => {
    window.location.href = "/checkout.html";
  });
}

function collectCartIconTargets() {
  const targets = [];
  const seen = new Set();

  const addTarget = (clickTarget, icon) => {
    if (!(clickTarget instanceof HTMLElement) || !(icon instanceof HTMLElement)) {
      return;
    }

    if (seen.has(clickTarget)) {
      return;
    }

    seen.add(clickTarget);
    targets.push({ clickTarget, icon });
  };

  const iconByDataAttr = document.querySelectorAll(
    'span.material-symbols-outlined[data-icon="shopping_cart"]'
  );

  iconByDataAttr.forEach((icon) => {
    const clickTarget = icon.closest("button, a") || icon;
    addTarget(clickTarget, icon);
  });

  const buttonIcons = document.querySelectorAll("button.material-symbols-outlined");
  buttonIcons.forEach((button) => {
    if (normalizeText(button.textContent) === "shopping_cart") {
      addTarget(button, button);
    }
  });

  const iconSpans = document.querySelectorAll("span.material-symbols-outlined");
  iconSpans.forEach((icon) => {
    if (normalizeText(icon.textContent) !== "shopping_cart") {
      return;
    }

    const clickTarget = icon.closest("button, a") || icon;
    addTarget(clickTarget, icon);
  });

  const cartLinks = document.querySelectorAll('a[href="cart.html"], a[href="/cart.html"]');
  cartLinks.forEach((link) => {
    addTarget(link, link);
  });

  return targets;
}

function collectProfileIconTargets() {
  const targets = [];
  const seen = new Set();

  const addTarget = (clickTarget) => {
    if (!(clickTarget instanceof HTMLElement)) {
      return;
    }

    if (seen.has(clickTarget)) {
      return;
    }

    seen.add(clickTarget);
    targets.push(clickTarget);
  };

  const iconByDataAttr = document.querySelectorAll(
    'span.material-symbols-outlined[data-icon="person"]'
  );

  iconByDataAttr.forEach((icon) => {
    const clickTarget = icon.closest("button, a") || icon;
    addTarget(clickTarget);
  });

  const iconSpans = document.querySelectorAll("span.material-symbols-outlined");
  iconSpans.forEach((icon) => {
    if (normalizeText(icon.textContent) !== "person") {
      return;
    }

    const clickTarget = icon.closest("button, a") || icon;
    addTarget(clickTarget);
  });

  const profileLinks = document.querySelectorAll('a[href="profile.html"], a[href="/profile.html"]');
  profileLinks.forEach((link) => {
    addTarget(link);
  });

  return targets;
}

function wireCartIcon() {
  if (isAdminPage()) {
    return;
  }

  const targets = collectCartIconTargets();

  targets.forEach(({ clickTarget }) => {
    if (clickTarget.tagName.toLowerCase() === "a") {
      return;
    }

    if (clickTarget.dataset.cartNavWired === "true") {
      return;
    }

    clickTarget.dataset.cartNavWired = "true";
    clickTarget.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/cart.html";
    });
  });
}

function wireProfileIcon() {
  if (isAdminPage()) {
    return;
  }

  const targets = collectProfileIconTargets();

  targets.forEach((clickTarget) => {
    if (clickTarget.tagName.toLowerCase() === "a") {
      return;
    }

    if (clickTarget.dataset.profileNavWired === "true") {
      return;
    }

    clickTarget.dataset.profileNavWired = "true";
    clickTarget.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/profile.html";
    });
  });
}

function setCartCount(count) {
  const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;
  const targets = collectCartIconTargets();

  targets.forEach(({ clickTarget, icon }) => {
    let pill = null;

    if (icon.nextElementSibling instanceof HTMLElement) {
      const candidate = icon.nextElementSibling;
      if (candidate.dataset.role === "cart-count-pill") {
        pill = candidate;
      }
    }

    if (!(pill instanceof HTMLElement) && icon.parentElement) {
      pill = icon.parentElement.querySelector('[data-role="cart-count-pill"]');
    }

    if (!(pill instanceof HTMLElement)) {
      pill = clickTarget.querySelector('[data-role="cart-count-pill"]');
    }

    if (!(pill instanceof HTMLElement)) {
      pill = document.createElement("span");
      pill.dataset.role = "cart-count-pill";
      pill.className =
        "text-xs font-bold ml-1 rounded-full bg-secondary-container text-white px-2 py-1 inline-flex items-center justify-center";
      icon.insertAdjacentElement("afterend", pill);
    }

    if (safeCount <= 0) {
      pill.textContent = "";
      pill.style.display = "none";
      return;
    }

    pill.textContent = String(safeCount);
    pill.style.display = "inline-flex";
  });
}

async function hydrateCartIconCount() {
  try {
    const cart = await apiFetch("/api/cart");
    const itemCount = cart && typeof cart.itemCount === "number" ? cart.itemCount : 0;
    setCartCount(itemCount);
  } catch (error) {
    console.warn("Unable to hydrate cart count", error);
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function flashAddToCartIcon(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const icon = button.querySelector(".material-symbols-outlined, .material-icons");

  if (!(icon instanceof HTMLElement)) {
    return;
  }

  const original = icon.textContent;
  icon.textContent = "check";
  await wait(800);
  icon.textContent = original;
}

async function flashButtonAdded(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const originalHtml = button.innerHTML;
  button.innerHTML = "Added!";
  await wait(800);
  button.innerHTML = originalHtml;
}

function resolveProductIdFromTitle(title) {
  const normalized = normalizeText(title);
  return PRODUCT_ID_BY_NAME[normalized] || null;
}

function buildProductDetailUrl(productData) {
  const params = new URLSearchParams();

  if (productData && productData.productId) {
    params.set("productId", String(productData.productId));
  }

  if (productData && productData.title) {
    params.set("title", String(productData.title));
  }

  if (productData && productData.price) {
    params.set("price", String(productData.price));
  }

  if (productData && productData.image) {
    params.set("image", String(productData.image));
  }

  if (productData && productData.category) {
    params.set("category", String(productData.category));
  }

  const query = params.toString();
  return query ? `/product-detail.html?${query}` : "/product-detail.html";
}

function inferStorefrontCategory(page) {
  if (page === "dogs.html") {
    return "dogs";
  }

  if (page === "cats.html") {
    return "cats";
  }

  if (page === "accessories.html") {
    return "accessories";
  }

  if (page === "deals.html") {
    return "deals";
  }

  return "dogs";
}

function resolveStorefrontPriceFromCard(card) {
  const valueSelectors = [
    ".price-row strong",
    ".price-row span",
    "[class*='text-2xl']",
    "[class*='text-3xl']",
    "strong",
    "p",
    "span"
  ];

  for (const selector of valueSelectors) {
    const candidates = Array.from(card.querySelectorAll(selector));

    for (const candidate of candidates) {
      const raw = (candidate.textContent || "").trim();
      if (/\$\s*\d/.test(raw)) {
        return raw.replace(/\s+/g, " ");
      }
    }
  }

  return "";
}

function resolveStorefrontProductDataFromCard(card, page) {
  const titleEl = card.querySelector("h4, h3, h2");
  const imageEl = card.querySelector("img");
  const title = (titleEl && titleEl.textContent ? titleEl.textContent : "").trim();
  const price = resolveStorefrontPriceFromCard(card);
  const image = imageEl instanceof HTMLImageElement ? (imageEl.getAttribute("src") || "").trim() : "";
  const normalizedTitle = normalizeText(title);
  const productId =
    HOMEPAGE_CARD_PRODUCT_ID_BY_NAME[normalizedTitle] ||
    PRODUCT_ID_BY_NAME[normalizedTitle] ||
    HOMEPAGE_PRODUCT_ALIAS_BY_NAME[normalizedTitle] ||
    STOREFRONT_PRODUCT_ALIAS_BY_NAME[normalizedTitle] ||
    null;

  return {
    productId,
    title,
    price,
    image,
    category: inferStorefrontCategory(page)
  };
}

function shouldIgnoreStorefrontCardInteraction(event, card) {
  if (!event || event.defaultPrevented) {
    return true;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  const interactive = target.closest(STOREFRONT_INTERACTIVE_DESCENDANT_SELECTOR);
  return Boolean(interactive && card.contains(interactive));
}

function applyProductDetailLinksWithinCard(card, detailUrl) {
  const links = Array.from(card.querySelectorAll('a[href]')).filter((link) => {
    const href = normalizeLinkHref(link);
    return href.endsWith("product-detail.html");
  });

  links.forEach((link) => {
    link.setAttribute("href", detailUrl);
  });
}

function wireStorefrontProductClickthrough() {
  const page = currentPage();
  const selectors = STOREFRONT_CARD_SELECTORS_BY_PAGE[page];

  if (!Array.isArray(selectors) || selectors.length === 0) {
    return;
  }

  const cards = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  const uniqueCards = Array.from(new Set(cards)).filter((card) => card instanceof HTMLElement);

  uniqueCards.forEach((card) => {
    if (!(card instanceof HTMLElement) || card.dataset.psProductCardClickWired === "true") {
      return;
    }

    const productData = resolveStorefrontProductDataFromCard(card, page);
    if (!productData.title || !productData.price || !productData.image) {
      return;
    }

    const detailUrl = buildProductDetailUrl(productData);
    applyProductDetailLinksWithinCard(card, detailUrl);

    card.dataset.psProductCardClickWired = "true";
    card.dataset.psProductDetailUrl = detailUrl;
    card.setAttribute("tabindex", card.getAttribute("tabindex") || "0");
    card.setAttribute("role", "link");
    card.style.cursor = "pointer";

    card.addEventListener("click", (event) => {
      if (shouldIgnoreStorefrontCardInteraction(event, card)) {
        return;
      }

      window.location.href = detailUrl;
    });

    card.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key !== "Enter" && key !== " ") {
        return;
      }

      if (shouldIgnoreStorefrontCardInteraction(event, card)) {
        return;
      }

      event.preventDefault();
      window.location.href = detailUrl;
    });
  });
}

function detailPriceFromValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return toCurrency(value);
  }

  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text.includes("$") ? text : `$${text}`;
}

function normalizeUrlList(values) {
  const seen = new Set();
  const normalized = [];

  values.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }

    const trimmed = value.trim();

    if (!trimmed || seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  });

  return normalized;
}

async function hydrateProductDetailPage() {
  if (currentPage() !== "product-detail.html") {
    return;
  }

  const search = new URLSearchParams(window.location.search);
  const queryProductId = (search.get("productId") || "").trim();
  const queryTitle = (search.get("title") || "").trim();
  const queryPrice = (search.get("price") || "").trim();
  const queryImage = (search.get("image") || "").trim();
  const queryCategory = (search.get("category") || "").trim();

  const fallbackData = {
    productId: queryProductId || null,
    title: queryTitle,
    price: queryPrice,
    image: queryImage,
    category: queryCategory,
    images: null
  };

  let resolvedData = { ...fallbackData };

  if (queryProductId) {
    try {
      const payload = await apiFetch(`/api/products/${encodeURIComponent(queryProductId)}`);
      const product = payload && payload.product;

      if (product && typeof product === "object") {
        const orderedImages = Array.isArray(product.images)
          ? product.images
              .filter((image) => {
                if (typeof image === "string") {
                  return image.trim();
                }

                return (
                  image &&
                  typeof image === "object" &&
                  typeof image.url === "string" &&
                  image.url.trim()
                );
              })
              .map((image, index) => {
                if (typeof image === "string") {
                  return {
                    url: image.trim(),
                    alt: "",
                    sortOrder: index
                  };
                }

                return {
                  url: image.url.trim(),
                  alt:
                    typeof image.alt === "string" && image.alt.trim()
                      ? image.alt.trim()
                      : "",
                  sortOrder:
                    typeof image.sortOrder === "number" && Number.isFinite(image.sortOrder)
                      ? image.sortOrder
                      : index
                };
              })
              .sort((left, right) => left.sortOrder - right.sortOrder)
          : [];

        resolvedData = {
          productId: queryProductId,
          title:
            typeof product.name === "string" && product.name.trim()
              ? product.name.trim()
              : fallbackData.title,
          price:
            typeof product.price === "number" && Number.isFinite(product.price)
              ? toCurrency(product.price)
              : fallbackData.price,
          image:
            typeof product.image === "string" && product.image.trim()
              ? product.image.trim()
              : fallbackData.image,
          category:
            typeof product.category === "string" && product.category.trim()
              ? product.category.trim()
              : fallbackData.category,
          images: orderedImages.length > 0 ? orderedImages : null
        };
      }
    } catch (error) {
      console.warn("Unable to hydrate product detail from API", error);
    }
  }

  const titleEl = document.querySelector("main h1");
  const priceEl = document.querySelector("main h1 + div span");
  const heroImageEl =
    document.querySelector('main img[alt="Main product"]') ||
    document.querySelector("main .aspect-square img") ||
    document.querySelector("main img");

  if (titleEl && resolvedData.title) {
    titleEl.textContent = resolvedData.title;
    document.title = resolvedData.title;
  }

  const displayPrice = detailPriceFromValue(resolvedData.price);
  if (priceEl && displayPrice) {
    priceEl.textContent = displayPrice;
  }

  const detailImages = Array.isArray(resolvedData.images) ? resolvedData.images : null;
  const hasDetailImages = Boolean(detailImages && detailImages.length > 0);

  if (heroImageEl instanceof HTMLImageElement && hasDetailImages) {
    const heroContainer = heroImageEl.closest("div");
    let thumbnailStrip = null;

    if (
      heroContainer instanceof HTMLElement &&
      heroContainer.previousElementSibling instanceof HTMLElement &&
      heroContainer.previousElementSibling.querySelector("img")
    ) {
      thumbnailStrip = heroContainer.previousElementSibling;
    }

    if (!(thumbnailStrip instanceof HTMLElement)) {
      const thumbnailImage = document.querySelector('main img[alt*="thumbnail" i]');
      if (thumbnailImage instanceof HTMLImageElement) {
        const thumbnailCard = thumbnailImage.parentElement;
        if (thumbnailCard instanceof HTMLElement && thumbnailCard.parentElement instanceof HTMLElement) {
          thumbnailStrip = thumbnailCard.parentElement;
        }
      }
    }

    const activeClasses = ["ring-2", "ring-primary", "ring-offset-2"];

    const setHeroFromImage = (image) => {
      heroImageEl.src = image.url;
      heroImageEl.alt = image.alt || resolvedData.title || heroImageEl.alt;
    };

    setHeroFromImage(detailImages[0]);

    if (thumbnailStrip instanceof HTMLElement) {
      const firstThumbnail = thumbnailStrip.firstElementChild;
      const thumbnailClassName =
        firstThumbnail instanceof HTMLElement
          ? firstThumbnail.className
          : "w-20 h-20 rounded-xl bg-surface-container-high overflow-hidden cursor-pointer hover:opacity-80 transition-opacity";

      thumbnailStrip.innerHTML = "";

      const thumbnailNodes = detailImages.map((image, index) => {
        const thumb = document.createElement("div");
        thumb.className = thumbnailClassName;
        thumb.style.cursor = "pointer";

        const thumbImage = document.createElement("img");
        thumbImage.className = "w-full h-full object-cover";
        thumbImage.src = image.url;
        thumbImage.alt = image.alt || `Product thumbnail ${index + 1}`;

        thumb.appendChild(thumbImage);
        thumbnailStrip.appendChild(thumb);
        return thumb;
      });

      const setActiveThumbnail = (activeIndex) => {
        thumbnailNodes.forEach((thumb, index) => {
          activeClasses.forEach((className) => {
            thumb.classList.toggle(className, index === activeIndex);
          });
        });

        setHeroFromImage(detailImages[activeIndex]);
      };

      thumbnailNodes.forEach((thumb, index) => {
        thumb.addEventListener("click", () => {
          setActiveThumbnail(index);
        });
      });

      setActiveThumbnail(0);
    }
  }

  if (heroImageEl instanceof HTMLImageElement && resolvedData.image && !hasDetailImages) {
    heroImageEl.src = resolvedData.image;
    if (resolvedData.title) {
      heroImageEl.alt = resolvedData.title;
    }
  }
}

async function addToCart(productId, quantity) {
  return apiFetch("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity })
  });
}

async function fetchProductNameToIdMap(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";

  try {
    const payload = await apiFetch(`/api/products${query}`);
    const products = payload && Array.isArray(payload.products) ? payload.products : [];
    const byName = new Map();

    products.forEach((product) => {
      if (!product || typeof product !== "object") {
        return;
      }

      if (typeof product.name !== "string" || typeof product.id !== "string") {
        return;
      }

      byName.set(normalizeText(product.name), product.id);
    });

    return byName;
  } catch (error) {
    console.warn("Unable to fetch products for name lookup", error);
    return new Map();
  }
}

async function wireDogsAddToCart() {
  const cards = document.querySelectorAll("main .group.bg-surface-container-lowest");
  const productIdsByName = await fetchProductNameToIdMap("dogs");

  cards.forEach((card) => {
    const title = card.querySelector("h4");
    const buttons = Array.from(card.querySelectorAll("button"));
    const button = buttons.find((candidate) => {
      const icon = candidate.querySelector(".material-symbols-outlined, .material-icons");
      return icon && normalizeText(icon.textContent) === "add_shopping_cart";
    });

    if (!title || !button) {
      return;
    }

    const normalizedTitle = normalizeText(title.textContent);
    const productId = productIdsByName.get(normalizedTitle) || PRODUCT_ID_BY_NAME[normalizedTitle] || null;

    if (!productId) {
      return;
    }

    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const cart = await addToCart(productId, 1);
        setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
        void flashAddToCartIcon(button);
        button.classList.add("ring-2", "ring-primary");
        setTimeout(() => button.classList.remove("ring-2", "ring-primary"), 600);
      } catch (error) {
        console.error(error);
        alert((error && error.message) || "Unable to add to cart");
      }
    });
  });
}

function isIndexAddToCartButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }

  const icons = Array.from(button.querySelectorAll(".material-symbols-outlined, .material-icons"));

  return icons.some((icon) => {
    const iconName = normalizeText(icon.textContent);
    return iconName === "shopping_bag" || iconName === "add_shopping_cart";
  });
}

function nearestCardTitle(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return "";
  }

  const main = button.closest("main");
  let current = button;

  while (current) {
    const headings = Array.from(current.querySelectorAll("h3, h4"));
    const titleHeading = headings.find((heading) => {
      const text = normalizeText(heading.textContent);
      return Boolean(text) && !INDEX_HEADING_EXCLUSIONS.has(text);
    });

    if (titleHeading) {
      return titleHeading.textContent || "";
    }

    if (main && current === main) {
      break;
    }

    current = current.parentElement;
  }

  return "";
}

function sectionHeadingTextForButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return "";
  }

  const section = button.closest("section");
  if (!section) {
    return "";
  }

  const heading = section.querySelector("h2");
  return heading ? normalizeText(heading.textContent) : "";
}

function indexInMatchingButtons(button, matcher) {
  const section = button.closest("section");
  if (!section) {
    return -1;
  }

  const matches = Array.from(section.querySelectorAll("button")).filter(matcher);
  return matches.indexOf(button);
}

function resolveIndexFallbackProductId(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return null;
  }

  const sectionHeading = sectionHeadingTextForButton(button);

  if (sectionHeading === "flash sale") {
    const iconName = normalizeText(
      (button.querySelector(".material-symbols-outlined, .material-icons") || {}).textContent
    );

    if (iconName === "shopping_bag") {
      const index = indexInMatchingButtons(button, (candidate) => {
        if (!(candidate instanceof HTMLButtonElement)) {
          return false;
        }

        const candidateIconName = normalizeText(
          (candidate.querySelector(".material-symbols-outlined, .material-icons") || {}).textContent
        );

        return candidateIconName === "shopping_bag";
      });

      if (index >= 0 && index < FLASH_SALE_FALLBACK_BY_INDEX.length) {
        return FLASH_SALE_FALLBACK_BY_INDEX[index];
      }
    }
  }

  if (sectionHeading === "best sellers") {
    const text = normalizeText(button.textContent);
    const iconName = normalizeText(
      (button.querySelector(".material-symbols-outlined, .material-icons") || {}).textContent
    );

    if (text.includes("add to cart") && iconName === "add_shopping_cart") {
      const index = indexInMatchingButtons(button, (candidate) => {
        if (!(candidate instanceof HTMLButtonElement)) {
          return false;
        }

        const candidateText = normalizeText(candidate.textContent);
        const candidateIconName = normalizeText(
          (candidate.querySelector(".material-symbols-outlined, .material-icons") || {}).textContent
        );

        return candidateText.includes("add to cart") && candidateIconName === "add_shopping_cart";
      });

      if (index >= 0 && index < BEST_SELLERS_FALLBACK_BY_INDEX.length) {
        return BEST_SELLERS_FALLBACK_BY_INDEX[index];
      }
    }
  }

  return null;
}

function isIconOnlyAddButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }

  const text = normalizeText(button.textContent);
  return text === "shopping_bag" || text === "add_shopping_cart";
}

async function wireIndexAddToCart() {
  if (currentPage() !== "index.html") {
    return;
  }

  const productIdsByName = await fetchProductNameToIdMap();

  const flashSaleProductIds = [
    "deals-bed-velvet",
    "dogs-bone-indestructible",
    "cats-ocean-grain",
    "accessories-collar-tan"
  ];
  const bestSellersProductIds = [
    "dogs-harness-leather",
    "accessories-collar-tan",
    "cats-ocean-grain",
    "accessories-collar-tan"
  ];

  const bindIndexButton = (button, productId) => {
    if (!(button instanceof HTMLButtonElement) || !productId) {
      return;
    }

    if (button.dataset.indexAddToCartWired === "true") {
      return;
    }

    button.dataset.indexAddToCartWired = "true";
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const cart = await addToCart(productId, 1);
        const itemCount = cart && typeof cart.itemCount === "number" ? cart.itemCount : 0;
        setCartCount(itemCount);

        if (isIconOnlyAddButton(button)) {
          void flashAddToCartIcon(button);
        } else {
          void flashButtonAdded(button);
        }
      } catch (error) {
        const message =
          error && typeof error === "object" && typeof error.message === "string"
            ? error.message
            : "Unable to add to cart";
        alert(message);
      }
    });
  };

  const sectionByHeading = (headingText) => {
    const sections = Array.from(document.querySelectorAll("main section"));
    return (
      sections.find((section) => {
        const heading = section.querySelector("h2");
        return normalizeText(heading ? heading.textContent : "") === normalizeText(headingText);
      }) || null
    );
  };

  const iconNameForButton = (button) =>
    normalizeText((button.querySelector(".material-symbols-outlined, .material-icons") || {}).textContent);

  const flashSaleSection = sectionByHeading("Flash Sale");
  const bestSellersSection = sectionByHeading("Best Sellers");

  const flashSaleButtons = flashSaleSection
    ? Array.from(flashSaleSection.querySelectorAll("button")).filter((button) => {
        if (!(button instanceof HTMLButtonElement)) {
          return false;
        }

        return iconNameForButton(button) === "shopping_bag";
      })
    : [];

  const bestSellersButtons = bestSellersSection
    ? Array.from(bestSellersSection.querySelectorAll("button")).filter((button) => {
        if (!(button instanceof HTMLButtonElement)) {
          return false;
        }

        const text = normalizeText(button.textContent);
        return iconNameForButton(button) === "add_shopping_cart" && text.includes("add to cart");
      })
    : [];

  flashSaleProductIds.forEach((productId, index) => {
    bindIndexButton(flashSaleButtons[index], productId);
  });

  bestSellersProductIds.forEach((productId, index) => {
    bindIndexButton(bestSellersButtons[index], productId);
  });

  const candidateButtons = Array.from(document.querySelectorAll("main button")).filter(
    isIndexAddToCartButton
  );

  candidateButtons.forEach((button) => {
    const title = nearestCardTitle(button);
    const normalizedTitle = normalizeText(title);
    const resolvedProductId =
      HOMEPAGE_CARD_PRODUCT_ID_BY_NAME[normalizedTitle] ||
      productIdsByName.get(normalizedTitle) ||
      PRODUCT_ID_BY_NAME[normalizedTitle] ||
      HOMEPAGE_PRODUCT_ALIAS_BY_NAME[normalizedTitle] ||
      resolveIndexFallbackProductId(button) ||
      "dogs-kibble-premium";

    bindIndexButton(button, resolvedProductId);
  });
}

function getProductDetailQuantity() {
  const quantityRoot = document.querySelector("main .w-32");

  if (!quantityRoot) {
    return 1;
  }

  const valueEl = Array.from(quantityRoot.querySelectorAll("span")).find(
    (span) => !span.closest("button")
  );
  const quantity = Number(valueEl ? valueEl.textContent : 1);

  return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
}

async function wireProductDetailCtas() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const addButton = buttons.find(
    (button) => normalizeText(button.textContent).includes("add to cart")
  );
  const buyNowButton = buttons.find(
    (button) => normalizeText(button.textContent).includes("buy it now")
  );

  const heading = document.querySelector("main h1");
  const search = new URLSearchParams(window.location.search);
  const queryProductId = (search.get("productId") || "").trim();
  let productId = queryProductId || null;

  if (!productId) {
    const headingText = heading ? heading.textContent : "";
    const normalizedHeading = normalizeText(headingText);

    if (normalizedHeading) {
      const productIdsByName = await fetchProductNameToIdMap();
      productId = productIdsByName.get(normalizedHeading) || resolveProductIdFromTitle(headingText);
    }
  }

  if (!productId) {
    console.warn("Unable to resolve product detail productId", {
      heading: heading ? heading.textContent : null,
      search: window.location.search
    });
    return;
  }

  if (addButton) {
    addButton.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const cart = await addToCart(productId, getProductDetailQuantity());
        setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
        await flashButtonAdded(addButton);
      } catch (error) {
        console.error(error);
        alert((error && error.message) || "Unable to add to cart");
      }
    });
  }

  if (buyNowButton) {
    buyNowButton.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const cart = await addToCart(productId, getProductDetailQuantity());
        setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
        await flashButtonAdded(buyNowButton);
        window.location.href = "/checkout.html";
      } catch (error) {
        console.error(error);
        alert((error && error.message) || "Unable to add to cart");
      }
    });
  }
}

function cartItemMarkup(item) {
  return `
    <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row gap-6 ambient-shadow transition-transform hover:scale-[1.01]" data-product-id="${item.productId}" data-cart-item="true">
      <div class="w-full sm:w-40 h-40 rounded-lg overflow-hidden flex-shrink-0">
        <img class="w-full h-full object-cover" src="${item.image}" alt="${item.name}" />
      </div>
      <div class="flex-grow flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-on-surface leading-tight">${item.name}</h3>
            <p class="text-sm text-on-surface-variant mt-1">MVP catalog item</p>
          </div>
          <span class="text-xl font-bold text-primary">${toCurrency(item.lineTotal)}</span>
        </div>
        <div class="flex items-center justify-between mt-6 gap-4">
          <div class="flex items-center bg-surface-container-low rounded-full px-2 py-1">
            <button data-action="decrement" data-product-id="${item.productId}" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-sm">remove</span>
            </button>
            <span class="px-4 font-semibold" data-role="qty">${item.quantity}</span>
            <button data-action="increment" data-product-id="${item.productId}" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors">
              <span class="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
          <button data-action="remove" data-product-id="${item.productId}" class="text-sm font-medium text-error hover:opacity-70 transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">delete</span> Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

function updateCartSummary(cart) {
  const summaryCard = document.querySelector(".lg\\:col-span-4 .bg-surface-container-lowest");

  if (!summaryCard) {
    return;
  }

  const rows = summaryCard.querySelectorAll(".space-y-4 > div");
  if (rows[0]) {
    const value = rows[0].querySelector("span:last-child");
    if (value) {
      value.textContent = toCurrency(cart.subtotal);
    }
  }

  if (rows[2]) {
    const value = rows[2].querySelector("span:last-child");
    if (value) {
      value.textContent = toCurrency(cart.tax);
    }
  }

  const totalRow = summaryCard.querySelector(".pt-4.border-t");
  if (totalRow) {
    const value = totalRow.querySelector("span:last-child");
    if (value) {
      value.textContent = toCurrency(cart.total);
    }
  }
}

function renderCartItems(cart) {
  const itemsHost = document.querySelector(".lg\\:col-span-8 .space-y-6");

  if (!itemsHost) {
    return;
  }

  if (cart.items.length === 0) {
    itemsHost.innerHTML =
      '<div class="bg-surface-container-lowest rounded-lg p-6 ambient-shadow"><p class="text-on-surface-variant">Your cart is empty.</p></div>';
    return;
  }

  itemsHost.innerHTML = cart.items.map(cartItemMarkup).join("");
}

async function hydrateCartPage() {
  try {
    const cart = await apiFetch("/api/cart");
    setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
    renderCartItems(cart);
    updateCartSummary(cart);
    wireCartItemActions();
  } catch (error) {
    console.error(error);
  }
}

function wireCartItemActions() {
  const itemsHost = document.querySelector(".lg\\:col-span-8 .space-y-6");

  if (!itemsHost) {
    return;
  }

  itemsHost.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("button[data-action]");

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const productId = button.dataset.productId;
    const action = button.dataset.action;

    if (!productId || !action) {
      return;
    }

    const itemRoot = button.closest('[data-cart-item="true"]');
    const qtyEl = itemRoot ? itemRoot.querySelector('[data-role="qty"]') : null;
    const currentQty = Number(qtyEl ? qtyEl.textContent : 1) || 1;

    try {
      let cart;

      if (action === "increment") {
        cart = await apiFetch(`/api/cart/items/${productId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: currentQty + 1 })
        });
      } else if (action === "decrement") {
        cart = await apiFetch(`/api/cart/items/${productId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: Math.max(currentQty - 1, 0) })
        });
      } else {
        cart = await apiFetch(`/api/cart/items/${productId}`, {
          method: "DELETE"
        });
      }

      setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
      renderCartItems(cart);
      updateCartSummary(cart);
    } catch (error) {
      console.error(error);
    }
  });
}

function wirePlaceOrder() {
  if (currentPage() !== "checkout.html") {
    return;
  }

  const buttons = Array.from(document.querySelectorAll("button"));
  const placeOrderButton = buttons.find(
    (button) => normalizeText(button.textContent) === "place order"
  );

  if (!placeOrderButton) {
    return;
  }

  const ensureCheckoutErrorEl = () => {
    const existing = document.querySelector("#checkout-error");

    if (existing instanceof HTMLElement) {
      return existing;
    }

    const errorEl = document.createElement("p");
    errorEl.id = "checkout-error";
    errorEl.className = "text-sm text-error mt-3";
    placeOrderButton.insertAdjacentElement("afterend", errorEl);
    return errorEl;
  };

  const setCheckoutError = (message) => {
    const errorEl = ensureCheckoutErrorEl();
    errorEl.textContent = message || "";
  };

  placeOrderButton.addEventListener("click", async (event) => {
    event.preventDefault();
    setCheckoutError("");

    try {
      const payload = collectCheckoutOrderPayload();
      const order = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!order || typeof order.orderNumber !== "string") {
        throw new Error("Unable to create order");
      }

      await apiFetch("/api/payments/stub/charge", {
        method: "POST",
        body: JSON.stringify({ orderNumber: order.orderNumber })
      });

      window.location.href = "/profile.html";
    } catch (error) {
      const message =
        error && typeof error === "object" && typeof error.message === "string"
          ? error.message
          : "Payment failed";

      setCheckoutError(message);
      console.error(error);
    }
  });
}

function findInputByPlaceholder(placeholder) {
  const target = normalizeText(placeholder);
  const candidates = Array.from(document.querySelectorAll("input[placeholder]"));
  return (
    candidates.find((input) => normalizeText(input.getAttribute("placeholder")) === target) || null
  );
}

function selectedDeliveryMethod() {
  const selected = document.querySelector('input[name="delivery"]:checked');

  if (!(selected instanceof HTMLInputElement)) {
    return null;
  }

  const wrapper = selected.closest("label");
  if (!wrapper) {
    return null;
  }

  const optionLabel = wrapper.querySelector("span.font-bold");
  return optionLabel ? optionLabel.textContent.trim() : null;
}

function collectCheckoutOrderPayload() {
  const customerNameInput = findInputByPlaceholder("John Doe");
  const addressLine1Input = findInputByPlaceholder("123 Puppy Lane");
  const cityInput = findInputByPlaceholder("San Francisco");
  const postalCodeInput = findInputByPlaceholder("94103");

  return {
    customerName: customerNameInput ? customerNameInput.value.trim() : "",
    addressLine1: addressLine1Input ? addressLine1Input.value.trim() : "",
    city: cityInput ? cityInput.value.trim() : "",
    postalCode: postalCodeInput ? postalCodeInput.value.trim() : "",
    deliveryMethod: selectedDeliveryMethod() || ""
  };
}

async function hydrateProfileOrders() {
  try {
    const payload = await apiFetch("/api/orders");
    const orders = Array.isArray(payload.orders) ? payload.orders : [];

    if (orders.length === 0) {
      return;
    }

    const latest = orders[0];
    const orderLabel = `Order #${latest.orderNumber}`;

    const recentOrderEl = Array.from(document.querySelectorAll("p, span")).find((el) =>
      normalizeText(el.textContent).startsWith("order #")
    );

    if (recentOrderEl) {
      recentOrderEl.textContent = orderLabel;
      return;
    }

    const hero = document.querySelector("header.mb-12");
    if (hero) {
      const badge = document.createElement("p");
      badge.className = "text-sm font-bold mt-3";
      badge.textContent = `Latest order: ${latest.orderNumber}`;
      hero.appendChild(badge);
    }
  } catch (error) {
    console.error(error);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAdminOrderDate(isoDate) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function statusTone(status) {
  const normalized = normalizeText(status).toUpperCase();

  if (normalized === "PENDING") {
    return {
      badge: "bg-secondary-fixed text-on-secondary-fixed-variant",
      dot: "bg-secondary-container"
    };
  }

  if (normalized === "SHIPPED") {
    return {
      badge: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      dot: "bg-tertiary"
    };
  }

  if (normalized === "CANCELLED") {
    return {
      badge: "bg-error-container text-on-error-container",
      dot: "bg-error"
    };
  }

  return {
    badge: "bg-primary-fixed text-on-primary-fixed-variant",
    dot: "bg-primary"
  };
}

function initials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "--";
  }

  return words.map((word) => word[0].toUpperCase()).join("");
}

function selectAdminTableBody(pageSpecificSelector) {
  const candidate =
    document.querySelector('tbody[data-ps-admin-table-body="true"]') ||
    (pageSpecificSelector ? document.querySelector(pageSpecificSelector) : null) ||
    document.querySelector("table tbody");

  return candidate instanceof HTMLTableSectionElement ? candidate : null;
}

function selectAdminSearchInput(pageSpecificSelector, fallbackPlaceholder) {
  const candidate =
    document.querySelector('input[data-ps-admin-search="true"]') ||
    (pageSpecificSelector ? document.querySelector(pageSpecificSelector) : null) ||
    (fallbackPlaceholder
      ? document.querySelector(`input[placeholder="${fallbackPlaceholder}"]`)
      : null);

  return candidate instanceof HTMLInputElement ? candidate : null;
}

function toAdminOrderRow(order) {
  const name = escapeHtml(order.customerName || "Guest");
  const email = escapeHtml(order.customerEmail || "-");
  const tone = statusTone(order.status);
  const orderId = escapeHtml(order.orderNumber);
  const amount = toCurrency(order.amount);
  const dateLabel = formatAdminOrderDate(order.createdAt);

  return `
    <tr class="hover:bg-surface-container-low/30 transition-colors">
      <td class="px-6 py-4 font-bold text-[#075292]">#${orderId}</td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">${escapeHtml(
            initials(order.customerName)
          )}</div>
          <div>
            <p class="text-sm font-bold text-on-surface">${name}</p>
            <p class="text-[10px] text-on-surface-variant">${email}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-[10px] font-bold ${tone.badge} flex items-center gap-1.5 w-fit">
          <span class="w-1.5 h-1.5 rounded-full ${tone.dot}"></span>
          ${escapeHtml(order.status)}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-on-surface-variant">${escapeHtml(dateLabel)}</td>
      <td class="px-6 py-4 text-sm font-bold text-on-surface">${escapeHtml(amount)}</td>
      <td class="px-6 py-4 text-right">
        <button class="text-primary text-xs font-bold hover:underline" data-action="update-order-status" data-order-id="${order.id}">Update Status</button>
      </td>
    </tr>
  `;
}

function getAdminOrdersControls() {
  const tableBody = selectAdminTableBody('tbody[data-ps-admin-orders-tbody]');

  if (!tableBody) {
    return null;
  }

  const searchInput = selectAdminSearchInput(
    'input[data-ps-admin-orders-search]',
    "Search orders..."
  );

  const hookedFilterButtons = Array.from(
    document.querySelectorAll('button[data-ps-admin-orders-filter]')
  ).filter((button) => button instanceof HTMLButtonElement);

  const filterButtons =
    hookedFilterButtons.length > 0
      ? hookedFilterButtons
      : Array.from(document.querySelectorAll("section button")).filter((button) => {
          const label = normalizeText(button.textContent);
          return (
            label === "all" ||
            label === "pending" ||
            label === "shipped" ||
            label === "cancelled"
          );
        });

  return {
    tableBody,
    searchInput,
    filterButtons
  };
}

function setActiveOrderFilterButton(filterButtons, activeStatus) {
  filterButtons.forEach((button) => {
    const filterValue = normalizeText(button.dataset.psAdminOrdersFilter || button.textContent || "");
    const isActive = filterValue === normalizeText(activeStatus || "all");
    button.classList.toggle("bg-surface-container-lowest", isActive);
    button.classList.toggle("text-primary", isActive);
    button.classList.toggle("shadow-sm", isActive);
    button.classList.toggle("font-bold", isActive);
    button.classList.toggle("font-medium", !isActive);
  });
}

async function hydrateAdminOrdersPage() {
  const controls = getAdminOrdersControls();

  if (!controls) {
    return;
  }

  const state = {
    status: "all",
    q: ""
  };

  const fetchAndRender = async () => {
    try {
      const params = new URLSearchParams();

      if (state.status !== "all") {
        params.set("status", state.status.toUpperCase());
      }

      if (state.q) {
        params.set("q", state.q);
      }

      params.set("limit", "100");

      const endpoint = `/api/admin/orders?${params.toString()}`;
      const payload = await withAdminAuth(() => apiFetch(endpoint));

      if (!payload) {
        return;
      }

      const orders = Array.isArray(payload.orders) ? payload.orders : [];

      if (orders.length === 0) {
        controls.tableBody.innerHTML =
          '<tr><td class="px-6 py-4 text-sm text-on-surface-variant" colspan="6">No orders found.</td></tr>';
        return;
      }

      controls.tableBody.innerHTML = orders.map(toAdminOrderRow).join("");
    } catch (error) {
      console.error(error);
    }
  };

  controls.tableBody.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('button[data-action="update-order-status"]');

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const orderId = Number(button.dataset.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return;
    }

    const nextStatus = window.prompt(
      "Enter new status: PENDING, PAID, SHIPPED, CANCELLED",
      "SHIPPED"
    );

    if (!nextStatus) {
      return;
    }

    const normalized = nextStatus.trim().toUpperCase();

    if (!["PENDING", "PAID", "SHIPPED", "CANCELLED"].includes(normalized)) {
      alert("Invalid status");
      return;
    }

    try {
      const result = await withAdminAuth(() =>
        apiFetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: normalized })
        })
      );

      if (!result) {
        return;
      }

      await fetchAndRender();
    } catch (error) {
      console.error(error);
    }
  });

  if (controls.searchInput) {
    let debounceId = 0;

    controls.searchInput.addEventListener("input", () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        state.q = controls.searchInput ? controls.searchInput.value.trim() : "";
        fetchAndRender();
      }, 200);
    });
  }

  controls.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filterValue = normalizeText(button.dataset.psAdminOrdersFilter || button.textContent || "");
      state.status = filterValue || "all";
      setActiveOrderFilterButton(controls.filterButtons, state.status);
      fetchAndRender();
    });
  });

  setActiveOrderFilterButton(controls.filterButtons, state.status);
  await fetchAndRender();
}

function formatAdminUserDate(isoDate) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function displayNameFromEmail(email) {
  const value = String(email || "").trim();

  if (!value.includes("@")) {
    return value || "Unknown";
  }

  const local = value.split("@")[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function userRoleChipClass(role) {
  const normalized = normalizeText(role).toUpperCase();

  if (normalized === "ADMIN") {
    return "admin";
  }

  if (normalized === "STAFF") {
    return "staff";
  }

  return "user";
}

function userRoleLabel(role) {
  const normalized = normalizeText(role).toUpperCase();

  if (normalized === "ADMIN") {
    return "Admin";
  }

  if (normalized === "STAFF") {
    return "Staff";
  }

  return "Customer";
}

function toAdminUserRow(user, currentUserId) {
  const email = escapeHtml(user.email || "-");
  const displayName = escapeHtml(displayNameFromEmail(user.email));
  const role = normalizeText(user.role).toUpperCase() || "CUSTOMER";
  const status = normalizeText(user.status).toUpperCase() || "DISABLED";
  const statusClass = status === "ENABLED" ? "live" : "disabled";
  const verificationLabel = status === "ENABLED" ? "Account Active" : "Access Paused";
  const verificationClass = status === "ENABLED" ? "live" : "pending";
  const lastUpdated = escapeHtml(formatAdminUserDate(user.updatedAt));
  const userId = escapeHtml(user.id || "");
  const isCurrentUser = currentUserId && currentUserId === user.id;

  return `
    <tr>
      <td><strong>${displayName}</strong><br /><span class="hint">${email}${
    isCurrentUser ? " (you)" : ""
  }</span></td>
      <td><span class="chip ${userRoleChipClass(role)}">${escapeHtml(userRoleLabel(role))}</span></td>
      <td><span class="chip ${statusClass}">${escapeHtml(status === "ENABLED" ? "Enabled" : "Disabled")}</span></td>
      <td><span class="chip ${verificationClass}">${escapeHtml(verificationLabel)}</span></td>
      <td>${lastUpdated}</td>
      <td>
        <div class="row-actions">
          <button class="mini" data-action="set-user-role" data-user-id="${userId}" data-current-role="${escapeHtml(
    role
  )}" type="button">Set Role</button>
          <button class="mini" data-action="toggle-user-status" data-user-id="${userId}" data-current-status="${escapeHtml(
    status
  )}" type="button">${status === "ENABLED" ? "Disable" : "Enable"}</button>
        </div>
      </td>
    </tr>
  `;
}

function getAdminUsersControls() {
  const tableBody = selectAdminTableBody('tbody[data-ps-admin-users-tbody]');

  if (!tableBody) {
    return null;
  }

  const searchInput = selectAdminSearchInput('input[data-ps-admin-users-search]');
  const roleFilter = document.querySelector('select[data-ps-admin-users-role-filter]');
  const statusFilter = document.querySelector('select[data-ps-admin-users-status-filter]');

  return {
    tableBody,
    searchInput: searchInput instanceof HTMLInputElement ? searchInput : null,
    roleFilter: roleFilter instanceof HTMLSelectElement ? roleFilter : null,
    statusFilter: statusFilter instanceof HTMLSelectElement ? statusFilter : null
  };
}

function updateAdminUsersMetrics(summary) {
  const setMetric = (key, value) => {
    const node = document.querySelector(`[data-ps-admin-users-metric="${key}"]`);

    if (!(node instanceof HTMLElement)) {
      return;
    }

    node.textContent = String(Number.isFinite(Number(value)) ? Number(value) : 0);
  };

  setMetric("total", summary && summary.total);
  setMetric("enabled", summary && summary.enabled);
  setMetric("disabled", summary && summary.disabled);
  setMetric("admins", summary && summary.admins);
}

function wireAdminChangePasswordForm() {
  const form = document.querySelector('form[data-ps-admin-change-password-form]');

  if (!(form instanceof HTMLFormElement) || form.dataset.psWired === "true") {
    return;
  }

  form.dataset.psWired = "true";

  const currentPasswordInput = form.querySelector('input[name="currentPassword"]');
  const newPasswordInput = form.querySelector('input[name="newPassword"]');
  const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
  const feedbackEl = form.querySelector('[data-ps-admin-change-password-feedback]');

  if (
    !(currentPasswordInput instanceof HTMLInputElement) ||
    !(newPasswordInput instanceof HTMLInputElement) ||
    !(confirmPasswordInput instanceof HTMLInputElement)
  ) {
    return;
  }

  const setFeedback = (message, isError) => {
    if (!(feedbackEl instanceof HTMLElement)) {
      return;
    }

    feedbackEl.textContent = message || "";
    feedbackEl.style.color = isError ? "#93000a" : "#005b59";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("", false);

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 8) {
      setFeedback("New password must be at least 8 characters.", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback("New password and confirm password must match.", true);
      return;
    }

    try {
      const result = await withAdminAuth(() =>
        apiFetch("/api/admin/auth/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        })
      );

      if (!result) {
        return;
      }

      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";
      setFeedback("Password updated.", false);
    } catch (error) {
      const message =
        error && typeof error === "object" && typeof error.message === "string"
          ? error.message
          : "Unable to update password";
      setFeedback(message, true);
    }
  });
}

async function hydrateAdminUsersPage() {
  const controls = getAdminUsersControls();
  wireAdminChangePasswordForm();

  if (!controls) {
    return;
  }

  const state = {
    q: "",
    role: "ALL",
    status: "ALL"
  };

  const fetchAndRender = async () => {
    try {
      const params = new URLSearchParams();

      if (state.q) {
        params.set("q", state.q);
      }

      if (state.role !== "ALL") {
        params.set("role", state.role);
      }

      if (state.status !== "ALL") {
        params.set("status", state.status);
      }

      params.set("limit", "200");

      const payload = await withAdminAuth(() => apiFetch(`/api/admin/users?${params.toString()}`));

      if (!payload) {
        return;
      }

      const users = Array.isArray(payload.users) ? payload.users : [];
      const currentUserId =
        typeof payload.currentUserId === "string" && payload.currentUserId
          ? payload.currentUserId
          : "";

      updateAdminUsersMetrics(payload.summary || null);

      if (users.length === 0) {
        controls.tableBody.innerHTML =
          '<tr><td class="hint" colspan="6">No users found for the current filters.</td></tr>';
        return;
      }

      controls.tableBody.innerHTML = users.map((user) => toAdminUserRow(user, currentUserId)).join("");
    } catch (error) {
      console.error(error);
    }
  };

  controls.tableBody.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const actionButton = target.closest("button[data-action]");

    if (!(actionButton instanceof HTMLButtonElement)) {
      return;
    }

    const action = actionButton.dataset.action;
    const userId = actionButton.dataset.userId;

    if (!action || !userId) {
      return;
    }

    if (action === "set-user-role") {
      const defaultRole = (actionButton.dataset.currentRole || "STAFF").toUpperCase();
      const nextRole = window.prompt("Enter role: ADMIN, STAFF, CUSTOMER", defaultRole);

      if (!nextRole) {
        return;
      }

      const normalizedRole = nextRole.trim().toUpperCase();

      if (!["ADMIN", "STAFF", "CUSTOMER"].includes(normalizedRole)) {
        alert("Invalid role");
        return;
      }

      try {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
            method: "PATCH",
            body: JSON.stringify({ role: normalizedRole })
          })
        );

        if (!result) {
          return;
        }

        await fetchAndRender();
      } catch (error) {
        const message =
          error && typeof error === "object" && typeof error.message === "string"
            ? error.message
            : "Unable to update role";
        alert(message);
      }
    }

    if (action === "toggle-user-status") {
      const currentStatus = (actionButton.dataset.currentStatus || "ENABLED").toUpperCase();
      const nextStatus = currentStatus === "ENABLED" ? "DISABLED" : "ENABLED";

      if (!window.confirm(`Set account status to ${nextStatus}?`)) {
        return;
      }

      try {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
            method: "PATCH",
            body: JSON.stringify({ status: nextStatus })
          })
        );

        if (!result) {
          return;
        }

        await fetchAndRender();
      } catch (error) {
        const message =
          error && typeof error === "object" && typeof error.message === "string"
            ? error.message
            : "Unable to update status";
        alert(message);
      }
    }
  });

  if (controls.searchInput) {
    let debounceId = 0;

    controls.searchInput.addEventListener("input", () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        state.q = controls.searchInput ? controls.searchInput.value.trim() : "";
        fetchAndRender();
      }, 200);
    });
  }

  if (controls.roleFilter) {
    controls.roleFilter.addEventListener("change", () => {
      state.role = (controls.roleFilter ? controls.roleFilter.value : "ALL").toUpperCase();
      fetchAndRender();
    });
  }

  if (controls.statusFilter) {
    controls.statusFilter.addEventListener("change", () => {
      state.status = (controls.statusFilter ? controls.statusFilter.value : "ALL").toUpperCase();
      fetchAndRender();
    });
  }

  await fetchAndRender();
}

function toAdminProductRow(product) {
  const productName = escapeHtml(product.name);
  const productImage = escapeHtml(product.image || "");
  const sku = escapeHtml(product.sku || "-");
  const category = escapeHtml(product.category || "-");
  const stockQty =
    product.stockQty === null || product.stockQty === undefined
      ? "-"
      : escapeHtml(String(product.stockQty));
  const productId = encodeURIComponent(product.id);

  return `
    <tr class="hover:bg-surface-container-low/30 transition-colors group">
      <td class="px-6 py-4">
        <input class="rounded border-outline-variant text-primary focus:ring-primary/20" type="checkbox"/>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
            <img alt="${productName}" class="w-full h-full object-cover" src="${productImage}" />
          </div>
          <span class="text-sm font-bold text-on-surface">${productName}</span>
        </div>
      </td>
      <td class="px-6 py-4 text-xs font-mono text-on-surface-variant">${sku}</td>
      <td class="px-6 py-4 text-sm text-on-surface">${category}</td>
      <td class="px-6 py-4 text-sm font-bold text-on-surface">${toCurrency(product.price)}</td>
      <td class="px-6 py-4 text-sm text-on-surface">${stockQty}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-tertiary-container text-on-tertiary-container uppercase tracking-tight">Active</span>
      </td>
      <td class="px-6 py-4 text-right space-x-1">
        <a class="inline-flex p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant" href="/admin-product-form.html?id=${productId}" title="Edit"><span class="material-symbols-outlined text-lg">edit</span></a>
        <button class="p-1.5 hover:bg-error-container/20 rounded-lg text-error" data-action="delete-product" data-product-id="${escapeHtml(
          product.id
        )}" title="Delete"><span class="material-symbols-outlined text-lg">delete</span></button>
      </td>
    </tr>
  `;
}

function categoryToStoreValue(category) {
  const normalized = normalizeText(category);

  if (normalized.includes("dog")) {
    return "dogs";
  }

  if (normalized.includes("cat")) {
    return "cats";
  }

  if (normalized.includes("access")) {
    return "accessories";
  }

  if (normalized.includes("deal") || normalized.includes("sale")) {
    return "deals";
  }

  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dogs";
}

async function hydrateAdminProductsPage() {
  const tableBody = selectAdminTableBody('tbody[data-ps-admin-products-tbody]');
  const searchInput = selectAdminSearchInput('input[data-ps-admin-products-search]');

  if (!tableBody) {
    return;
  }

  try {
    const payload = await withAdminAuth(() => apiFetch("/api/admin/products"));

    if (!payload) {
      return;
    }

    const products = Array.isArray(payload.products) ? payload.products : [];

    const renderProducts = (query = "") => {
      const normalizedQuery = normalizeText(query);
      const visibleProducts =
        normalizedQuery.length === 0
          ? products
          : products.filter((product) => {
              const name = normalizeText(product && product.name);
              const sku = normalizeText(product && product.sku);
              const category = normalizeText(product && product.category);
              return (
                name.includes(normalizedQuery) ||
                sku.includes(normalizedQuery) ||
                category.includes(normalizedQuery)
              );
            });

      if (visibleProducts.length === 0) {
        tableBody.innerHTML =
          '<tr><td class="px-6 py-4 text-sm text-on-surface-variant" colspan="8">No products found.</td></tr>';
        return;
      }

      tableBody.innerHTML = visibleProducts.map(toAdminProductRow).join("");
    };

    renderProducts();
    wireAdminProductTableActions(tableBody);

    if (searchInput) {
      let debounceId = 0;

      searchInput.addEventListener("input", () => {
        window.clearTimeout(debounceId);
        debounceId = window.setTimeout(() => {
          renderProducts(searchInput.value.trim());
        }, 200);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

function wireAdminProductTableActions(tableBody) {
  tableBody.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('button[data-action="delete-product"]');

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const productId = button.dataset.productId;

    if (!productId) {
      return;
    }

    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      const result = await withAdminAuth(() =>
        apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
          method: "DELETE"
        })
      );

      if (!result) {
        return;
      }

      const row = button.closest("tr");
      if (row) {
        row.remove();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function findControlByLabel(labelText) {
  const normalizedTarget = normalizeText(labelText);
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((candidate) => normalizeText(candidate.textContent) === normalizedTarget);

  if (!label || !label.parentElement) {
    return null;
  }

  return label.parentElement.querySelector("input, select, textarea");
}

function findAdminProductField(fieldName, fallbackLabel) {
  const hooked = document.querySelector(`[data-ps-admin-product-field="${fieldName}"]`);

  if (
    hooked instanceof HTMLInputElement ||
    hooked instanceof HTMLTextAreaElement ||
    hooked instanceof HTMLSelectElement
  ) {
    return hooked;
  }

  return findControlByLabel(fallbackLabel);
}

function setControlValue(control, value) {
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) {
    return;
  }

  control.value = value == null ? "" : String(value);
}

function collectAdminProductFormPayload(formFields) {
  const name = formFields.name?.value.trim();
  const rawCategory = formFields.category?.value || "dogs";
  const price = Number(formFields.price?.value || 0);
  const stockQtyText = formFields.stockQty?.value.trim() || "";
  const stockQty = stockQtyText === "" ? null : Number(stockQtyText);

  return {
    name,
    sku: formFields.sku?.value.trim() || null,
    brand: formFields.brand?.value.trim() || null,
    category: categoryToStoreValue(rawCategory),
    price,
    description: formFields.description?.value.trim() || null,
    stockQty
  };
}

function readProductImageUrls(product) {
  const fromImages = Array.isArray(product?.images)
    ? product.images.map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object" && typeof entry.url === "string") {
          return entry.url;
        }

        return "";
      })
    : [];

  const legacyImage = typeof product?.image === "string" ? product.image : "";
  return normalizeUrlList([...fromImages, legacyImage]);
}

function renderAdminProductImageList(listEl, imageUrls) {
  if (!(listEl instanceof HTMLElement)) {
    return;
  }

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    listEl.innerHTML =
      '<li class="text-xs text-on-surface-variant">No images yet. Add at least one URL.</li>';
    return;
  }

  listEl.innerHTML = imageUrls
    .map((url, index) => {
      const encodedUrl = escapeHtml(url);
      const isPrimary = index === 0;

      return `
        <li class="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2" data-index="${index}">
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-on-surface">${isPrimary ? "Primary" : `Image ${index + 1}`}</div>
            <div class="text-xs text-on-surface-variant truncate">${encodedUrl}</div>
          </div>
          <div class="flex items-center gap-1">
            <button class="px-2 py-1 text-xs rounded border border-outline-variant" data-action="move-up" type="button">Up</button>
            <button class="px-2 py-1 text-xs rounded border border-outline-variant" data-action="move-down" type="button">Down</button>
            <button class="px-2 py-1 text-xs rounded border border-outline-variant" data-action="make-primary" type="button">Primary</button>
            <button class="px-2 py-1 text-xs rounded border border-outline-variant text-error" data-action="remove" type="button">Remove</button>
          </div>
        </li>
      `;
    })
    .join("");
}

async function hydrateAdminProductForm() {
  const saveButton =
    document.querySelector('button[data-ps-admin-save-product]') ||
    Array.from(document.querySelectorAll("button")).find(
      (button) => normalizeText(button.textContent) === "save product"
    );

  const formFields = {
    name: findAdminProductField("name", "Product Name"),
    sku: findAdminProductField("sku", "SKU Number"),
    brand: findAdminProductField("brand", "Brand"),
    category: findAdminProductField("category", "Category"),
    price: findAdminProductField("price", "Base Price"),
    description: findAdminProductField("description", "Product Story"),
    stockQty: findAdminProductField("stockQty", "Current Stock")
  };
  const imageInput = document.querySelector('[data-ps-admin-product-image-input="true"]');
  const addImageButton = document.querySelector('[data-ps-admin-product-image-add="true"]');
  const imagesList = document.querySelector('[data-ps-admin-product-images-list="true"]');
  const imageState = {
    urls: []
  };

  if (!saveButton || !formFields.name || !formFields.price || !formFields.category) {
    return;
  }

  const renderImages = () => {
    renderAdminProductImageList(imagesList, imageState.urls);
  };

  const addImage = () => {
    if (!(imageInput instanceof HTMLInputElement)) {
      return;
    }

    const nextUrl = imageInput.value.trim();
    if (!nextUrl) {
      return;
    }

    imageState.urls = normalizeUrlList([...imageState.urls, nextUrl]);
    imageInput.value = "";
    renderImages();
  };

  if (addImageButton instanceof HTMLButtonElement) {
    addImageButton.addEventListener("click", addImage);
  }

  if (imageInput instanceof HTMLInputElement) {
    imageInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      addImage();
    });
  }

  if (imagesList instanceof HTMLElement) {
    imagesList.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest("button[data-action]");
      const row = target.closest("li[data-index]");

      if (!(button instanceof HTMLButtonElement) || !(row instanceof HTMLElement)) {
        return;
      }

      const index = Number(row.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= imageState.urls.length) {
        return;
      }

      const action = button.dataset.action;

      if (action === "remove") {
        imageState.urls.splice(index, 1);
      }

      if (action === "move-up" && index > 0) {
        const moved = imageState.urls[index];
        imageState.urls.splice(index, 1);
        imageState.urls.splice(index - 1, 0, moved);
      }

      if (action === "move-down" && index < imageState.urls.length - 1) {
        const moved = imageState.urls[index];
        imageState.urls.splice(index, 1);
        imageState.urls.splice(index + 1, 0, moved);
      }

      if (action === "make-primary" && index > 0) {
        const moved = imageState.urls[index];
        imageState.urls.splice(index, 1);
        imageState.urls.unshift(moved);
      }

      imageState.urls = normalizeUrlList(imageState.urls);
      renderImages();
    });
  }

  renderImages();

  const search = new URLSearchParams(window.location.search);
  const productId = search.get("id");

  if (productId) {
    try {
      const payload = await withAdminAuth(() =>
        apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`)
      );

      if (!payload) {
        return;
      }

      const product = payload.product;

      if (product) {
        setControlValue(formFields.name, product.name);
        setControlValue(formFields.sku, product.sku);
        setControlValue(formFields.brand, product.brand);
        setControlValue(formFields.category, product.category);
        setControlValue(formFields.price, product.price);
        setControlValue(formFields.description, product.description);
        setControlValue(formFields.stockQty, product.stockQty);
        imageState.urls = readProductImageUrls(product);
        renderImages();
      }
    } catch (error) {
      console.error(error);
    }
  }

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const payload = {
      ...collectAdminProductFormPayload(formFields),
      images: normalizeUrlList(imageState.urls)
    };

    if (!payload.name || !Number.isFinite(payload.price) || payload.price < 0) {
      alert("Please provide name and a valid price");
      return;
    }

    if (
      payload.stockQty !== null &&
      (!Number.isInteger(payload.stockQty) || payload.stockQty < 0)
    ) {
      alert("Stock quantity must be a non-negative integer");
      return;
    }

    try {
      if (productId) {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
            method: "PATCH",
            body: JSON.stringify(payload)
          })
        );

        if (!result) {
          return;
        }
      } else {
        const result = await withAdminAuth(() =>
          apiFetch("/api/admin/products", {
            method: "POST",
            body: JSON.stringify(payload)
          })
        );

        if (!result) {
          return;
        }
      }

      window.location.href = "/admin-products.html";
    } catch (error) {
      console.error(error);
    }
  });
}
