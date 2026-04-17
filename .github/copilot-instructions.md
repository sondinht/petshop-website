# PetShop Website Workspace Instructions

This workspace contains the PetShop storefront/admin web app and a legacy baseline HTML site.

## What this workspace is

- `site/` is the active Next.js app router application.
- `site/public/` contains protected baseline HTML pages and assets.
- `site/src/` contains the new app, server code, API routes, and legacy route handler.
- `site/src/legacy/` is the compatibility layer for legacy HTML pages.
- `petshop/` contains additional inputs and source materials used by the product.

> Use the existing docs first: `README.md` at the repo root and `site/README.md` for setup, Prisma, and legacy details.

## Key workflows

- Install dependencies and run local development:
  - `cd site && npm install && npm run dev`
- Build and start production:
  - `cd site && npm run build && npm run start`
- Lint/typecheck:
  - `cd site && npm run lint`
  - `cd site && npm run typecheck`
- End-to-end tests:
  - `cd site && npm run test:e2e`
  - smoke tests: `cd site && npm run test:e2e:smoke`

## Database and Prisma

- `site/package.json` includes Prisma scripts:
  - `npm run prisma:generate`
  - `npm run prisma:migrate -- --name <name>`
  - `npm run prisma:seed`
  - `npm run prisma:reset`
- Local development expects `site/.env` with `DATABASE_URL="file:./dev.db"`.
- On Windows, `.env` must be a file, not a directory.
- Admin login in local dev requires `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `site/.env`, plus a migrated and seeded DB.

## Architecture and conventions

- The active application is a Next.js App Router project in `site/src/app`.
- `site/src/server/` contains server-side repositories, authentication, session, and database helpers.
- `site/src/legacy/manifest.ts` lists legacy baseline pages that are still served via the compatibility route.
- `site/public/` is treated as baseline content; do not regenerate or overwrite these pages unless the change is explicitly part of legacy/HTML maintenance.
- The legacy route handler is `site/src/app/legacy/[[...path]]/route.ts`.
- Rewrites are controlled in `site/next.config.mjs` to support legacy URL aliases.

## Important project rules

- Preserve `site/public/` baseline HTML when working on new app/router code.
- Prefer using Next.js app routes and React/TS components in `site/src/app` over editing legacy HTML directly.
- Use the root README and `site/README.md` as the source of truth for setup and database commands.
- For product/catalog changes, review `site/src/server/productRepo.ts`, `site/src/server/reviewRepo.ts`, and `site/src/server/cartRepo.ts`.

## When to use the agent

Ask the agent for:
- local development and test commands for this repo
- how to set up Prisma and the seeded local DB
- which code paths handle storefront vs. admin vs. legacy pages
- the distinction between `site/public/` baseline HTML and `site/src/app/` app router pages
- how to run Playwright e2e tests in this workspace

## Example prompts

- "How do I run the PetShop storefront locally and seed the database?"
- "Where are the legacy HTML baseline pages stored and how do I avoid modifying them accidentally?"
- "What files implement product and cart server logic in `site/src/server/`?"
- "Explain the Prisma workflow for this project and the Windows `.env` gotcha."
