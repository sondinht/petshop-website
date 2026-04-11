export type LegacyPage = {
  file: string;
  canonicalRoute: string;
};

export const legacyPages: LegacyPage[] = [
  { file: "index.html", canonicalRoute: "/" },
  { file: "dogs.html", canonicalRoute: "/dogs.html" },
  { file: "cats.html", canonicalRoute: "/cats.html" },
  { file: "deals.html", canonicalRoute: "/deals.html" },
  { file: "accessories.html", canonicalRoute: "/accessories.html" },
  { file: "product-detail.html", canonicalRoute: "/product-detail.html" },
  { file: "cart.html", canonicalRoute: "/cart.html" },
  { file: "checkout.html", canonicalRoute: "/checkout.html" },
  { file: "profile.html", canonicalRoute: "/profile.html" },
  { file: "blog.html", canonicalRoute: "/blog.html" },
  { file: "contact.html", canonicalRoute: "/contact.html" },
  { file: "admin-products.html", canonicalRoute: "/admin-products.html" },
  { file: "admin-product-form.html", canonicalRoute: "/admin-product-form.html" },
  { file: "admin-orders.html", canonicalRoute: "/admin-orders.html" },
  { file: "admin-pricing.html", canonicalRoute: "/admin-pricing.html" },
  { file: "admin-login.html", canonicalRoute: "/admin-login.html" },
  { file: "admin-users.html", canonicalRoute: "/admin-users.html" },
  {
    file: "admin-user-verification.html",
    canonicalRoute: "/admin-user-verification.html"
  },
  { file: "admin-blog.html", canonicalRoute: "/admin-blog.html" }
];

export const legacyAllowlist = new Set(legacyPages.map((page) => page.file));
