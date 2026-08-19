# Aralau

**aralau.kz** — an interactive digital archive and urban quest for Almaty. Locations are found through text clues instead of GPS; presence is confirmed by answering a question about a physical detail on-site; each discovery mints a dated stamp on the season's sheet. One year, a few seasons, then the archive freezes and a personal printed volume is made from what each participant actually found.

Mobile-first PWA. UI in Russian and Kazakh.

## Stack

- **Nuxt 4** (Vue 3, TypeScript strict) — SSR public pages + Nitro API, one repo
- **PostgreSQL + Prisma 7** (`@prisma/adapter-pg`)
- **`nuxt-auth-utils`** — Google OAuth, sealed-cookie sessions
- **Tailwind CSS** — custom "almanac book" design system (Literata / JetBrains Mono / PT)
- **`@vite-pwa/nuxt`** — installable PWA; `/api/**` is NetworkOnly
- **`@nuxtjs/i18n`** — `ru` (default) / `kk`, `prefix_except_default`
- **Zod** on all inputs · **Vitest** for unit tests

## Setup

```bash
npm install
docker compose up -d          # Postgres on localhost:5432
cp .env.example .env          # fill in values (see below)
npm run prisma:migrate
npm run prisma:seed
npm run dev                   # http://localhost:3000
```

Required env (see `.env.example` for comments):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` + `DB_*` | Postgres connection |
| `NUXT_SESSION_PASSWORD` | session cookie sealing, 32+ chars |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID/SECRET` | Google OAuth; login button is disabled when unset. Redirect URI: `{origin}/api/auth/google` |
| `SEED_DEMO_USER_EMAIL` | your dev Google account — seed creates demo check-ins for it (idempotent). Sign in once via Google first, then re-run seed |

## Scripts

```bash
npm run dev / build / preview
npm run verify          # lint + typecheck + test + build (CI gate)
npm run test            # vitest
npm run prisma:migrate  # dev migration
npm run prisma:seed     # idempotent seed (demo season, places, demo check-ins)
npm run prisma:studio   # DB browser — content admin for now
npm run og              # regenerate public/og/default.png (scripts/generate-og.mjs)
```

## Structure

```
app/            pages, components, composables (Nuxt 4 app dir)
  pages/        / (title) · /seasons/[slug] · /places/[slug] · /profile · /auth/* · /offline · /dev/*
server/
  api/          seasons, places, checkin, me/progress, me/checkins, auth/*
  utils/        answerMatch · stampPlacement · rateLimit · ...
prisma/         schema, migrations, seed
i18n/locales/   ru.json, kk.json
design/         read-only design reference bundle (source of truth for the redesign; never edit)
test/           vitest specs
test scripts live in `scripts/`
```

Three user-facing screens: **title** (`/` — profile rows, seasons TOC, progress) → **season** (stamp sheet «Мөр парағы») → **place** (clue, question, story). No tab bar by design.

## Core rules (don't break these)

- `Location.answers` is **never** serialized to the client; `storyText` only after check-in
- Stamp placement (`stampLeft/Top/Rot` on `CheckIn`) is generated once at check-in and immutable
- Check-in answers: normalized, fuzzy-matched (numeric answers exact-only), rate-limited per user+location
- All user-facing dates in `Asia/Almaty` timezone
- Season lifecycle: `draft → active → closed → frozen`; public sees only non-draft
