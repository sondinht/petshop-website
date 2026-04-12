# Site App Scaffold

This folder now contains a Next.js App Router + TypeScript scaffold that reuses `site/public` as the legacy baseline source.

## Run

```bash
cd site
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Admin login in local development expects `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `site/.env`, and a migrated/seeded database.

## Database (Prisma)

1. Copy `.env.example` to `.env`.
	- Windows note: `.env` must be a file at `site/.env`. Do not run `mkdir .env`.
	- If you accidentally created a folder named `.env`, delete it with `rmdir /s /q .env` then run `copy .env.example .env`.
2. Ensure `DATABASE_URL` is set to SQLite for local dev:

```bash
DATABASE_URL="file:./dev.db"
```

3. Generate client and apply migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

If you hit migration history issues during early development, run `npx prisma migrate reset`.

4. Seed products from the current catalog:

```bash
npm run prisma:seed
```

Note: `npm run prisma:seed` executes `tsx prisma/seed.ts` directly, so no `package.json#prisma.seed` config is required.

To switch to Postgres later, update `prisma/schema.prisma` datasource `provider`, set a Postgres `DATABASE_URL`, and run a new migration.

## Build

```bash
cd site
npm run build
npm run start
```

## Legacy serving

- Baseline pages are listed in `src/legacy/manifest.ts`
- Legacy handler lives at `src/app/legacy/[[...path]]/route.ts`
- Shared admin shell styles for redesigned admin pages live in `public/admin-shell.css`
- Prefer internal URLs under `/legacy/...` and `/html/...`
- `/_legacy/...` and `/_html/...` continue to work via rewrites aliases
- Rewrites are defined in `next.config.mjs`

## Stub payments

- Checkout now creates an order first, then charges via `POST /api/payments/stub/charge`.
- The stub endpoint accepts `{ "orderNumber": "PS-..." }` and records a `Payment` row with provider `STUB`.
- Order status remains unchanged (`PENDING`) in this phase.
