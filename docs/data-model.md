# BudBook Data Model

The native Next.js UI runs on **persisted data** — Neon Postgres in production, file-backed JSON stores for local dev without `DATABASE_URL`.

## Source of truth (native UI)

| Domain | Store | API |
|--------|-------|-----|
| User identity | Neon `users` + JWT session (or dev default user) | `GET /api/auth/session`, `GET /api/internal/budbook-user` |
| Stash (products + inventory) | `products` + `inventory_items` | `GET/POST/PATCH/DELETE /api/internal/budbook-stash` |
| Journal sessions | `sessions` | `GET/POST /api/internal/budbook-sessions` |
| Community posts | `posts` | `GET/POST /api/internal/budbook-posts` |
| Retail shops + menus | `rda_stores` + `rda_menu_items` | `GET /api/internal/rda/stores`, `.../menu`, `POST .../import` |
| CAA COA catalog | `caa_catalog_entries` | `POST /api/internal/caa/parse`, `GET .../catalog` |
| COA parse (legacy alias) | — | `POST /api/internal/budbook-coa/parse` → CAA |
| Friends / circles | `friendships`, `circles`, `circle_members` | `GET/POST /api/internal/budbook-friends`, `.../circles` |

Server components aggregate via `getAppData()` in `src/lib/app-data.ts`. Client pages use the matching hooks (`useServerStash`, `useServerSessions`, `useCurrentUser`).

**Storage path:** When `DATABASE_URL` is set, user data, CAA catalog, and RDA shops persist in **Neon Postgres** via Drizzle (`lib/db/`, `lib/repositories/`). Otherwise `lib/data-dir.ts` writes to `./data` locally and `/tmp/budbook-data` on Vercel. File data on Vercel is ephemeral per serverless instance.

```bash
npm run db:migrate   # apply lib/db/migrations/*.sql (requires DATABASE_URL)
```

## Fresh start

On first run, stash, journal, posts, friends, and circles start **empty**. Retail shops are empty until an operator imports data.

```bash
npm run reset-data   # your stash, journal, posts, CAA registry
npm run reset-rda    # clear RDA shops and menus
npm run rda:import -- fixtures/rda/example-shop.json   # example operator import
```

## RDA tables

| Table | Column | Purpose |
|-------|--------|---------|
| `rda_stores` | `store_key`, `data` (JSONB) | Full `RetailStore` document |
| `rda_menu_items` | `menu_item_key`, `store_key`, `data` (JSONB) | Full `RetailMenuItem` document |

See `fixtures/rda/example-shop.json` for the import format.

## Post-MVP surfaces

| Route | Waiting on |
|-------|------------|
| `/budbook-app/friends` | Friend invites / social graph |
| `/budbook-app/learn` | CMS content |

## Insights and stats

Dashboard and profile stats are computed from persisted sessions and stash only (`src/lib/app-stats.ts`).
