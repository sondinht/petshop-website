const PAGE = typeof window !== "undefined" ? window.__PAGE__ : "";

const NAV_DESTINATIONS = {
  home: "/index.html",
  "shop all": "/index.html",
  dogs: "/dogs.html",
  cats: "/cats.html",
  accessories: "/accessories.html",
  blog: "/blog.html"
};

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

document.addEventListener("DOMContentLoaded", () => {
  enhanceTopNavLinks();

  if (isAdminPage()) {
    normalizeAdminSidebar();
  }

  wireCartIcon();
  wireIndexPrimaryCtas();
  wireCartCheckoutButton();

  if (!isAdminPage()) {
    hydrateCartIconCount();
  }

  if (PAGE === "dogs.html") {
    wireDogsAddToCart();
  }

  if (PAGE === "index.html") {
    wireIndexAddToCart();
  }

  if (PAGE === "product-detail.html") {
    wireProductDetailCtas();
  }

  if (PAGE === "cart.html") {
    hydrateCartPage();
  }

  if (PAGE === "checkout.html") {
    wirePlaceOrder();
  }

  if (PAGE === "admin-login.html") {
    wireAdminLoginPage();
  }

  if (PAGE === "profile.html") {
    hydrateProfileOrders();
  }

  if (PAGE === "admin-products.html") {
    hydrateAdminProductsPage();
  }

  if (PAGE === "admin-product-form.html") {
    hydrateAdminProductForm();
  }

  if (PAGE === "admin-orders.html") {
    hydrateAdminOrdersPage();
  }
});

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isAdminPage() {
  return normalizeText(PAGE).startsWith("admin-");
}

function currentPageName() {
  if (PAGE) {
    return PAGE;
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
  } catch (_error) {
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

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload && payload.error ? payload.error : "Request failed");
    error.status = response.status;
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

function wireIndexPrimaryCtas() {
  if (PAGE !== "index.html") {
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
  if (PAGE !== "cart.html") {
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

function markUnavailableIndexButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.title = "Product unavailable right now";
  button.style.opacity = "0.6";
  button.style.cursor = "not-allowed";
}

function isIconOnlyAddButton(button) {
  if (!(button instanceof HTMLButtonElement)) {
    return false;
  }

  const text = normalizeText(button.textContent);
  return text === "shopping_bag" || text === "add_shopping_cart";
}

async function wireIndexAddToCart() {
  if (PAGE !== "index.html") {
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
  if (PAGE !== "checkout.html") {
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
    stockQty,
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80"
  };
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

  if (!saveButton || !formFields.name || !formFields.price || !formFields.category) {
    return;
  }

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
      }
    } catch (error) {
      console.error(error);
    }
  }

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const payload = collectAdminProductFormPayload(formFields);

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
