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

const INDEX_HEADING_EXCLUSIONS = new Set(["flash sale", "best sellers", "browse categories"]);

const STOREFRONT_CARD_SELECTORS_BY_PAGE = {
  "index.html": [
    'main [data-ps-product-grid="flash-sale"] .group.bg-surface-container-lowest.rounded-xl.p-6',
    'main [data-ps-product-grid="best-sellers"] > div'
  ],
  "dogs.html": ['main [data-ps-product-grid="dogs"] > div'],
  "cats.html": ['main [data-ps-product-grid="cats"] > div'],
  "accessories.html": ['main [data-ps-product-grid="accessories"] > div'],
  "deals.html": ['main [data-ps-product-grid="deals"] .card']
};

const STOREFRONT_DYNAMIC_PAGE_TO_PLACEMENT = {
  "dogs.html": "dogs",
  "cats.html": "cats",
  "accessories.html": "accessories",
  "deals.html": "deals"
};

const STOREFRONT_INTERACTIVE_DESCENDANT_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"]';

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
    if (currentPage() !== "index.html") {
      wireStorefrontProductClickthrough();
    }
  }

  if (STOREFRONT_DYNAMIC_PAGE_TO_PLACEMENT[currentPage()]) {
    void hydrateStorefrontCategoryPage(currentPage());
  }

  if (currentPage() === "index.html") {
    ensureIndexScrollableProductRows();
    wireIndexProductCarousels();
    void hydrateHomepageFlashSaleCountdown();
    void hydrateIndexHomepageSections();
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

  if (currentPage() === "admin-customers.html") {
    hydrateAdminCustomersPage();
  }

  if (currentPage() === "admin-pricing.html") {
    redirectAdminPricingAlias();
    return;
  }

  if (currentPage() === "admin-flashsale.html") {
    hydrateAdminPricingPage();
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
  "admin-flashsale.html",
  "admin-orders.html",
  "admin-customers.html",
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
  const currentShellUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  void loadAdminShellFragment(initialPage, currentShellUrl || adminPathToUrl(initialPage));

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

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (resolved.url !== currentUrl) {
      window.history.pushState({ page: resolved.page }, "", resolved.url);
    }

    void loadAdminShellFragment(resolved.page, resolved.url);
  });

  window.addEventListener("popstate", () => {
    const page = getPageFromPath(window.location.pathname);

    if (!page) {
      return;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    void loadAdminShellFragment(page, currentUrl || adminPathToUrl(page));
  });
}

function redirectAdminPricingAlias() {
  const targetPage = "admin-flashsale.html";
  const targetUrl = `/${targetPage}`;

  if (window.location.pathname.endsWith("/admin-pricing.html")) {
    window.history.replaceState({ page: targetPage }, "", targetUrl);
  }

  if (document.body.hasAttribute("data-ps-admin-shell")) {
    void loadAdminShellFragment(targetPage, targetUrl);
    return;
  }

  window.location.replace(targetUrl);
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

function buildProductDetailUrl(productData) {
  const params = new URLSearchParams();

  if (productData && productData.productId) {
    params.set("productId", String(productData.productId));
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
  const productId =
    (typeof card.dataset.productId === "string" && card.dataset.productId.trim()) || null;

  return {
    productId,
    title,
    price,
    image,
    category: card.dataset.productCategory || inferStorefrontCategory(page)
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
    if (!productData.productId) {
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

function preloadImageSource(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = url;
  });
}

async function applyProductDetailHeroImage(heroImageEl, image, fallbackAlt = "") {
  if (!(heroImageEl instanceof HTMLImageElement) || !image || typeof image.url !== "string") {
    return;
  }

  const nextUrl = image.url.trim();

  if (!nextUrl) {
    return;
  }

  heroImageEl.style.opacity = "0";

  try {
    await preloadImageSource(nextUrl);
  } catch {
    // Fall back to setting the source directly; browser may still resolve it from cache.
  }

  heroImageEl.src = nextUrl;

  const nextAlt =
    typeof image.alt === "string" && image.alt.trim() ? image.alt.trim() : (fallbackAlt || "").trim();
  if (nextAlt) {
    heroImageEl.alt = nextAlt;
  }

  heroImageEl.style.opacity = "1";
}

function findProductDetailThumbnailStrip(heroImageEl) {
  if (!(heroImageEl instanceof HTMLImageElement)) {
    return null;
  }

  const heroContainer = heroImageEl.closest("div");

  if (
    heroContainer instanceof HTMLElement &&
    heroContainer.previousElementSibling instanceof HTMLElement &&
    heroContainer.previousElementSibling.querySelector("img")
  ) {
    return heroContainer.previousElementSibling;
  }

  const thumbnailImage = document.querySelector('main img[alt*="thumbnail" i]');
  if (thumbnailImage instanceof HTMLImageElement) {
    const thumbnailCard = thumbnailImage.parentElement;
    if (thumbnailCard instanceof HTMLElement && thumbnailCard.parentElement instanceof HTMLElement) {
      return thumbnailCard.parentElement;
    }
  }

  return null;
}

function setProductDetailUnavailableState(message) {
  window.__PS_PRODUCT_DETAIL_UNAVAILABLE = "true";

  const titleEl = document.querySelector("main h1");
  const priceEl = document.querySelector("main h1 + div span");

  if (titleEl instanceof HTMLElement) {
    titleEl.textContent = "Product unavailable";
  }

  if (priceEl instanceof HTMLElement) {
    priceEl.textContent = "";
  }

  const messageEl = document.createElement("p");
  messageEl.className = "mt-4 text-sm text-error";
  messageEl.textContent = message || "This product is not currently available.";

  if (titleEl instanceof HTMLElement && titleEl.parentElement instanceof HTMLElement) {
    titleEl.parentElement.appendChild(messageEl);
  }

  Array.from(document.querySelectorAll("button")).forEach((button) => {
    const label = normalizeText(button.textContent);

    if (label.includes("add to cart") || label.includes("buy it now")) {
      button.disabled = true;
      button.classList.add("opacity-50", "cursor-not-allowed");
    }
  });
}

async function hydrateProductDetailPage() {
  if (currentPage() !== "product-detail.html") {
    return;
  }

  const search = new URLSearchParams(window.location.search);
  const queryProductId = (search.get("productId") || "").trim();

  if (!queryProductId) {
    setProductDetailUnavailableState("Missing productId in URL.");
    return;
  }

  let resolvedData = {
    productId: queryProductId,
    title: "",
    price: "",
    image: "",
    category: "",
    images: null,
    relatedProducts: [],
    variants: [],
    selectedVariantId: null
  };
  window.__PS_PRODUCT_DETAIL_UNAVAILABLE = "false";

  try {
    const payload = await apiFetch(`/api/products/${encodeURIComponent(queryProductId)}`);
    const product = payload && payload.product;
    const relatedProducts = payload && Array.isArray(payload.relatedProducts) ? payload.relatedProducts : [];

    if (!(product && typeof product === "object")) {
      setProductDetailUnavailableState("This product is not currently available.");
      return;
    }

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

    const variants = Array.isArray(product.variants)
      ? product.variants
          .filter(
            (variant) =>
              variant &&
              typeof variant === "object" &&
              typeof variant.id === "string" &&
              variant.id.trim() &&
              typeof variant.name === "string" &&
              variant.name.trim() &&
              typeof variant.price === "number" &&
              Number.isFinite(variant.price) &&
              (variant.enabled === undefined || variant.enabled === true)
          )
          .sort((left, right) => {
            const leftSort = typeof left.sortOrder === "number" ? left.sortOrder : 0;
            const rightSort = typeof right.sortOrder === "number" ? right.sortOrder : 0;
            return leftSort - rightSort;
          })
      : [];

    const selectedVariant = variants[0] || null;
    const selectedPrice = selectedVariant ? selectedVariant.price : product.price;

    resolvedData = {
      productId: queryProductId,
      title:
        typeof product.name === "string" && product.name.trim()
          ? product.name.trim()
          : "",
      price:
        typeof selectedPrice === "number" && Number.isFinite(selectedPrice)
          ? toCurrency(selectedPrice)
          : "",
      image:
        typeof product.image === "string" && product.image.trim()
          ? product.image.trim()
          : "",
      category:
        typeof product.category === "string" && product.category.trim()
          ? product.category.trim()
          : "",
      images: orderedImages.length > 0 ? orderedImages : null,
      relatedProducts,
      variants,
      selectedVariantId: selectedVariant ? selectedVariant.id : null
    };
  } catch (error) {
    if (error && typeof error === "object" && error.status === 404) {
      setProductDetailUnavailableState("This product is currently hidden or no longer available.");
      return;
    }

    console.warn("Unable to hydrate product detail from API", error);
  }

  const titleEl = document.querySelector("main h1");
  const priceEl = document.querySelector("main h1 + div span");
  const heroImageEl =
    document.querySelector('main img[alt="Main product"]') ||
    document.querySelector("main .aspect-square img") ||
    document.querySelector("main img");
  const thumbnailStrip = findProductDetailThumbnailStrip(heroImageEl);

  if (heroImageEl instanceof HTMLImageElement) {
    heroImageEl.style.opacity = "0";
    heroImageEl.style.transition = "opacity 160ms ease";
  }

  if (thumbnailStrip instanceof HTMLElement) {
    thumbnailStrip.style.visibility = "hidden";
  }

  if (titleEl && resolvedData.title) {
    titleEl.textContent = resolvedData.title;
    document.title = resolvedData.title;
  }

  const displayPrice = detailPriceFromValue(resolvedData.price);
  if (priceEl && displayPrice) {
    priceEl.textContent = displayPrice;
  }

  window.__PS_PRODUCT_DETAIL_STATE = {
    productId: resolvedData.productId,
    selectedVariantId: resolvedData.selectedVariantId,
    variants: resolvedData.variants
  };

  const variantLabel = Array.from(document.querySelectorAll("main label")).find(
    (label) => normalizeText(label.textContent) === "size"
  );
  const variantHost =
    variantLabel instanceof HTMLElement
      ? variantLabel.parentElement && variantLabel.parentElement.querySelector(".flex.flex-wrap")
      : null;

  if (variantHost instanceof HTMLElement && Array.isArray(resolvedData.variants) && resolvedData.variants.length > 0) {
    variantHost.innerHTML = "";
    resolvedData.variants.forEach((variant, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.variantId = variant.id;
      button.className =
        "px-6 py-3 rounded-xl border-2 text-on-surface-variant hover:border-primary/50 transition-all";
      button.textContent = variant.name;

      const isActive =
        resolvedData.selectedVariantId === variant.id ||
        (!resolvedData.selectedVariantId && index === 0);
      button.classList.toggle("border-primary", isActive);
      button.classList.toggle("bg-primary/5", isActive);
      button.classList.toggle("text-primary", isActive);
      button.classList.toggle("border-outline-variant", !isActive);

      button.addEventListener("click", () => {
        window.__PS_PRODUCT_DETAIL_STATE.selectedVariantId = variant.id;

        Array.from(variantHost.querySelectorAll("button")).forEach((candidate) => {
          const active = candidate instanceof HTMLButtonElement && candidate.dataset.variantId === variant.id;
          candidate.classList.toggle("border-primary", active);
          candidate.classList.toggle("bg-primary/5", active);
          candidate.classList.toggle("text-primary", active);
          candidate.classList.toggle("border-outline-variant", !active);
        });

        if (priceEl instanceof HTMLElement) {
          priceEl.textContent = toCurrency(variant.price);
        }
      });

      variantHost.appendChild(button);
    });
  }

  const detailImages = Array.isArray(resolvedData.images) ? resolvedData.images : null;
  const hasDetailImages = Boolean(detailImages && detailImages.length > 0);

  if (heroImageEl instanceof HTMLImageElement && hasDetailImages) {
    const activeClasses = ["ring-2", "ring-primary", "ring-offset-2"];

    const setHeroFromImage = (image) => {
      void applyProductDetailHeroImage(heroImageEl, image, resolvedData.title || heroImageEl.alt);
    };

    await applyProductDetailHeroImage(
      heroImageEl,
      detailImages[0],
      resolvedData.title || heroImageEl.alt
    );

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
      thumbnailStrip.style.visibility = "";
    }
  }

  if (heroImageEl instanceof HTMLImageElement && resolvedData.image && !hasDetailImages) {
    await applyProductDetailHeroImage(
      heroImageEl,
      {
        url: resolvedData.image,
        alt: resolvedData.title || heroImageEl.alt
      },
      resolvedData.title || heroImageEl.alt
    );

    if (thumbnailStrip instanceof HTMLElement) {
      thumbnailStrip.style.display = "none";
      thumbnailStrip.style.visibility = "hidden";
    }
  }

  hydrateProductDetailRelatedProducts(resolvedData.relatedProducts, resolvedData.category);
  await hydrateProductDetailReviews(resolvedData.productId);
}

function relatedProductsHeadingForCategory(category) {
  const normalizedCategory = normalizeText(category);

  if (normalizedCategory.includes("cat")) {
    return "Recommended for your cat";
  }

  if (normalizedCategory.includes("dog")) {
    return "Recommended for your pup";
  }

  if (normalizedCategory.includes("accessor")) {
    return "Recommended accessories for your pet";
  }

  return "Recommended for your pet";
}

function hydrateProductDetailRelatedProducts(relatedProducts, productCategory = "") {
  const section = Array.from(document.querySelectorAll("main section")).find((entry) => {
    const heading = entry.querySelector("h2");
    const headingText = normalizeText(heading ? heading.textContent : "");
    return headingText.startsWith("recommended for your") || headingText.includes("recommended accessories");
  });

  if (!(section instanceof HTMLElement)) {
    return;
  }

  const headingEl = section.querySelector("h2");
  if (headingEl instanceof HTMLElement) {
    headingEl.textContent = relatedProductsHeadingForCategory(productCategory);
  }

  const grid = section.querySelector(".grid");
  if (!(grid instanceof HTMLElement)) {
    return;
  }

  const products = Array.isArray(relatedProducts) ? relatedProducts.slice(0, 4) : [];
  if (products.length === 0) {
    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const productId = escapeHtml(String(product.id || ""));
      const name = escapeHtml(String(product.name || "Product"));
      const category = escapeHtml(String(product.category || "Category"));
      const image = escapeHtml(String(product.image || ""));
      const sale = resolveProductSale(product);

      return `
        <div class="group cursor-pointer" data-product-id="${productId}">
          <div class="relative rounded-[2rem] overflow-hidden aspect-[4/5] bg-surface-container-low mb-6 transition-transform group-hover:scale-[0.98]">
            <img alt="${name}" class="w-full h-full object-cover" src="${image}"/>
            ${sale.isOnSale && sale.percentOff > 0 ? `<span class="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">-${sale.percentOff}%</span>` : ""}
          </div>
          <h3 class="text-lg font-bold text-primary group-hover:text-secondary transition-colors">${name}</h3>
          <p class="text-on-surface-variant text-sm mb-2">${category}</p>
          <p class="font-bold">${toCurrency(sale.currentPrice)}${sale.originalPrice !== null ? `<span class=\"ml-2 text-xs text-on-surface-variant line-through\">${toCurrency(sale.originalPrice)}</span>` : ""}</p>
        </div>
      `;
    })
    .join("");

  Array.from(grid.querySelectorAll("[data-product-id]")).forEach((card) => {
    if (!(card instanceof HTMLElement)) {
      return;
    }

    card.addEventListener("click", () => {
      const productId = card.dataset.productId;
      if (!productId) {
        return;
      }

      window.location.href = buildProductDetailUrl({ productId });
    });
  });
}

async function hydrateProductDetailReviews(productId) {
  const section = Array.from(document.querySelectorAll("main section")).find((entry) => {
    const heading = entry.querySelector("h2");
    return normalizeText(heading ? heading.textContent : "") === "loved by pups and parents";
  });

  if (!(section instanceof HTMLElement)) {
    return;
  }

  const grid = section.querySelector(".grid");
  if (!(grid instanceof HTMLElement)) {
    return;
  }

  try {
    const payload = await apiFetch(`/api/reviews?productId=${encodeURIComponent(productId)}&limit=6`);
    const reviews = payload && Array.isArray(payload.reviews) ? payload.reviews : [];
    const source = payload && typeof payload.source === "string" ? payload.source : "product";

    if (reviews.length === 0) {
      return;
    }

    const sourceNote = section.querySelector("p");
    if (sourceNote instanceof HTMLElement && source === "store") {
      sourceNote.textContent = "No product-specific reviews yet. Showing trusted store reviews.";
    }

    grid.innerHTML = reviews
      .map((review) => {
        const rating = Math.max(1, Math.min(5, Number(review.rating) || 0));
        const stars = Array.from({ length: 5 })
          .map((_, index) => {
            const filled = index < rating;
            return `<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' ${filled ? 1 : 0};">star</span>`;
          })
          .join("");
        const body = escapeHtml(String(review.body || ""));
        const author = escapeHtml(String(review.authorName || "Customer"));
        const initials = escapeHtml(
          author
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "CU"
        );
        const createdAt = formatDateShort(review.createdAt);

        return `
          <div class="bg-surface-container-lowest p-8 rounded-[2rem] editorial-shadow flex flex-col">
            <div class="flex justify-between mb-4">
              <div class="flex text-secondary-container">${stars}</div>
              <span class="text-xs font-label text-outline uppercase tracking-wider">${escapeHtml(createdAt)}</span>
            </div>
            <p class="text-on-surface-variant italic mb-6">"${body}"</p>
            <div class="mt-auto flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs">${initials}</div>
              <div>
                <div class="text-sm font-bold flex items-center gap-1">${author}</div>
                <div class="text-[10px] text-tertiary-container font-bold uppercase tracking-widest px-2 bg-tertiary-container/10 rounded-full inline-block">${source === "store" ? "Store Review" : "Verified Purchase"}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.warn("Unable to hydrate product reviews", error);
  }
}

async function addToCart(productId, quantity, variantId = null) {
  return apiFetch("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, variantId, quantity })
  });
}

function storefrontPlacementForPage(page) {
  return STOREFRONT_DYNAMIC_PAGE_TO_PLACEMENT[page] || null;
}

function isStorefrontPageAddToCartButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }

  const text = normalizeText(button.textContent);
  if (text.includes("add to cart")) {
    return true;
  }

  const icons = Array.from(button.querySelectorAll(".material-symbols-outlined, .material-icons"));
  return icons.some((icon) => {
    const iconName = normalizeText(icon.textContent);
    return iconName === "add_shopping_cart" || iconName === "shopping_bag";
  });
}

function storefrontCardsForPage(page) {
  const selectors = STOREFRONT_CARD_SELECTORS_BY_PAGE[page];

  if (!Array.isArray(selectors) || selectors.length === 0) {
    return [];
  }

  return selectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .filter((card) => card instanceof HTMLElement);
}

function storefrontGridByKey(gridKey) {
  if (typeof gridKey !== "string" || !gridKey.trim()) {
    return null;
  }

  const grid = document.querySelector(`[data-ps-product-grid="${gridKey.trim()}"]`);
  return grid instanceof HTMLElement ? grid : null;
}

function storefrontCardTemplateByKey(gridKey) {
  if (typeof gridKey !== "string" || !gridKey.trim()) {
    return null;
  }

  const template = document.querySelector(
    `template[data-ps-product-card-template="${gridKey.trim()}"]`
  );

  return template instanceof HTMLTemplateElement ? template : null;
}

function storefrontCardTemplateNode(gridKey, cards) {
  const firstCard = Array.isArray(cards) && cards.length > 0 ? cards[0] : null;

  if (firstCard instanceof HTMLElement) {
    const template = firstCard.cloneNode(true);
    if (template instanceof HTMLElement) {
      clearStorefrontCardWiringState(template);
      return template;
    }
  }

  const htmlTemplate = storefrontCardTemplateByKey(gridKey);
  if (!(htmlTemplate instanceof HTMLTemplateElement)) {
    return null;
  }

  const templateRoot = htmlTemplate.content.firstElementChild;
  if (!(templateRoot instanceof HTMLElement)) {
    return null;
  }

  const template = templateRoot.cloneNode(true);
  if (template instanceof HTMLElement) {
    clearStorefrontCardWiringState(template);
    return template;
  }

  return null;
}

function resolveProductSale(product) {
  const sale = product && typeof product.sale === "object" ? product.sale : null;
  const currentPrice =
    sale && Number.isFinite(Number(sale.currentPrice))
      ? Number(sale.currentPrice)
      : Number.isFinite(Number(product?.price))
        ? Number(product.price)
        : 0;
  const originalPrice =
    sale && Number.isFinite(Number(sale.originalPrice))
      ? Number(sale.originalPrice)
      : Number.isFinite(Number(product?.originalPrice))
        ? Number(product.originalPrice)
        : null;
  const percentOff =
    sale && Number.isFinite(Number(sale.percentOff))
      ? Number(sale.percentOff)
      : Number.isFinite(Number(product?.percentOff))
        ? Number(product.percentOff)
        : 0;
  const isOnSale =
    Boolean(sale && sale.isOnSale === true) ||
    Boolean(percentOff > 0) ||
    Boolean(originalPrice !== null && originalPrice > currentPrice);

  return {
    currentPrice,
    originalPrice: isOnSale ? originalPrice : null,
    percentOff: isOnSale ? Math.max(0, Math.round(percentOff)) : 0,
    isOnSale
  };
}

function updateStorefrontCardPrice(card, formattedPrice, formattedOriginalPrice) {
  const priceRow = card.querySelector(".price-row");
  if (priceRow instanceof HTMLElement) {
    const strong = priceRow.querySelector("strong");
    const strike = priceRow.querySelector("span");
    if (strong instanceof HTMLElement) {
      strong.textContent = formattedPrice;
    }
    if (strike instanceof HTMLElement) {
      strike.textContent = formattedOriginalPrice || "";
      strike.classList.toggle("hidden", !formattedOriginalPrice);
    }
    return;
  }

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
    const match = candidates.find((candidate) => /\$\s*\d/.test((candidate.textContent || "").trim()));

    if (match instanceof HTMLElement) {
      match.textContent = formattedPrice;
      if (formattedOriginalPrice) {
        let strike = match.parentElement ? match.parentElement.querySelector(".ps-original-price") : null;
        if (!(strike instanceof HTMLElement)) {
          strike = document.createElement("span");
          strike.className = "ps-original-price ml-2 text-xs text-on-surface-variant line-through";
          if (match.parentElement instanceof HTMLElement) {
            match.parentElement.appendChild(strike);
          }
        }
        strike.textContent = formattedOriginalPrice;
      }
      return;
    }
  }
}

function hydrateStorefrontCard(card, product) {
  const titleEl = card.querySelector("h4, h3, h2");
  const imageEl = card.querySelector("img");

  if (titleEl instanceof HTMLElement && typeof product.name === "string") {
    titleEl.textContent = product.name;
  }

  if (imageEl instanceof HTMLImageElement && typeof product.image === "string" && product.image.trim()) {
    imageEl.src = product.image.trim();
    imageEl.alt = typeof product.name === "string" && product.name.trim() ? product.name.trim() : imageEl.alt;
  }

  const sale = resolveProductSale(product);
  updateStorefrontCardPrice(
    card,
    toCurrency(sale.currentPrice),
    sale.originalPrice !== null ? toCurrency(sale.originalPrice) : ""
  );

  const badge = card.querySelector(".badge, .absolute.top-3.left-3, .absolute.top-4.left-4, .absolute.top-2.left-2");
  if (badge instanceof HTMLElement) {
    if (sale.isOnSale && sale.percentOff > 0) {
      badge.textContent = `-${sale.percentOff}%`;
      badge.classList.remove("hidden");
    } else if (!sale.isOnSale) {
      if (normalizeText(badge.textContent).includes("sale") || /^-\d+%$/.test((badge.textContent || "").trim())) {
        badge.classList.add("hidden");
      }
    }
  }

  if (typeof product.id === "string" && product.id.trim()) {
    card.dataset.productId = product.id;
  }

  if (typeof product.category === "string" && product.category.trim()) {
    card.dataset.productCategory = product.category;
  }

  const addButtons = Array.from(card.querySelectorAll("button")).filter(isStorefrontPageAddToCartButton);
  addButtons.forEach((button) => {
    if (typeof product.id === "string" && product.id.trim()) {
      button.dataset.productId = product.id;
    }
  });
}

function clearStorefrontCardWiringState(card) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  delete card.dataset.psProductCardClickWired;
  delete card.dataset.psProductDetailUrl;

  const addButtons = Array.from(card.querySelectorAll("button")).filter(isStorefrontPageAddToCartButton);
  addButtons.forEach((button) => {
    delete button.dataset.storefrontAddToCartWired;
  });
}

async function wireStorefrontPageAddToCart(page) {
  const storefrontPage = storefrontPlacementForPage(page);

  if (!storefrontPage) {
    return;
  }

  const cards = storefrontCardsForPage(page);

  cards.forEach((card) => {
    if (!(card instanceof HTMLElement)) {
      return;
    }

    const title = card.querySelector("h4, h3, h2");
    const buttons = Array.from(card.querySelectorAll("button"));
    const button = buttons.find(isStorefrontPageAddToCartButton);

    if (!title || !button) {
      return;
    }

    const normalizedTitle = normalizeText(title.textContent);
    const productId =
      button.dataset.productId ||
      card.dataset.productId ||
      null;

    if (!productId) {
      console.warn("Skipping add-to-cart wiring for card without hydrated product id", {
        page,
        title: normalizedTitle
      });
      return;
    }

    if (button.dataset.storefrontAddToCartWired === "true") {
      return;
    }

    button.dataset.storefrontAddToCartWired = "true";

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

async function hydrateStorefrontCategoryPage(page) {
  const storefrontPage = storefrontPlacementForPage(page);

  if (!storefrontPage) {
    return;
  }

  const cards = storefrontCardsForPage(page);
  const container = storefrontGridByKey(storefrontPage) ||
    ((cards[0] instanceof HTMLElement && cards[0].parentElement instanceof HTMLElement)
      ? cards[0].parentElement
      : null);

  if (!(container instanceof HTMLElement)) {
    await wireStorefrontPageAddToCart(page);
    return;
  }

  const template = storefrontCardTemplateNode(storefrontPage, cards);

  try {
    const payload = await apiFetch(`/api/products?storefrontPage=${encodeURIComponent(storefrontPage)}`);
    const products = payload && Array.isArray(payload.products) ? payload.products : [];

    if (products.length > 0 && template instanceof HTMLElement) {
      container.innerHTML = "";

      products.forEach((product) => {
        const card = template.cloneNode(true);

        if (card instanceof HTMLElement) {
          clearStorefrontCardWiringState(card);
          hydrateStorefrontCard(card, product);
          container.appendChild(card);
        }
      });
    }

    wireCategoryFilters(page, container, products);
  } catch (error) {
    console.warn("Unable to hydrate storefront products", { page, error });
  }

  await wireStorefrontPageAddToCart(page);
  wireStorefrontProductClickthrough();
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

function isIconOnlyAddButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }

  const text = normalizeText(button.textContent);
  return text === "shopping_bag" || text === "add_shopping_cart";
}

function resolveCardProductIdForButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return "";
  }

  const card = button.closest("[data-product-id]");

  if (!(card instanceof HTMLElement)) {
    return "";
  }

  return typeof card.dataset.productId === "string" ? card.dataset.productId : "";
}

function sectionByHeading(headingText) {
  const sections = Array.from(document.querySelectorAll("main section"));
  return (
    sections.find((section) => {
      const heading = section.querySelector("h2");
      return normalizeText(heading ? heading.textContent : "") === normalizeText(headingText);
    }) || null
  );
}

function hydrateStorefrontGridByKey(gridKey, products) {
  const grid = storefrontGridByKey(gridKey);

  if (!(grid instanceof HTMLElement)) {
    return false;
  }

  const cards = Array.from(grid.children).filter((card) => card instanceof HTMLElement);
  const template = storefrontCardTemplateNode(gridKey, cards);

  if (!(template instanceof HTMLElement)) {
    return false;
  }

  grid.innerHTML = "";

  products.forEach((product) => {
    const card = template.cloneNode(true);

    if (!(card instanceof HTMLElement)) {
      return;
    }

    clearStorefrontCardWiringState(card);
    hydrateStorefrontCard(card, product);
    grid.appendChild(card);
  });

  return true;
}

function ensureIndexScrollableProductRows() {
  if (currentPage() !== "index.html") {
    return;
  }

  if (!document.querySelector("#ps-index-scroll-rows-style")) {
    const style = document.createElement("style");
    style.id = "ps-index-scroll-rows-style";
    style.textContent = `
[data-ps-product-grid="flash-sale"],
[data-ps-product-grid="best-sellers"] {
  display: grid;
  grid-template-columns: none !important;
  grid-auto-flow: column;
  grid-auto-columns: 100%;
  gap: 2rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  padding-bottom: 8px;
}

@media (min-width: 640px) {
  [data-ps-product-grid="flash-sale"],
  [data-ps-product-grid="best-sellers"] {
    grid-auto-columns: calc((100% - 1 * 2rem) / 2);
  }
}

@media (min-width: 1024px) {
  [data-ps-product-grid="flash-sale"],
  [data-ps-product-grid="best-sellers"] {
    grid-auto-columns: calc((100% - 3 * 2rem) / 4);
  }
}

[data-ps-product-grid="flash-sale"] > *,
[data-ps-product-grid="best-sellers"] > * {
  min-width: 0;
}

button[data-ps-carousel-nav="true"][disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}
`;
    document.head.appendChild(style);
  }
}

function updateIndexCarouselNavState(grid, prevButton, nextButton) {
  if (!(grid instanceof HTMLElement)) {
    return;
  }

  const maxScrollLeft = Math.max(0, grid.scrollWidth - grid.clientWidth);
  const scrollLeft = Math.max(0, Math.min(grid.scrollLeft, maxScrollLeft));

  if (prevButton instanceof HTMLButtonElement) {
    prevButton.disabled = scrollLeft <= 1;
  }

  if (nextButton instanceof HTMLButtonElement) {
    nextButton.disabled = scrollLeft >= maxScrollLeft - 1 || maxScrollLeft <= 1;
  }
}

function wireIndexCarouselByKey(gridKey) {
  const grid = document.querySelector(`[data-ps-product-grid="${gridKey}"]`);

  if (!(grid instanceof HTMLElement)) {
    return;
  }

  const prevButton = document.querySelector(`[data-ps-carousel-prev="${gridKey}"]`);
  const nextButton = document.querySelector(`[data-ps-carousel-next="${gridKey}"]`);

  if (prevButton instanceof HTMLButtonElement && prevButton.dataset.psCarouselWired !== "true") {
    prevButton.dataset.psCarouselWired = "true";
    prevButton.addEventListener("click", () => {
      grid.scrollBy({ left: -grid.clientWidth, behavior: "smooth" });
    });
  }

  if (nextButton instanceof HTMLButtonElement && nextButton.dataset.psCarouselWired !== "true") {
    nextButton.dataset.psCarouselWired = "true";
    nextButton.addEventListener("click", () => {
      grid.scrollBy({ left: grid.clientWidth, behavior: "smooth" });
    });
  }

  if (grid.dataset.psCarouselScrollWired !== "true") {
    grid.dataset.psCarouselScrollWired = "true";
    grid.addEventListener("scroll", () => {
      updateIndexCarouselNavState(grid, prevButton, nextButton);
    });

    window.addEventListener("resize", () => {
      updateIndexCarouselNavState(grid, prevButton, nextButton);
    });
  }

  updateIndexCarouselNavState(grid, prevButton, nextButton);
}

function wireIndexProductCarousels() {
  if (currentPage() !== "index.html") {
    return;
  }

  wireIndexCarouselByKey("flash-sale");
  wireIndexCarouselByKey("best-sellers");
}

function collectCategoryFilterState(container) {
  const state = {
    maxPrice: null,
    brands: [],
    lifeStages: [],
    breedSizes: [],
    catAges: [],
    catTypes: [],
    fallbackTerms: []
  };

  if (!(container instanceof HTMLElement)) {
    return state;
  }

  const aside = container.closest("section")?.querySelector("aside");
  if (!(aside instanceof HTMLElement)) {
    return state;
  }

  const rangeInput = aside.querySelector('input[type="range"]');
  if (rangeInput instanceof HTMLInputElement) {
    const value = Number(rangeInput.value);
    if (Number.isFinite(value)) {
      state.maxPrice = value;
    }
  }

  const selectedBrandTerms = [];
  const selectedFallbackTerms = [];
  const labels = Array.from(aside.querySelectorAll("label"));

  labels.forEach((label) => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) {
      return;
    }

    const term = normalizeText(label.textContent);
    if (!term) {
      return;
    }

    const section = label.closest("div");
    const sectionHeading = section ? section.querySelector("h3") : null;
    const headingText = normalizeText(sectionHeading ? sectionHeading.textContent : "");

    if (headingText === "brand") {
      selectedBrandTerms.push(term);
      return;
    }

    if (headingText === "life stage") {
      state.lifeStages.push(term);
      return;
    }

    if (headingText === "breed size") {
      state.breedSizes.push(term);
      return;
    }

    if (headingText === "filter by age") {
      state.catAges.push(term);
      return;
    }

    if (headingText === "type") {
      state.catTypes.push(term);
      return;
    }

    selectedFallbackTerms.push(term);
  });

  state.brands = Array.from(new Set(selectedBrandTerms));
  state.fallbackTerms = Array.from(new Set(selectedFallbackTerms));
  return state;
}

function productMatchesCategoryFilters(product, state) {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (state.maxPrice !== null) {
    if (typeof product.price !== "number" || !Number.isFinite(product.price)) {
      return false;
    }

    if (product.price > state.maxPrice) {
      return false;
    }
  }

  if (Array.isArray(state.brands) && state.brands.length > 0) {
    const brand = normalizeText(typeof product.brand === "string" ? product.brand : "");
    if (!state.brands.includes(brand)) {
      return false;
    }
  }

  if (Array.isArray(state.lifeStages) && state.lifeStages.length > 0) {
    const value = normalizeText(typeof product.dogLifeStage === "string" ? product.dogLifeStage : "");
    if (!state.lifeStages.includes(value)) {
      return false;
    }
  }

  if (Array.isArray(state.breedSizes) && state.breedSizes.length > 0) {
    const value = normalizeText(typeof product.dogBreedSize === "string" ? product.dogBreedSize : "");
    if (!state.breedSizes.includes(value)) {
      return false;
    }
  }

  if (Array.isArray(state.catAges) && state.catAges.length > 0) {
    const value = normalizeText(typeof product.catAge === "string" ? product.catAge : "");
    if (!state.catAges.includes(value)) {
      return false;
    }
  }

  if (Array.isArray(state.catTypes) && state.catTypes.length > 0) {
    const value = normalizeText(typeof product.catType === "string" ? product.catType : "");
    if (!state.catTypes.includes(value)) {
      return false;
    }
  }

  if (Array.isArray(state.fallbackTerms) && state.fallbackTerms.length > 0) {
    const haystack = normalizeText(
      [
        typeof product.name === "string" ? product.name : "",
        typeof product.category === "string" ? product.category : "",
        typeof product.brand === "string" ? product.brand : "",
        typeof product.description === "string" ? product.description : "",
        typeof product.dogLifeStage === "string" ? product.dogLifeStage : "",
        typeof product.dogBreedSize === "string" ? product.dogBreedSize : "",
        typeof product.catAge === "string" ? product.catAge : "",
        typeof product.catType === "string" ? product.catType : ""
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (!state.fallbackTerms.some((term) => haystack.includes(term))) {
      return false;
    }
  }

  return true;
}

function updateFilterSummaryForContainer(container, totalCount) {
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const section = container.closest("section");
  if (!(section instanceof HTMLElement)) {
    return;
  }

  const summary = section.querySelector(".text-on-surface-variant.font-medium");
  if (!(summary instanceof HTMLElement)) {
    return;
  }

  summary.textContent = `${totalCount} Products found`;
}

function wireCategoryFilters(page, container, products) {
  if (!(container instanceof HTMLElement) || !Array.isArray(products) || products.length === 0) {
    return;
  }

  const aside = container.closest("section")?.querySelector("aside");
  if (!(aside instanceof HTMLElement)) {
    return;
  }

  const filterControls = Array.from(
    aside.querySelectorAll('input[type="checkbox"], input[type="range"]')
  );

  if (filterControls.length === 0) {
    return;
  }

  const rangeInput = aside.querySelector('input[type="range"]');
  if (rangeInput instanceof HTMLInputElement) {
    const maxPrice = Math.max(
      0,
      ...products
        .map((product) => (typeof product.price === "number" ? product.price : 0))
        .filter((price) => Number.isFinite(price))
    );
    const roundedMax = Math.max(1, Math.ceil(maxPrice));

    if (!rangeInput.dataset.psFilterReady) {
      rangeInput.min = "0";
      rangeInput.max = String(roundedMax);
      rangeInput.step = "1";
      rangeInput.value = String(roundedMax);
      rangeInput.dataset.psFilterReady = "true";
    }
  }

  const runFilters = async () => {
    const state = collectCategoryFilterState(container);
    const filtered = products.filter((product) => productMatchesCategoryFilters(product, state));
    hydrateStorefrontGridByKey(storefrontPlacementForPage(page), filtered);
    updateFilterSummaryForContainer(container, filtered.length);
    await wireStorefrontPageAddToCart(page);
    wireStorefrontProductClickthrough();
  };

  filterControls.forEach((control) => {
    if (!(control instanceof HTMLInputElement) || control.dataset.psFilterWired === "true") {
      return;
    }

    control.dataset.psFilterWired = "true";
    control.addEventListener("change", () => {
      void runFilters();
    });

    if (control.type === "range") {
      control.addEventListener("input", () => {
        void runFilters();
      });
    }
  });

  void runFilters();
}

async function hydrateIndexHomepageSections() {
  if (currentPage() !== "index.html") {
    return;
  }

  let hasActiveFlashSale = false;

  try {
    const [campaignPayload, bestPayload] = await Promise.all([
      fetchFlashSaleCampaign(),
      apiFetch("/api/products?collection=BEST_SELLERS")
    ]);

    hasActiveFlashSale = isFlashSaleCampaignActive(campaignPayload?.campaign);

    if (hasActiveFlashSale) {
      const flashPayload = await apiFetch("/api/products?collection=FLASH_SALE");
      const flashProducts = Array.isArray(flashPayload?.products) ? flashPayload.products : [];
      hydrateStorefrontGridByKey("flash-sale", flashProducts);
    } else {
      promoteBestSellersAboveFlashSale();
    }

    const bestSellerProducts = Array.isArray(bestPayload?.products) ? bestPayload.products : [];
    hydrateStorefrontGridByKey("best-sellers", bestSellerProducts);
  } catch (error) {
    console.warn("Unable to hydrate index homepage sections", error);
  }

  wireStorefrontProductClickthrough();
  wireIndexProductCarousels();
  await wireIndexAddToCart();
}

async function fetchFlashSaleCampaign() {
  try {
    return await apiFetch("/api/flash-sale-campaign");
  } catch (error) {
    console.warn("Unable to fetch flash sale campaign", error);
    return null;
  }
}

function isFlashSaleCampaignActive(campaign) {
  if (!campaign || typeof campaign !== "object") {
    return false;
  }

  const now = new Date();
  const startAt = typeof campaign.startAt === "string" ? new Date(campaign.startAt) : new Date(campaign.startAt);
  const endAt = typeof campaign.endAt === "string" ? new Date(campaign.endAt) : new Date(campaign.endAt);

  return (
    startAt instanceof Date && !Number.isNaN(startAt.valueOf()) &&
    endAt instanceof Date && !Number.isNaN(endAt.valueOf()) &&
    startAt <= now && endAt > now
  );
}

function promoteBestSellersAboveFlashSale() {
  const flashSection = sectionByHeading("Flash Sale");
  const bestSection = sectionByHeading("Best Sellers");

  if (!(bestSection instanceof HTMLElement)) {
    return;
  }

  if (flashSection instanceof HTMLElement) {
    const flashParent = flashSection.parentElement;
    if (flashParent && flashParent.contains(bestSection)) {
      flashParent.insertBefore(bestSection, flashSection);
    }
    flashSection.remove();
  }
}

function toFlashCountdownParts(targetDate, nowDate) {
  const remainingMs = Math.max(0, targetDate.getTime() - nowDate.getTime());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    isComplete: totalSeconds === 0
  };
}

function flashSaleCountdownElements() {
  const flashSaleSection = sectionByHeading("Flash Sale");
  if (!(flashSaleSection instanceof HTMLElement)) {
    return null;
  }

  const blocks = Array.from(
    flashSaleSection.querySelectorAll(".flex.gap-4.text-xl.font-bold.font-headline > span")
  );

  if (blocks.length < 3) {
    return null;
  }

  return {
    section: flashSaleSection,
    hours: blocks[0],
    minutes: blocks[1],
    seconds: blocks[2]
  };
}

function setCountdownBlockValue(block, value) {
  if (!(block instanceof HTMLElement)) {
    return;
  }

  const label = block.querySelector("small");
  block.textContent = value;
  if (label instanceof HTMLElement) {
    block.appendChild(label);
  }
}

async function hydrateHomepageFlashSaleCountdown() {
  if (currentPage() !== "index.html") {
    return;
  }

  const countdownEls = flashSaleCountdownElements();
  if (!countdownEls) {
    return;
  }

  try {
    const payload = await apiFetch("/api/flash-sale-campaign");
    const campaign = payload && payload.campaign ? payload.campaign : null;

    if (!campaign || typeof campaign.endAt !== "string") {
      return;
    }

    const endAt = new Date(campaign.endAt);
    if (Number.isNaN(endAt.valueOf())) {
      return;
    }

    const tick = () => {
      const parts = toFlashCountdownParts(endAt, new Date());
      setCountdownBlockValue(countdownEls.hours, parts.hours);
      setCountdownBlockValue(countdownEls.minutes, parts.minutes);
      setCountdownBlockValue(countdownEls.seconds, parts.seconds);

      if (parts.isComplete) {
        countdownEls.section.dataset.psFlashCountdownComplete = "true";
      }
    };

    tick();
    const intervalId = window.setInterval(() => {
      tick();
      if (countdownEls.section.dataset.psFlashCountdownComplete === "true") {
        window.clearInterval(intervalId);
      }
    }, 1000);
  } catch (error) {
    console.warn("Unable to hydrate flash sale countdown", error);
  }
}

async function wireIndexAddToCart() {
  if (currentPage() !== "index.html") {
    return;
  }

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


  const candidateButtons = Array.from(document.querySelectorAll("main button")).filter(
    isIndexAddToCartButton
  );

  candidateButtons.forEach((button) => {
    const title = nearestCardTitle(button);
    const normalizedTitle = normalizeText(title);
    const hydratedProductId =
      button.dataset.productId || resolveCardProductIdForButton(button) || null;
    const resolvedProductId = hydratedProductId;

    if (!resolvedProductId) {
      console.warn("Skipping index add-to-cart wiring for card without hydrated product id", {
        title: normalizedTitle
      });
    }

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
  if (window.__PS_PRODUCT_DETAIL_UNAVAILABLE === "true") {
    return;
  }

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
        const state = window.__PS_PRODUCT_DETAIL_STATE || {};
        const cart = await addToCart(
          productId,
          getProductDetailQuantity(),
          typeof state.selectedVariantId === "string" ? state.selectedVariantId : null
        );
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
        const state = window.__PS_PRODUCT_DETAIL_STATE || {};
        const cart = await addToCart(
          productId,
          getProductDetailQuantity(),
          typeof state.selectedVariantId === "string" ? state.selectedVariantId : null
        );
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

function cartItemMarkup(item, options = {}) {
  const isSaved = options.saved === true;

  return `
    <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row gap-6 ambient-shadow transition-transform hover:scale-[1.01] cursor-pointer" data-product-id="${item.productId}" data-cart-item-id="${item.id}" data-cart-item="true" role="link" tabindex="0">
      <div class="w-full sm:w-40 h-40 rounded-lg overflow-hidden flex-shrink-0">
        <img class="w-full h-full object-cover" src="${item.image}" alt="${item.name}" />
      </div>
      <div class="flex-grow flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-on-surface leading-tight">${item.name}</h3>
            <p class="text-sm text-on-surface-variant mt-1">${item.variantName || "Standard"}</p>
          </div>
          <span class="text-xl font-bold text-primary">${toCurrency(
            isSaved ? item.price : item.lineTotal
          )}</span>
        </div>
        <div class="flex items-center justify-between mt-6 gap-4">
          ${
            isSaved
              ? ""
              : `<div class=\"flex items-center bg-surface-container-low rounded-full px-2 py-1\">
            <button data-action=\"decrement\" data-cart-item-id=\"${item.id}\" class=\"w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors\">
              <span class=\"material-symbols-outlined text-sm\">remove</span>
            </button>
            <span class=\"px-4 font-semibold\" data-role=\"qty\">${item.quantity}</span>
            <button data-action=\"increment\" data-cart-item-id=\"${item.id}\" class=\"w-8 h-8 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors\">
              <span class=\"material-symbols-outlined text-sm\">add</span>
            </button>
          </div>`
          }
          <div class="flex gap-4">
            <button data-action="toggle-saved" data-saved-for-later="${isSaved ? "false" : "true"}" data-cart-item-id="${
              item.id
            }" class="text-sm font-medium text-outline hover:text-primary transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-lg">${isSaved ? "shopping_cart" : "bookmark"}</span>
              ${isSaved ? "Move to Cart" : "Save for Later"}
            </button>
            <button data-action="remove" data-cart-item-id="${item.id}" class="text-sm font-medium text-error hover:opacity-70 transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-lg">delete</span> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCartItemsHost() {
  const hooked = document.querySelector('[data-ps-cart-items="true"]');
  if (hooked instanceof HTMLElement) {
    return hooked;
  }

  const legacy = document.querySelector(".lg\\:col-span-8 .space-y-6");
  return legacy instanceof HTMLElement ? legacy : null;
}

function getSavedItemsHost() {
  const hooked = document.querySelector('[data-ps-saved-items="true"]');
  return hooked instanceof HTMLElement ? hooked : null;
}

function getRecommendationsHost() {
  const hooked = document.querySelector('[data-ps-cart-recommendations="true"]');
  return hooked instanceof HTMLElement ? hooked : null;
}

function updateSavedItemsHeading(count) {
  const heading = document.querySelector('[data-ps-saved-items-heading="true"]');
  if (heading instanceof HTMLElement) {
    heading.textContent = `Saved for Later (${count})`;
  }
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
  const itemsHost = getCartItemsHost();

  if (!itemsHost) {
    return;
  }

  if (cart.items.length === 0) {
    itemsHost.innerHTML =
      '<div class="bg-surface-container-lowest rounded-lg p-6 ambient-shadow"><p class="text-on-surface-variant">Your cart is empty.</p></div>';
    return;
  }

  itemsHost.innerHTML = cart.items.map((item) => cartItemMarkup(item)).join("");
}

function renderSavedCartItems(cart) {
  const savedHost = getSavedItemsHost();

  if (!(savedHost instanceof HTMLElement)) {
    return;
  }

  const savedItems = Array.isArray(cart?.savedItems) ? cart.savedItems : [];
  updateSavedItemsHeading(savedItems.length);

  if (savedItems.length === 0) {
    savedHost.innerHTML =
      '<div class="bg-surface-container-low rounded-lg p-4"><p class="text-sm text-on-surface-variant">No saved items yet.</p></div>';
    return;
  }

  savedHost.innerHTML = savedItems
    .map((item) => cartItemMarkup(item, { saved: true }))
    .join("");
}

function recommendationCardMarkup(product) {
  const productId = escapeHtml(product.id);
  const image = escapeHtml(product.image || "");
  const name = escapeHtml(product.name || "Product");
  const description = escapeHtml(product.brand || product.category || "");

  return `
    <div class="bg-surface-container-lowest rounded-lg p-4 ambient-shadow group cursor-pointer hover:scale-[1.02] transition-all" data-ps-cart-recommendation="true" data-product-id="${productId}">
      <div class="aspect-square rounded-lg overflow-hidden mb-4 bg-surface-container-low">
        <img class="w-full h-full object-cover" src="${image}" alt="${name}" />
      </div>
      <h4 class="font-bold text-on-surface group-hover:text-primary transition-colors">${name}</h4>
      <p class="text-sm text-on-surface-variant mb-4">${description || "Shop this product"}</p>
      <div class="flex items-center justify-between">
        <span class="font-black text-primary">${toCurrency(product.price)}</span>
        <button class="bg-tertiary-container text-on-tertiary-container p-2 rounded-full scale-90 group-hover:scale-100 transition-transform" data-action="recommend-add" data-product-id="${productId}">
          <span class="material-symbols-outlined">add_shopping_cart</span>
        </button>
      </div>
    </div>
  `;
}

async function renderCartRecommendations(cart) {
  const recommendationsHost = getRecommendationsHost();

  if (!(recommendationsHost instanceof HTMLElement)) {
    return;
  }

  const excludedIds = new Set(
    [...(Array.isArray(cart?.items) ? cart.items : []), ...(Array.isArray(cart?.savedItems) ? cart.savedItems : [])]
      .map((item) => (item && typeof item.productId === "string" ? item.productId : ""))
      .filter(Boolean)
  );

  try {
    const [dogs, cats, accessories] = await Promise.all([
      apiFetch("/api/products?storefrontPage=dogs"),
      apiFetch("/api/products?storefrontPage=cats"),
      apiFetch("/api/products?storefrontPage=accessories")
    ]);

    const combined = [
      ...(Array.isArray(dogs?.products) ? dogs.products : []),
      ...(Array.isArray(cats?.products) ? cats.products : []),
      ...(Array.isArray(accessories?.products) ? accessories.products : [])
    ];

    const seen = new Set();
    const recommendations = combined
      .filter((product) => {
        const id = typeof product?.id === "string" ? product.id : "";
        if (!id || excludedIds.has(id) || seen.has(id)) {
          return false;
        }

        seen.add(id);
        return true;
      })
      .slice(0, 4);

    if (recommendations.length === 0) {
      recommendationsHost.innerHTML =
        '<div class="col-span-full bg-surface-container-low rounded-lg p-4"><p class="text-sm text-on-surface-variant">No recommendations available right now.</p></div>';
      return;
    }

    recommendationsHost.innerHTML = recommendations.map(recommendationCardMarkup).join("");
  } catch (error) {
    console.warn("Unable to hydrate cart recommendations", error);
  }
}

function refreshCartView(cart) {
  setCartCount(cart && typeof cart.itemCount === "number" ? cart.itemCount : 0);
  renderCartItems(cart);
  renderSavedCartItems(cart);
  updateCartSummary(cart);
  void renderCartRecommendations(cart);
}

async function hydrateCartPage() {
  try {
    const cart = await apiFetch("/api/cart");
    refreshCartView(cart);
    wireCartItemActions();
  } catch (error) {
    console.error(error);
  }
}

function wireCartItemActions() {
  const itemsHost = getCartItemsHost();
  const savedHost = getSavedItemsHost();
  const recommendationsHost = getRecommendationsHost();

  if (!itemsHost) {
    return;
  }

  if (itemsHost.dataset.psCartWired === "true") {
    return;
  }

  itemsHost.dataset.psCartWired = "true";

  const handleCartAction = async (button, currentQty) => {
    const cartItemId = button.dataset.cartItemId;
    const action = button.dataset.action;

    if (!cartItemId || !action) {
      return;
    }

    if (action === "increment") {
      return apiFetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: currentQty + 1 })
      });
    }

    if (action === "decrement") {
      return apiFetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: Math.max(currentQty - 1, 0) })
      });
    }

    if (action === "toggle-saved") {
      return apiFetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        body: JSON.stringify({ savedForLater: button.dataset.savedForLater === "true" })
      });
    }

    return apiFetch(`/api/cart/items/${cartItemId}`, {
      method: "DELETE"
    });
  };

  itemsHost.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const row = target.closest('[data-cart-item="true"]');
    const actionButton = target.closest("button[data-action]");

    if (!actionButton && row instanceof HTMLElement) {
      if (target.closest(STOREFRONT_INTERACTIVE_DESCENDANT_SELECTOR)) {
        return;
      }

      const rowProductId = row.dataset.productId;
      if (rowProductId) {
        window.location.href = buildProductDetailUrl({ productId: rowProductId });
      }
      return;
    }

    const button = actionButton;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const itemRoot = button.closest('[data-cart-item="true"]');
    const qtyEl = itemRoot ? itemRoot.querySelector('[data-role="qty"]') : null;
    const currentQty = Number(qtyEl ? qtyEl.textContent : 1) || 1;

    try {
      const cart = await handleCartAction(button, currentQty);
      refreshCartView(cart);
    } catch (error) {
      console.error(error);
    }
  });

  if (savedHost instanceof HTMLElement && savedHost.dataset.psSavedWired !== "true") {
    savedHost.dataset.psSavedWired = "true";

    savedHost.addEventListener("click", async (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const row = target.closest('[data-cart-item="true"]');
      const actionButton = target.closest("button[data-action]");

      if (!actionButton && row instanceof HTMLElement) {
        if (target.closest(STOREFRONT_INTERACTIVE_DESCENDANT_SELECTOR)) {
          return;
        }

        const rowProductId = row.dataset.productId;
        if (rowProductId) {
          window.location.href = buildProductDetailUrl({ productId: rowProductId });
        }
        return;
      }

      if (!(actionButton instanceof HTMLButtonElement)) {
        return;
      }

      try {
        const cart = await handleCartAction(actionButton, 1);
        refreshCartView(cart);
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (
    recommendationsHost instanceof HTMLElement &&
    recommendationsHost.dataset.psRecommendationsWired !== "true"
  ) {
    recommendationsHost.dataset.psRecommendationsWired = "true";

    recommendationsHost.addEventListener("click", async (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest('button[data-action="recommend-add"]');
      if (button instanceof HTMLButtonElement) {
        const productId = button.dataset.productId;
        if (!productId) {
          return;
        }

        event.preventDefault();

        try {
          const cart = await addToCart(productId, 1);
          refreshCartView(cart);
          await flashAddToCartIcon(button);
        } catch (error) {
          console.error(error);
        }
        return;
      }

      const card = target.closest('[data-ps-cart-recommendation="true"]');
      if (card instanceof HTMLElement) {
        const productId = card.dataset.productId;
        if (productId) {
          window.location.href = buildProductDetailUrl({ productId });
        }
      }
    });
  }

  itemsHost.addEventListener("keydown", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const row = target.closest('[data-cart-item="true"]');
    if (!(row instanceof HTMLElement)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    const rowProductId = row.dataset.productId;

    if (rowProductId) {
      window.location.href = buildProductDetailUrl({ productId: rowProductId });
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
  const createButton = document.querySelector('button[data-ps-admin-users-create]');

  return {
    tableBody,
    searchInput: searchInput instanceof HTMLInputElement ? searchInput : null,
    roleFilter: roleFilter instanceof HTMLSelectElement ? roleFilter : null,
    statusFilter: statusFilter instanceof HTMLSelectElement ? statusFilter : null,
    createButton: createButton instanceof HTMLButtonElement ? createButton : null
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
      const nextRole = window.prompt("Enter role: ADMIN or STAFF", defaultRole);

      if (!nextRole) {
        return;
      }

      const normalizedRole = nextRole.trim().toUpperCase();

      if (!["ADMIN", "STAFF"].includes(normalizedRole)) {
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

  if (controls.createButton) {
    controls.createButton.addEventListener("click", async () => {
      const email = window.prompt("Email for new internal user:", "");
      if (!email) {
        return;
      }

      const role = (window.prompt("Role (ADMIN or STAFF):", "STAFF") || "")
        .trim()
        .toUpperCase();
      if (!["ADMIN", "STAFF"].includes(role)) {
        alert("Role must be ADMIN or STAFF.");
        return;
      }

      const password = window.prompt("Temporary password (min 8 chars):", "");
      if (!password || password.length < 8) {
        alert("Password must be at least 8 characters.");
        return;
      }

      try {
        const result = await withAdminAuth(() =>
          apiFetch("/api/admin/users", {
            method: "POST",
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              role,
              password,
              status: "ENABLED"
            })
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
            : "Unable to create internal user";
        alert(message);
      }
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

function formatDateShort(isoDate) {
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

function hydrateCustomerRow(template, customer) {
  const row = template.content.firstElementChild
    ? template.content.firstElementChild.cloneNode(true)
    : null;

  if (!(row instanceof HTMLElement)) {
    return null;
  }

  const email = typeof customer.email === "string" ? customer.email : "";
  const displayName = displayNameFromEmail(email) || "Customer";
  const status = normalizeText(customer.status).toUpperCase() || "DISABLED";

  const nameEl = row.querySelector("[data-ps-admin-customer-name]");
  const emailEl = row.querySelector("[data-ps-admin-customer-email]");
  const statusEl = row.querySelector("[data-ps-admin-customer-status]");
  const orderCountEl = row.querySelector("[data-ps-admin-customer-order-count]");
  const totalSpendEl = row.querySelector("[data-ps-admin-customer-total-spend]");
  const lastOrderEl = row.querySelector("[data-ps-admin-customer-last-order]");
  const joinedEl = row.querySelector("[data-ps-admin-customer-joined]");
  const viewLink = row.querySelector("[data-ps-admin-customer-view]");
  const noteButton = row.querySelector("[data-ps-admin-customer-note]");

  if (nameEl instanceof HTMLElement) {
    nameEl.textContent = displayName;
  }
  if (emailEl instanceof HTMLElement) {
    emailEl.textContent = email || "-";
  }
  if (statusEl instanceof HTMLElement) {
    statusEl.textContent = status === "ENABLED" ? "Enabled" : "Disabled";
    statusEl.classList.toggle("bg-tertiary-container", status === "ENABLED");
    statusEl.classList.toggle("text-on-tertiary-container", status === "ENABLED");
    statusEl.classList.toggle("bg-surface-container", status !== "ENABLED");
    statusEl.classList.toggle("text-on-surface-variant", status !== "ENABLED");
  }
  if (orderCountEl instanceof HTMLElement) {
    orderCountEl.textContent = "-";
  }
  if (totalSpendEl instanceof HTMLElement) {
    totalSpendEl.textContent = "-";
  }
  if (lastOrderEl instanceof HTMLElement) {
    lastOrderEl.textContent = "-";
  }
  if (joinedEl instanceof HTMLElement) {
    joinedEl.textContent = formatDateShort(customer.createdAt);
  }
  if (viewLink instanceof HTMLAnchorElement) {
    viewLink.href = "/admin-users.html";
    viewLink.title = `Open internal account manager for ${displayName}`;
  }
  if (noteButton instanceof HTMLButtonElement) {
    noteButton.addEventListener("click", () => {
      window.alert("Customer notes are not implemented yet.");
    });
  }

  return row;
}

async function hydrateAdminCustomersPage() {
  const tbody = document.querySelector("tbody[data-ps-admin-customers-tbody]");
  const rowTemplate = document.querySelector("template[data-ps-admin-customers-row-template]");
  const searchInput = document.querySelector("input[data-ps-admin-customers-search]");
  const statusFilter = document.querySelector("select[data-ps-admin-customers-status-filter]");
  const sortSelect = document.querySelector("select[data-ps-admin-customers-sort]");
  const segmentButtons = Array.from(
    document.querySelectorAll("button[data-ps-admin-customers-segment]")
  );
  const resultCount = document.querySelector("[data-ps-admin-customers-results-count]");

  if (!(tbody instanceof HTMLElement) || !(rowTemplate instanceof HTMLTemplateElement)) {
    return;
  }

  const metrics = {
    total: document.querySelector('[data-ps-admin-customers-metric="total"]'),
    active30: document.querySelector('[data-ps-admin-customers-metric="active30"]'),
    new7: document.querySelector('[data-ps-admin-customers-metric="new7"]'),
    atRisk: document.querySelector('[data-ps-admin-customers-metric="atRisk"]')
  };

  const state = {
    q: "",
    status: "ALL",
    sort: "RECENT_ACTIVITY",
    segment: "ALL"
  };

  const now = new Date();
  let customers = [];

  const isWithinDays = (isoDate, days) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return now.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
  };

  const applyFilters = () => {
    const query = normalizeText(state.q);

    let filtered = customers.filter((customer) => {
      const email = normalizeText(customer.email);
      const name = normalizeText(displayNameFromEmail(customer.email));
      if (query && !email.includes(query) && !name.includes(query)) {
        return false;
      }

      const enabled = normalizeText(customer.status).toUpperCase() === "ENABLED";
      if (state.status === "ACTIVE" && !enabled) {
        return false;
      }
      if (state.status === "DISABLED" && enabled) {
        return false;
      }
      if (state.status === "INACTIVE" && (!enabled || isWithinDays(customer.updatedAt, 30))) {
        return false;
      }

      if (state.segment === "NEEDS_FOLLOWUP" && !enabled) {
        return false;
      }

      return true;
    });

    if (state.sort === "CREATED_AT") {
      filtered = filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      filtered = filtered.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    tbody.innerHTML = "";
    filtered.forEach((customer) => {
      const row = hydrateCustomerRow(rowTemplate, customer);
      if (row instanceof HTMLElement) {
        tbody.appendChild(row);
      }
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td class="px-6 py-6 text-sm text-on-surface-variant" colspan="7">No customers found.</td></tr>';
    }

    if (resultCount instanceof HTMLElement) {
      resultCount.textContent = String(filtered.length);
    }
  };

  try {
    const payload = await withAdminAuth(() =>
      apiFetch("/api/admin/users?role=CUSTOMER&limit=500")
    );

    if (!payload) {
      return;
    }

    customers = Array.isArray(payload.users) ? payload.users : [];

    const total = customers.length;
    const active30 = customers.filter(
      (entry) => normalizeText(entry.status).toUpperCase() === "ENABLED" && isWithinDays(entry.updatedAt, 30)
    ).length;
    const new7 = customers.filter((entry) => isWithinDays(entry.createdAt, 7)).length;
    const atRisk = customers.filter(
      (entry) => normalizeText(entry.status).toUpperCase() === "ENABLED" && !isWithinDays(entry.updatedAt, 60)
    ).length;

    if (metrics.total instanceof HTMLElement) {
      metrics.total.textContent = String(total);
    }
    if (metrics.active30 instanceof HTMLElement) {
      metrics.active30.textContent = String(active30);
    }
    if (metrics.new7 instanceof HTMLElement) {
      metrics.new7.textContent = String(new7);
    }
    if (metrics.atRisk instanceof HTMLElement) {
      metrics.atRisk.textContent = String(atRisk);
    }

    applyFilters();
  } catch (error) {
    console.error(error);
    tbody.innerHTML =
      '<tr><td class="px-6 py-6 text-sm text-on-surface-variant" colspan="7">Unable to load customers.</td></tr>';
  }

  if (searchInput instanceof HTMLInputElement) {
    let debounceId = 0;
    searchInput.addEventListener("input", () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        state.q = searchInput.value;
        applyFilters();
      }, 180);
    });
  }

  if (statusFilter instanceof HTMLSelectElement) {
    statusFilter.addEventListener("change", () => {
      state.status = statusFilter.value.toUpperCase();
      applyFilters();
    });
  }

  if (sortSelect instanceof HTMLSelectElement) {
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      applyFilters();
    });
  }

  segmentButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", () => {
      state.segment = String(button.dataset.psAdminCustomersSegment || "ALL").toUpperCase();
      segmentButtons.forEach((entry) => {
        if (!(entry instanceof HTMLButtonElement)) {
          return;
        }

        const active =
          String(entry.dataset.psAdminCustomersSegment || "ALL").toUpperCase() ===
          state.segment;
        entry.setAttribute("aria-pressed", active ? "true" : "false");
        entry.classList.toggle("bg-white", active);
        entry.classList.toggle("text-on-surface", active);
        entry.classList.toggle("text-on-surface-variant", !active);
      });
      applyFilters();
    });
  });
}

function adminVariantPanelMarkup(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  if (variants.length === 0) {
    return '<div class="mt-2 text-xs text-on-surface-variant">No variants configured.</div>';
  }

  const rows = variants
    .map((variant) => {
      const variantId = escapeHtml(String(variant.id || ""));
      const variantName = escapeHtml(String(variant.name || "Variant"));
      const variantPrice = Number.isFinite(Number(variant.price))
        ? Number(variant.price).toFixed(2)
        : "";
      const variantOriginalPrice =
        variant.originalPrice === null || variant.originalPrice === undefined
          ? ""
          : Number.isFinite(Number(variant.originalPrice))
            ? Number(variant.originalPrice).toFixed(2)
            : "";
      const variantStockQty =
        variant.stockQty === null || variant.stockQty === undefined
          ? ""
          : Number.isFinite(Number(variant.stockQty))
            ? String(Number(variant.stockQty))
            : "";

      return `
        <div class="grid grid-cols-[1fr_96px_96px_84px] items-center gap-2">
          <label class="text-xs text-on-surface-variant truncate" title="${variantName}">${variantName}</label>
          <input class="w-full rounded border border-outline-variant px-2 py-1 text-xs" data-role="variant-price" data-variant-id="${variantId}" type="number" step="0.01" min="0" value="${variantPrice}" />
          <input class="w-full rounded border border-outline-variant px-2 py-1 text-xs" data-role="variant-original-price" data-variant-id="${variantId}" type="number" step="0.01" min="0" placeholder="Original" value="${variantOriginalPrice}" />
          <input class="w-full rounded border border-outline-variant px-2 py-1 text-xs" data-role="variant-stock-qty" data-variant-id="${variantId}" type="number" step="1" min="0" placeholder="Stock" value="${variantStockQty}" />
        </div>
      `;
    })
    .join("");

  return `
    <div class="mt-2 hidden rounded-lg border border-outline-variant/40 bg-surface-container-low p-2 space-y-2" data-role="variant-panel">
      ${rows}
      <div class="flex items-center justify-end">
        <button class="px-2 py-1 text-xs font-semibold rounded border border-outline-variant text-primary" data-action="save-variant-prices" data-product-id="${escapeHtml(
          product.id
        )}" type="button">Save Variant Prices</button>
      </div>
    </div>
  `;
}

function toAdminProductRow(product, isSelected) {
  const productName = escapeHtml(product.name);
  const productImage = escapeHtml(product.image || "");
  const sku = escapeHtml(product.sku || "-");
  const category = escapeHtml(product.category || "-");
  const enabled = product && product.enabled !== false;
  const stockQty =
    product.stockQty === null || product.stockQty === undefined
      ? "-"
      : escapeHtml(String(product.stockQty));
  const storefrontPages = Array.isArray(product.storefrontPages)
    ? product.storefrontPages
    : Array.isArray(product.placements)
      ? product.placements
          .map((placement) =>
            placement && typeof placement.storefrontPage === "string"
              ? placement.storefrontPage
              : ""
          )
          .filter(Boolean)
      : [];
  const visiblePages = Array.from(
    new Set(
      storefrontPages
        .filter((page) => typeof page === "string" && page.trim().length > 0)
        .map((page) => page.trim())
    )
  );
  const pagesMarkup =
    visiblePages.length === 0
      ? '<span class="text-xs text-on-surface-variant">-</span>'
      : `<div class="flex flex-wrap gap-1">${visiblePages
          .map((page) => {
            const displayPage = escapeHtml(
              page
                .replace(/[-_]+/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
            );
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface-variant">${displayPage}</span>`;
          })
          .join("")}</div>`;
  const productId = encodeURIComponent(product.id);

  return `
    <tr class="hover:bg-surface-container-low/30 transition-colors group">
      <td class="px-6 py-4">
        <input class="rounded border-outline-variant text-primary focus:ring-primary/20" data-action="select-product" data-product-id="${escapeHtml(
          product.id
        )}" type="checkbox" ${isSelected ? "checked" : ""}/>
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
      <td class="px-6 py-4 text-sm font-bold text-on-surface align-top">
        <div>${toCurrency(product.price)}</div>
        <button class="mt-1 text-xs font-semibold text-primary underline" data-action="toggle-variants" data-product-id="${escapeHtml(
          product.id
        )}" type="button">Show variants</button>
        ${adminVariantPanelMarkup(product)}
      </td>
      <td class="px-6 py-4 text-sm text-on-surface">${stockQty}</td>
      <td class="px-6 py-4">${pagesMarkup}</td>
      <td class="px-6 py-4 text-center">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
          enabled
            ? "bg-tertiary-container text-on-tertiary-container"
            : "bg-surface-container text-on-surface-variant"
        }">${enabled ? "Public" : "Hidden"}</span>
      </td>
      <td class="px-6 py-4 text-center">
        <input class="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20" data-action="toggle-enabled" data-product-id="${escapeHtml(
          product.id
        )}" type="checkbox" ${enabled ? "checked" : ""}/>
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
  const selectAllCheckbox = document.querySelector('input[data-ps-admin-products-select-all]');
  const bulkDeleteButton = document.querySelector('button[data-ps-admin-products-bulk-delete]');
  const paginationRoot = document.querySelector('[data-ps-admin-products-pagination]');
  const paginationSummary = document.querySelector(
    '[data-ps-admin-products-pagination-summary]'
  );
  const prevButton = document.querySelector('[data-ps-admin-products-page-prev]');
  const nextButton = document.querySelector('[data-ps-admin-products-page-next]');
  const pageButtons = Array.from(
    document.querySelectorAll('button[data-ps-admin-products-page-btn]')
  );
  const pageSize = 10;

  if (!tableBody) {
    return;
  }

  try {
    const payload = await withAdminAuth(() => apiFetch("/api/admin/products"));

    if (!payload) {
      return;
    }

    let products = Array.isArray(payload.products) ? payload.products : [];
    let currentPage = 1;
    let currentQuery = "";
    const selectedIds = new Set();

    const getVisibleProducts = (query = "") => {
      const normalizedQuery = normalizeText(query);

      if (normalizedQuery.length === 0) {
        return products;
      }

      return products.filter((product) => {
        const name = normalizeText(product && product.name);
        const sku = normalizeText(product && product.sku);
        const category = normalizeText(product && product.category);
        return (
          name.includes(normalizedQuery) ||
          sku.includes(normalizedQuery) ||
          category.includes(normalizedQuery)
        );
      });
    };

    const setButtonState = (button, enabled) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      button.disabled = !enabled;
      button.classList.toggle("opacity-40", !enabled);
      button.classList.toggle("cursor-not-allowed", !enabled);
    };

    const setPageButtonActive = (button, isActive) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      button.classList.toggle("bg-primary", isActive);
      button.classList.toggle("text-white", isActive);
      button.classList.toggle("bg-surface-container-lowest", !isActive);
      button.classList.toggle("text-on-surface", !isActive);
      button.classList.toggle("border", !isActive);
      button.classList.toggle("border-outline-variant/30", !isActive);
    };

    const pagedProductsForCurrentState = () => {
      const visibleProducts = getVisibleProducts(currentQuery);
      const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      return visibleProducts.slice(startIndex, startIndex + pageSize);
    };

    const syncSelectAllCheckbox = () => {
      if (!(selectAllCheckbox instanceof HTMLInputElement)) {
        return;
      }

      const pagedProducts = pagedProductsForCurrentState();
      if (pagedProducts.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
      }

      const selectedCount = pagedProducts.filter((product) => selectedIds.has(product.id)).length;
      selectAllCheckbox.checked = selectedCount === pagedProducts.length;
      selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < pagedProducts.length;
    };

    const syncBulkDeleteButton = () => {
      if (!(bulkDeleteButton instanceof HTMLButtonElement)) {
        return;
      }

      bulkDeleteButton.disabled = selectedIds.size === 0;
      bulkDeleteButton.classList.toggle("opacity-50", selectedIds.size === 0);
      bulkDeleteButton.classList.toggle("cursor-not-allowed", selectedIds.size === 0);
    };

    const updatePaginationUi = (totalItems, totalPages) => {
      const safeTotalPages = Math.max(1, totalPages);
      const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);
      const maxNumberButtons = pageButtons.length;
      const halfWindow = Math.floor(maxNumberButtons / 2);
      const windowStart =
        safeTotalPages <= maxNumberButtons
          ? 1
          : Math.min(
              Math.max(currentPage - halfWindow, 1),
              Math.max(1, safeTotalPages - maxNumberButtons + 1)
            );

      if (paginationSummary instanceof HTMLElement) {
        paginationSummary.textContent = `Showing ${start}-${end} of ${totalItems} products`;
      }

      setButtonState(prevButton, totalItems > 0 && currentPage > 1);
      setButtonState(nextButton, totalItems > 0 && currentPage < safeTotalPages);

      pageButtons.forEach((button, index) => {
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        const pageNumber = windowStart + index;
        button.dataset.page = String(pageNumber);
        button.textContent = String(pageNumber);

        const pageAvailable = pageNumber <= safeTotalPages;
        button.classList.toggle("hidden", !pageAvailable);

        if (!pageAvailable) {
          button.disabled = true;
          setPageButtonActive(button, false);
          return;
        }

        button.disabled = false;
        setPageButtonActive(button, pageNumber === currentPage);
      });

      if (paginationRoot instanceof HTMLElement) {
        paginationRoot.classList.toggle("hidden", totalItems === 0);
      }
    };

    const renderProducts = () => {
      const visibleProducts = getVisibleProducts(currentQuery);
      const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
      currentPage = Math.min(Math.max(currentPage, 1), totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pagedProducts = visibleProducts.slice(startIndex, startIndex + pageSize);

      if (visibleProducts.length === 0) {
        tableBody.innerHTML =
          '<tr><td class="px-6 py-4 text-sm text-on-surface-variant" colspan="10">No products found.</td></tr>';
        updatePaginationUi(0, 1);
        syncSelectAllCheckbox();
        syncBulkDeleteButton();
        return;
      }

      tableBody.innerHTML = pagedProducts
        .map((product) => toAdminProductRow(product, selectedIds.has(product.id)))
        .join("");
      updatePaginationUi(visibleProducts.length, totalPages);
      syncSelectAllCheckbox();
      syncBulkDeleteButton();
    };

    renderProducts();

    if (selectAllCheckbox instanceof HTMLInputElement) {
      selectAllCheckbox.addEventListener("change", () => {
        const pagedProducts = pagedProductsForCurrentState();
        pagedProducts.forEach((product) => {
          if (selectAllCheckbox.checked) {
            selectedIds.add(product.id);
          } else {
            selectedIds.delete(product.id);
          }
        });

        renderProducts();
      });
    }

    if (prevButton instanceof HTMLButtonElement) {
      prevButton.addEventListener("click", () => {
        if (currentPage <= 1) {
          return;
        }

        currentPage -= 1;
        renderProducts();
      });
    }

    if (nextButton instanceof HTMLButtonElement) {
      nextButton.addEventListener("click", () => {
        currentPage += 1;
        renderProducts();
      });
    }

    pageButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      button.addEventListener("click", () => {
        const targetPage = Number.parseInt(button.dataset.page || "", 10);
        if (!Number.isFinite(targetPage) || targetPage < 1) {
          return;
        }

        currentPage = targetPage;
        renderProducts();
      });
    });

    if (searchInput) {
      let debounceId = 0;

      searchInput.addEventListener("input", () => {
        window.clearTimeout(debounceId);
        debounceId = window.setTimeout(() => {
          currentQuery = searchInput.value.trim();
          currentPage = 1;
          renderProducts();
        }, 200);
      });
    }

    const deleteProducts = async (productIds) => {
      const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));

      if (uniqueIds.length === 0) {
        return;
      }

      for (const productId of uniqueIds) {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
            method: "DELETE"
          })
        );

        if (!result) {
          return;
        }
      }

      products = products.filter((product) => !uniqueIds.includes(product.id));
      uniqueIds.forEach((productId) => selectedIds.delete(productId));
      renderProducts();
    };

    if (bulkDeleteButton instanceof HTMLButtonElement) {
      syncBulkDeleteButton();

      bulkDeleteButton.addEventListener("click", async () => {
        const productIds = Array.from(selectedIds);
        if (productIds.length === 0) {
          return;
        }

        if (!window.confirm(`Delete ${productIds.length} selected product(s)?`)) {
          return;
        }

        try {
          await deleteProducts(productIds);
        } catch (error) {
          console.error(error);
          alert((error && error.message) || "Unable to delete selected products");
        }
      });
    }

    tableBody.addEventListener("change", async (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.dataset.action === "select-product") {
        const productId = target.dataset.productId;

        if (!productId) {
          return;
        }

        if (target.checked) {
          selectedIds.add(productId);
        } else {
          selectedIds.delete(productId);
        }

        syncSelectAllCheckbox();
        syncBulkDeleteButton();
        return;
      }

      if (target.dataset.action === "toggle-enabled") {
        const productId = target.dataset.productId;

        if (!productId) {
          return;
        }

        const nextEnabled = target.checked;

        try {
          const result = await withAdminAuth(() =>
            apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
              method: "PATCH",
              body: JSON.stringify({ enabled: nextEnabled })
            })
          );

          if (!result || !result.product) {
            return;
          }

          products = products.map((product) =>
            product.id === productId ? { ...product, enabled: nextEnabled } : product
          );
          renderProducts();
        } catch (error) {
          target.checked = !nextEnabled;
          console.error(error);
          alert((error && error.message) || "Unable to update product visibility");
        }
      }
    });

    tableBody.addEventListener("click", async (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const toggleVariantsButton = target.closest('button[data-action="toggle-variants"]');
      if (toggleVariantsButton instanceof HTMLButtonElement) {
        const row = toggleVariantsButton.closest("tr");
        const panel = row instanceof HTMLElement ? row.querySelector('[data-role="variant-panel"]') : null;

        if (panel instanceof HTMLElement) {
          const nextHidden = !panel.classList.contains("hidden");
          panel.classList.toggle("hidden", nextHidden);
          toggleVariantsButton.textContent = nextHidden ? "Show variants" : "Hide variants";
        }

        return;
      }

      const saveVariantsButton = target.closest('button[data-action="save-variant-prices"]');
      if (saveVariantsButton instanceof HTMLButtonElement) {
        const productId = saveVariantsButton.dataset.productId;
        if (!productId) {
          return;
        }

        const product = products.find((entry) => entry.id === productId);
        if (!product) {
          return;
        }

        const row = saveVariantsButton.closest("tr");
        const priceInputs = row
          ? Array.from(row.querySelectorAll('input[data-role="variant-price"][data-variant-id]'))
          : [];
        const originalPriceInputs = row
          ? Array.from(
              row.querySelectorAll('input[data-role="variant-original-price"][data-variant-id]')
            )
          : [];
        const stockQtyInputs = row
          ? Array.from(row.querySelectorAll('input[data-role="variant-stock-qty"][data-variant-id]'))
          : [];

        const nextVariants = (Array.isArray(product.variants) ? product.variants : []).map(
          (variant, index) => {
            const matchingInput = priceInputs.find(
              (input) =>
                input instanceof HTMLInputElement &&
                input.dataset.variantId === String(variant.id || "")
            );
            const matchingOriginalPriceInput = originalPriceInputs.find(
              (input) =>
                input instanceof HTMLInputElement &&
                input.dataset.variantId === String(variant.id || "")
            );
            const matchingStockQtyInput = stockQtyInputs.find(
              (input) =>
                input instanceof HTMLInputElement &&
                input.dataset.variantId === String(variant.id || "")
            );
            const parsedPrice =
              matchingInput instanceof HTMLInputElement ? Number(matchingInput.value) : variant.price;
            const parsedOriginalPrice =
              matchingOriginalPriceInput instanceof HTMLInputElement &&
              matchingOriginalPriceInput.value.trim()
                ? Number(matchingOriginalPriceInput.value)
                : null;
            const parsedStockQty =
              matchingStockQtyInput instanceof HTMLInputElement && matchingStockQtyInput.value.trim()
                ? Number(matchingStockQtyInput.value)
                : null;

            return {
              id: variant.id,
              name: variant.name,
              enabled: variant.enabled !== false,
              sortOrder:
                typeof variant.sortOrder === "number" && Number.isFinite(variant.sortOrder)
                  ? variant.sortOrder
                  : index,
              price: parsedPrice,
              originalPrice: parsedOriginalPrice,
              stockQty: parsedStockQty
            };
          }
        );

        if (
          nextVariants.some(
            (variant) =>
              !Number.isFinite(variant.price) ||
              variant.price < 0 ||
              (variant.originalPrice !== null &&
                (!Number.isFinite(variant.originalPrice) || variant.originalPrice < variant.price)) ||
              (variant.stockQty !== null &&
                (!Number.isInteger(variant.stockQty) || variant.stockQty < 0))
          )
        ) {
          alert("Variant values must be valid: sale >= 0, original >= sale, stock integer >= 0.");
          return;
        }

        const previousLabel = saveVariantsButton.textContent;
        saveVariantsButton.disabled = true;
        saveVariantsButton.textContent = "Saving...";

        try {
          const result = await withAdminAuth(() =>
            apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
              method: "PATCH",
              body: JSON.stringify({ variants: nextVariants })
            })
          );

          if (!result || !result.product) {
            return;
          }

          products = products.map((entry) =>
            entry.id === productId ? result.product : entry
          );
          renderProducts();
        } catch (error) {
          console.error(error);
          alert((error && error.message) || "Unable to save variant prices");
        } finally {
          saveVariantsButton.disabled = false;
          saveVariantsButton.textContent = previousLabel || "Save Variant Prices";
        }

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
        await deleteProducts([productId]);
      } catch (error) {
        console.error(error);
        alert((error && error.message) || "Unable to delete product");
      }
    });
  } catch (error) {
    console.error(error);
  }
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

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    control.checked = Boolean(value);
    return;
  }

  control.value = value == null ? "" : String(value);
}

function getAdminStorefrontPageCheckboxes() {
  return Array.from(document.querySelectorAll("[data-ps-admin-storefront-page]"))
    .filter((entry) => entry instanceof HTMLInputElement && entry.type === "checkbox");
}

function readAdminStorefrontPages() {
  const selected = getAdminStorefrontPageCheckboxes()
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => String(checkbox.dataset.psAdminStorefrontPage || "").trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(selected));
}

function setAdminStorefrontPages(pages) {
  const normalized = new Set(
    (Array.isArray(pages) ? pages : [])
      .map((page) => String(page || "").trim().toLowerCase())
      .filter(Boolean)
  );

  getAdminStorefrontPageCheckboxes().forEach((checkbox) => {
    const page = String(checkbox.dataset.psAdminStorefrontPage || "").trim().toLowerCase();
    checkbox.checked = normalized.has(page);
  });
}

function normalizeAdminVariants(variants) {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .map((variant, index) => ({
      id:
        typeof variant?.id === "string" && variant.id.trim()
          ? variant.id.trim()
          : null,
      name: String(variant?.name || "").trim(),
      price: Number(variant?.price),
      originalPrice:
        variant?.originalPrice === null || variant?.originalPrice === undefined || variant?.originalPrice === ""
          ? null
          : Number(variant.originalPrice),
      stockQty:
        variant?.stockQty === null || variant?.stockQty === undefined || variant?.stockQty === ""
          ? null
          : Number(variant.stockQty),
      enabled: variant?.enabled === undefined ? true : variant.enabled === true,
      sortOrder: index
    }))
    .filter((variant) => {
      if (!variant.name || !Number.isFinite(variant.price) || variant.price < 0) {
        return false;
      }

      if (
        variant.originalPrice !== null &&
        (!Number.isFinite(variant.originalPrice) || variant.originalPrice < variant.price)
      ) {
        return false;
      }

      if (
        variant.stockQty !== null &&
        (!Number.isInteger(variant.stockQty) || variant.stockQty < 0)
      ) {
        return false;
      }

      return true;
    });
}

function renderAdminVariantList(listEl, variants) {
  if (!(listEl instanceof HTMLElement)) {
    return;
  }

  if (!Array.isArray(variants) || variants.length === 0) {
    listEl.innerHTML =
      '<div class="text-xs text-on-surface-variant rounded-xl bg-surface-container-low px-3 py-2">No variants configured. Add one to support option-based pricing.</div>';
    return;
  }

  listEl.innerHTML = variants
    .map((variant, index) => {
      const safeName = escapeHtml(String(variant?.name || ""));
      const safePrice = Number.isFinite(Number(variant?.price)) ? Number(variant.price).toFixed(2) : "";
      const safeOriginalPrice =
        variant?.originalPrice === null || variant?.originalPrice === undefined
          ? ""
          : Number.isFinite(Number(variant.originalPrice))
            ? Number(variant.originalPrice).toFixed(2)
            : "";
      const safeStockQty =
        variant?.stockQty === null || variant?.stockQty === undefined
          ? ""
          : Number.isFinite(Number(variant.stockQty))
            ? String(Number(variant.stockQty))
            : "";

      return `
        <div class="grid grid-cols-12 gap-2 items-center rounded-xl bg-surface-container-low px-3 py-3" data-variant-index="${index}">
          <input class="col-span-4 rounded-lg border-outline-variant" data-variant-field="name" placeholder="Label" type="text" value="${safeName}" />
          <input class="col-span-2 rounded-lg border-outline-variant" data-variant-field="price" min="0" step="0.01" placeholder="Sale" type="number" value="${safePrice}" />
          <input class="col-span-2 rounded-lg border-outline-variant" data-variant-field="originalPrice" min="0" step="0.01" placeholder="Original" type="number" value="${safeOriginalPrice}" />
          <input class="col-span-2 rounded-lg border-outline-variant" data-variant-field="stockQty" min="0" step="1" placeholder="Stock" type="number" value="${safeStockQty}" />
          <div class="col-span-2 flex items-center justify-end gap-1">
            ${variant?.id ? '<span class="text-[10px] text-on-surface-variant">Saved</span>' : ""}
            <button class="px-2 py-1 text-xs rounded border border-outline-variant text-error" data-variant-action="remove" type="button">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function collectAdminProductFormPayload(formFields, variants) {
  const name = formFields.name?.value.trim();
  const rawCategory = formFields.category?.value || "dogs";
  const rawPriceValue =
    formFields.price instanceof HTMLInputElement ? formFields.price.value.trim() : "";
  const price = rawPriceValue === "" ? null : Number(rawPriceValue);
  const stockQtyText = formFields.stockQty?.value.trim() || "";
  const stockQty = stockQtyText === "" ? null : Number(stockQtyText);

  return {
    name,
    sku: formFields.sku?.value.trim() || null,
    brand: formFields.brand?.value.trim() || null,
    category: categoryToStoreValue(rawCategory),
    storefrontPages: readAdminStorefrontPages(),
    enabled:
      formFields.enabled instanceof HTMLInputElement && formFields.enabled.type === "checkbox"
        ? formFields.enabled.checked
        : true,
    flashSaleEligible:
      formFields.flashSaleEligible instanceof HTMLInputElement &&
      formFields.flashSaleEligible.type === "checkbox"
        ? formFields.flashSaleEligible.checked
        : false,
    bestSeller:
      formFields.bestSeller instanceof HTMLInputElement &&
      formFields.bestSeller.type === "checkbox"
        ? formFields.bestSeller.checked
        : false,
    ...(price === null ? {} : { price }),
    description: formFields.description?.value.trim() || null,
    stockQty,
    dogLifeStage: formFields.dogLifeStage?.value.trim() || null,
    dogBreedSize: formFields.dogBreedSize?.value.trim() || null,
    catAge: formFields.catAge?.value.trim() || null,
    catType: formFields.catType?.value.trim() || null,
    variants: normalizeAdminVariants(variants)
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
    dogLifeStage: findAdminProductField("dogLifeStage", "Life Stage"),
    dogBreedSize: findAdminProductField("dogBreedSize", "Breed Size"),
    catAge: findAdminProductField("catAge", "Filter by Age"),
    catType: findAdminProductField("catType", "Type"),
    enabled: findAdminProductField("enabled", "Public"),
    flashSaleEligible: findAdminProductField("flashSaleEligible", "Flash Sale Eligible"),
    bestSeller: findAdminProductField("bestSeller", "Best Sellers"),
    price: findAdminProductField("price", "Base Price"),
    description: findAdminProductField("description", "Product Story"),
    stockQty: findAdminProductField("stockQty", "Current Stock")
  };
  const imageInput = document.querySelector('[data-ps-admin-product-image-input="true"]');
  const addImageButton = document.querySelector('[data-ps-admin-product-image-add="true"]');
  const imagesList = document.querySelector('[data-ps-admin-product-images-list="true"]');
  const addVariantButton = document.querySelector('[data-ps-admin-variant-add="true"]');
  const variantsList = document.querySelector('[data-ps-admin-variants-list="true"]');
  const imageState = {
    urls: []
  };
  const variantState = {
    rows: []
  };

  if (!saveButton || !formFields.name || !formFields.category) {
    return;
  }

  const ensureDefaultVariantRow = () => {
    if (variantState.rows.length > 0) {
      return;
    }

    const fallbackPrice =
      formFields.price instanceof HTMLInputElement && formFields.price.value.trim()
        ? Number(formFields.price.value)
        : 0;

    variantState.rows.push({
      id: null,
      name: "Default",
      price: Number.isFinite(fallbackPrice) && fallbackPrice >= 0 ? fallbackPrice : 0,
      originalPrice: null,
      stockQty: null,
      enabled: true,
      sortOrder: 0
    });
  };

  const renderImages = () => {
    renderAdminProductImageList(imagesList, imageState.urls);
  };

  const renderVariants = () => {
    ensureDefaultVariantRow();
    renderAdminVariantList(variantsList, variantState.rows);
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

  if (addVariantButton instanceof HTMLButtonElement) {
    addVariantButton.addEventListener("click", () => {
      variantState.rows.push({
        id: null,
        name: "",
        price: Number(formFields.price?.value || 0),
        originalPrice: null,
        stockQty: null,
        enabled: true,
        sortOrder: variantState.rows.length
      });
      renderVariants();
    });
  }

  if (variantsList instanceof HTMLElement) {
    variantsList.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const button = target.closest("button[data-variant-action]");
      const row = target.closest("[data-variant-index]");

      if (!(button instanceof HTMLButtonElement) || !(row instanceof HTMLElement)) {
        return;
      }

      const index = Number(row.dataset.variantIndex);
      if (!Number.isInteger(index) || index < 0 || index >= variantState.rows.length) {
        return;
      }

      const action = button.dataset.variantAction;
      if (action === "remove") {
        variantState.rows.splice(index, 1);
      }

      renderVariants();
    });

    variantsList.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const row = target.closest("[data-variant-index]");
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const index = Number(row.dataset.variantIndex);
      if (!Number.isInteger(index) || index < 0 || index >= variantState.rows.length) {
        return;
      }

      if (target.dataset.variantField === "name") {
        variantState.rows[index].name = target.value;
      }

      if (target.dataset.variantField === "price") {
        variantState.rows[index].price = Number(target.value);
      }

      if (target.dataset.variantField === "originalPrice") {
        variantState.rows[index].originalPrice = target.value.trim() ? Number(target.value) : null;
      }

      if (target.dataset.variantField === "stockQty") {
        variantState.rows[index].stockQty = target.value.trim() ? Number(target.value) : null;
      }
    });
  }

  renderImages();
  renderVariants();

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
        setControlValue(formFields.enabled, product.enabled);
        setControlValue(formFields.flashSaleEligible, product.flashSaleEligible);
        setControlValue(formFields.bestSeller, product.bestSeller);
        setControlValue(formFields.price, product.price);
        setControlValue(formFields.description, product.description);
        setControlValue(formFields.stockQty, product.stockQty);
        setControlValue(formFields.dogLifeStage, product.dogLifeStage);
        setControlValue(formFields.dogBreedSize, product.dogBreedSize);
        setControlValue(formFields.catAge, product.catAge);
        setControlValue(formFields.catType, product.catType);
        setAdminStorefrontPages(product.storefrontPages);
        imageState.urls = readProductImageUrls(product);
        variantState.rows = Array.isArray(product.variants)
          ? product.variants.map((variant) => ({
              id: variant.id || null,
              name: variant.name || "",
              price: Number(variant.price || 0),
              originalPrice:
                variant.originalPrice === null || variant.originalPrice === undefined
                  ? null
                  : Number(variant.originalPrice),
              stockQty:
                variant.stockQty === null || variant.stockQty === undefined
                  ? null
                  : Number(variant.stockQty),
              enabled: variant.enabled !== false,
              sortOrder: Number.isFinite(Number(variant.sortOrder)) ? Number(variant.sortOrder) : 0
            }))
          : [];
        renderImages();
        renderVariants();
      }
    } catch (error) {
      console.error(error);
    }
  }

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const payload = {
      ...collectAdminProductFormPayload(formFields, variantState.rows),
      images: normalizeUrlList(imageState.urls)
    };

    if ((!payload.variants || payload.variants.length === 0) && Number.isFinite(Number(payload.price))) {
      payload.variants = [
        {
          id: null,
          name: "Default",
          price: Number(payload.price),
          originalPrice: null,
          stockQty: null,
          enabled: true,
          sortOrder: 0
        }
      ];
    }

    if (
      !payload.name ||
      ("price" in payload && (!Number.isFinite(payload.price) || payload.price < 0))
    ) {
      alert("Please provide name and a valid price when top-level price is set");
      return;
    }

    if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
      alert("Please add at least one valid variant or provide a top-level price.");
      return;
    }

    if (!Array.isArray(payload.storefrontPages) || payload.storefrontPages.length === 0) {
      alert("Please select at least one storefront page");
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

function toDateInputValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function updateAdminFlashSalePreview(startInput, endInput, previewDays, previewHours, previewMinutes) {
  if (!(previewDays instanceof HTMLElement)) {
    return;
  }

  const startAt = startInput instanceof HTMLInputElement ? new Date(startInput.value) : null;
  const endAt = endInput instanceof HTMLInputElement ? new Date(endInput.value) : null;

  if (!(startAt instanceof Date) || Number.isNaN(startAt.valueOf()) || !(endAt instanceof Date) || Number.isNaN(endAt.valueOf()) || endAt <= startAt) {
    previewDays.textContent = "00";
    if (previewHours instanceof HTMLElement) {
      previewHours.textContent = "00";
    }
    if (previewMinutes instanceof HTMLElement) {
      previewMinutes.textContent = "00";
    }
    return;
  }

  const totalMinutes = Math.floor((endAt.getTime() - startAt.getTime()) / (60 * 1000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  previewDays.textContent = String(days).padStart(2, "0");
  if (previewHours instanceof HTMLElement) {
    previewHours.textContent = String(hours).padStart(2, "0");
  }
  if (previewMinutes instanceof HTMLElement) {
    previewMinutes.textContent = String(minutes).padStart(2, "0");
  }
}

async function hydrateAdminPricingPage() {
  const nameInput = document.querySelector('[data-ps-admin-flash-campaign-name="true"]');
  const startInput = document.querySelector('[data-ps-admin-flash-campaign-start="true"]');
  const endInput = document.querySelector('[data-ps-admin-flash-campaign-end="true"]');
  const discountValueInput = document.querySelector('[data-ps-admin-flash-discount-value="true"]');
  const saveButton = document.querySelector('[data-ps-admin-flash-campaign-save="true"]');
  const deleteButton = document.querySelector('[data-ps-admin-flash-campaign-delete="true"]');
  const campaignStatus = document.querySelector('[data-ps-admin-flash-campaign-status="true"]');
  const inclusionHost = document.querySelector('[data-ps-admin-flash-products="true"]');
  const inclusionSearch = document.querySelector('[data-ps-admin-flash-products-search="true"]');
  const discountButtons = Array.from(
    document.querySelectorAll("[data-ps-admin-flash-discount-type]")
  );
  const previewDays = document.querySelector('[data-ps-admin-flash-preview-days="true"]');
  const previewHours = document.querySelector('[data-ps-admin-flash-preview-hours="true"]');
  const previewMinutes = document.querySelector('[data-ps-admin-flash-preview-minutes="true"]');

  if (
    !(nameInput instanceof HTMLInputElement) ||
    !(startInput instanceof HTMLInputElement) ||
    !(endInput instanceof HTMLInputElement) ||
    !(saveButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  let selectedDiscountType = "PERCENTAGE";
  let activeCampaignId = null;
  let products = [];
  let inclusionQuery = "";

  const renderDiscountButtons = () => {
    discountButtons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const type = String(button.dataset.psAdminFlashDiscountType || "PERCENTAGE");
      const isSelected = type === selectedDiscountType;
      button.classList.toggle("bg-primary", isSelected);
      button.classList.toggle("text-white", isSelected);
      button.classList.toggle("font-bold", isSelected);
      button.classList.toggle("bg-surface-container", !isSelected);
      button.classList.toggle("text-on-surface-variant", !isSelected);
      button.classList.toggle("font-medium", !isSelected);
    });
  };

  discountButtons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      selectedDiscountType = String(button.dataset.psAdminFlashDiscountType || "PERCENTAGE");
      renderDiscountButtons();
    });
  });

  const syncPreview = () => {
    updateAdminFlashSalePreview(startInput, endInput, previewDays, previewHours, previewMinutes);
  };

  startInput.addEventListener("change", syncPreview);
  endInput.addEventListener("change", syncPreview);

  const renderCampaignStatus = () => {
    if (!(campaignStatus instanceof HTMLElement)) {
      return;
    }

    campaignStatus.textContent = activeCampaignId
      ? "Editing active campaign"
      : "No active campaign yet";
  };

  const renderInclusionRows = () => {
    if (!(inclusionHost instanceof HTMLElement)) {
      return;
    }

    const rows = products.filter((product) => {
      if (!inclusionQuery) {
        return true;
      }

      const haystack = normalizeText(`${product.name || ""} ${product.sku || ""}`);
      return haystack.includes(inclusionQuery);
    });

    if (rows.length === 0) {
      inclusionHost.innerHTML =
        '<div class="rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">No products found.</div>';
      return;
    }

    inclusionHost.innerHTML = rows
      .map((product) => {
        const checked = product.flashSaleEligible === true;
        return `
          <label class="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2">
            <div class="min-w-0">
              <div class="text-sm font-semibold truncate">${escapeHtml(product.name || "Product")}</div>
              <div class="text-xs text-on-surface-variant truncate">${escapeHtml(product.sku || "No SKU")}</div>
            </div>
            <input class="h-4 w-4 rounded border-outline-variant text-primary" data-role="flash-product-toggle" data-product-id="${escapeHtml(
              product.id
            )}" type="checkbox" ${checked ? "checked" : ""} />
          </label>
        `;
      })
      .join("");
  };

  const loadCampaign = async () => {
    const payload = await withAdminAuth(() => apiFetch("/api/admin/flash-sale-campaign"));
    if (!payload) {
      return;
    }

    const campaign = payload && payload.campaign ? payload.campaign : null;
    activeCampaignId = campaign && typeof campaign.id === "string" ? campaign.id : null;

    if (campaign) {
      nameInput.value = typeof campaign.name === "string" ? campaign.name : "";
      startInput.value = toDateInputValue(campaign.startAt);
      endInput.value = toDateInputValue(campaign.endAt);
      if (discountValueInput instanceof HTMLInputElement) {
        discountValueInput.value =
          campaign.discountValue === null || campaign.discountValue === undefined
            ? ""
            : String(campaign.discountValue);
      }
      selectedDiscountType =
        campaign.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
    } else {
      nameInput.value = "";
      startInput.value = "";
      endInput.value = "";
      if (discountValueInput instanceof HTMLInputElement) {
        discountValueInput.value = "";
      }
      selectedDiscountType = "PERCENTAGE";
    }

    if (saveButton instanceof HTMLButtonElement) {
      saveButton.textContent = activeCampaignId ? "Update Campaign" : "Create Campaign";
    }

    if (deleteButton instanceof HTMLButtonElement) {
      deleteButton.disabled = !activeCampaignId;
      deleteButton.classList.toggle("opacity-50", !activeCampaignId);
      deleteButton.classList.toggle("cursor-not-allowed", !activeCampaignId);
    }

    renderCampaignStatus();
    renderDiscountButtons();
    syncPreview();
  };

  const loadProducts = async () => {
    const payload = await withAdminAuth(() => apiFetch("/api/admin/products"));
    if (!payload) {
      return;
    }

    products = Array.isArray(payload.products) ? payload.products : [];
    renderInclusionRows();
  };

  try {
    await Promise.all([loadCampaign(), loadProducts()]);
  } catch (error) {
    console.error(error);
    renderDiscountButtons();
    syncPreview();
  }

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const startAt = startInput.value;
    const endAt = endInput.value;

    if (!name || !startAt || !endAt) {
      alert("Please provide campaign name, start date, and end date.");
      return;
    }

    try {
      const discountValue =
        discountValueInput instanceof HTMLInputElement && discountValueInput.value.trim()
          ? Number(discountValueInput.value)
          : null;
      const method = activeCampaignId ? "PATCH" : "POST";
      const url = activeCampaignId
        ? `/api/admin/flash-sale-campaign?id=${encodeURIComponent(activeCampaignId)}`
        : "/api/admin/flash-sale-campaign";

      const result = await withAdminAuth(() =>
        apiFetch(url, {
          method,
          body: JSON.stringify({
            name,
            startAt: `${startAt}T00:00:00.000Z`,
            endAt: `${endAt}T23:59:59.999Z`,
            discountType: selectedDiscountType,
            discountValue
          })
        })
      );

      if (!result) {
        return;
      }

      await loadCampaign();
      alert(activeCampaignId ? "Flash sale campaign updated." : "Flash sale campaign created.");
    } catch (error) {
      console.error(error);
      alert((error && error.message) || "Unable to schedule campaign");
    }
  });

  if (deleteButton instanceof HTMLButtonElement) {
    deleteButton.addEventListener("click", async (event) => {
      event.preventDefault();

      if (!activeCampaignId) {
        return;
      }

      if (!window.confirm("Deactivate the active flash sale campaign?")) {
        return;
      }

      try {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/flash-sale-campaign?id=${encodeURIComponent(activeCampaignId)}`, {
            method: "DELETE"
          })
        );

        if (!result) {
          return;
        }

        await loadCampaign();
      } catch (error) {
        console.error(error);
        alert((error && error.message) || "Unable to remove campaign");
      }
    });
  }

  if (inclusionSearch instanceof HTMLInputElement) {
    inclusionSearch.addEventListener("input", () => {
      inclusionQuery = normalizeText(inclusionSearch.value);
      renderInclusionRows();
    });
  }

  if (inclusionHost instanceof HTMLElement) {
    inclusionHost.addEventListener("change", async (event) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement) || target.dataset.role !== "flash-product-toggle") {
        return;
      }

      const productId = target.dataset.productId;
      if (!productId) {
        return;
      }

      const nextValue = target.checked;

      try {
        const result = await withAdminAuth(() =>
          apiFetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
            method: "PATCH",
            body: JSON.stringify({ flashSaleEligible: nextValue })
          })
        );

        if (!result || !result.product) {
          return;
        }

        products = products.map((product) =>
          product.id === productId ? result.product : product
        );
      } catch (error) {
        target.checked = !nextValue;
        console.error(error);
        alert((error && error.message) || "Unable to update flash sale product");
      }
    });
  }
}
