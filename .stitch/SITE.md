# Project Vision & Constitution

> AGENT INSTRUCTION: Read this file before every iteration. It serves as the project's long-term memory.

## 1. Core Identity
* **Project Name:** PetShop
* **Stitch Project ID:** `13643797305037033191`
* **Mission:** Build a high-converting ecommerce website for pet essentials with a warm, trustworthy, promotion-driven shopping experience.
* **Target Audience:** Pet owners shopping for dogs, cats, food, toys, grooming, and everyday accessories.
* **Voice:** Friendly, modern, playful, reassuring, conversion-focused.

## 2. Visual Language
*Reference these descriptors when prompting Stitch.*

* **The "Vibe" (Adjectives):**
    * *Primary:* flat modern ecommerce
    * *Secondary:* friendly and trustworthy
    * *Tertiary:* bright promotional merchandising

## 3. Architecture & File Structure
* **Root:** `site/public/`
* **Asset Flow:** Stitch generates to `.stitch/designs/` -> validate -> move to `site/public/`
* **Navigation Strategy:** Global top navigation with key commerce destinations and recurring CTA to shop now.

## 4. Live Sitemap (Current State)
*Update this when a new page is successfully merged.*

* [x] `index.html` - Landing page with hero, flash sale, categories, products, testimonials, and footer.
* [x] `dogs.html` - Dog shopping category page.
* [x] `cats.html` - Cat shopping category page.
* [x] `accessories.html` - Accessories category page.
* [x] `blog.html` - Pet care content and promotions blog page.
* [x] `cart.html` - Shopping cart and order summary page.
* [x] `profile.html` - Customer account and order overview page.
* [x] `checkout.html` - Conversion-focused checkout flow.
* [x] `product-detail.html` - Premium product detail page with gallery, selectors, reviews, and related products.
* [x] `contact.html` - Store support and contact page.
* [x] `admin-products.html` - Manager page to add, hide, unhide, or delete products.
* [x] `admin-product-form.html` - Unified add/edit product form for catalog, media, pricing, and merchandising.
* [x] `admin-pricing.html` - Manager page to set prices and control flash sale campaigns.
* [x] `admin-orders.html` - Manager page to oversee orders, fulfillment, and refunds.
* [x] `admin-blog.html` - Manager page to manage blog posts, drafts, scheduling, and featuring.
* [x] `admin-users.html` - Internal staff account management for roles, status, and invites.
* [x] `admin-user-verification.html` - Internal verification queue for reviewing and approving staff accounts.
* [x] `admin-login.html` - Admin sign-in page for internal staff access.

## 5. The Roadmap (Backlog)
*Pick the next task from here if available.*

### High Priority
- [x] `deals.html` - Seasonal campaign landing page with flash sales, bundles, and promo modules.

## 6. Creative Freedom Guidelines
*When the backlog is empty, follow these guidelines to innovate.*

1. **Stay On-Brand:** Keep the PetShop experience bright, friendly, and retail-focused.
2. **Enhance the Core:** New pages should improve merchandising, trust, or conversion.
3. **Naming Convention:** Use lowercase, descriptive filenames.

### Ideas to Explore
*Pick one, build it, then remove it from this list.*

- [ ] `membership.html` - Loyalty perks and subscription savings.
- [ ] `adoption-guide.html` - Educational content for new pet parents.

## 7. Rules of Engagement
1. Do not recreate pages in Section 4 unless explicitly refreshing them.
2. Always update `next-prompt.md` before completing.
3. Carry the design system block into every new Stitch prompt.
