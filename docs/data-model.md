# Pacs.MT Data Model

The native Next.js UI runs on **persisted data** — Neon Postgres in production, file-backed JSON stores for local dev without `DATABASE_URL`.

## Source of truth (native UI)

| Domain | Store | API |
|--------|-------|-----|
| User identity | Neon `users` + JWT session (or dev default user) | `GET /api/auth/session`, `GET /api/internal/user` |
| Stash (products + inventory) | `products` + `inventory_items` | `GET/POST/PATCH/DELETE /api/internal/stash` |
| Journal sessions | `sessions` | `GET/POST /api/internal/journal` |
| Community posts | `posts` | `GET/POST /api/internal/posts` |
| Retail shops + menus | `rda_stores` + `rda_menu_items` | `GET /api/internal/rda/stores`, `.../menu`, `POST .../import` |
| Learn articles | `learn_articles` | `GET /api/internal/learn`, `GET .../learn/[slug]`, `POST .../learn/import` |
| CAA COA catalog | `caa_catalog_entries` | `POST /api/internal/caa/parse`, `GET .../catalog` |
| COA parse (legacy alias) | — | `POST /api/internal/caa/parse` → CAA |
| Friends / circles | `friendships`, `circles`, `circle_members` | `GET/POST /api/internal/friends`, `.../circles` |

Server components aggregate via `getAppData()` in `src/lib/app-data.ts`. Client pages use the matching hooks (`useServerStash`, `useServerSessions`, `useCurrentUser`).

**Storage path:** When `DATABASE_URL` is set, user data, CAA catalog, RDA shops, and Learn articles persist in **Neon Postgres** via Drizzle (`lib/db/`, `lib/repositories/`). Otherwise `lib/data-dir.ts` writes to `./data` locally and `/tmp/pacsmt-data` on Vercel. File data on Vercel is ephemeral per serverless instance.

```bash
npm run db:migrate   # apply lib/db/migrations/*.sql (requires DATABASE_URL)
```

## Fresh start

On first run, stash, journal, posts, friends, and circles start **empty**. Retail shops are empty until an operator imports data. Learn articles **auto-seed** from the built-in education pack when the store is empty (or run `npm run learn:import`).

```bash
npm run reset-data   # your stash, journal, posts, CAA registry
npm run reset-rda    # clear RDA shops and menus
npm run rda:import -- fixtures/rda/example-shop.json   # example operator import
npm run learn:import -- fixtures/learn/articles.json   # refresh Learn CMS content
npm run reset-learn  # clear Learn articles (next read re-seeds)
```

## RDA tables

| Table | Column | Purpose |
|-------|--------|---------|
| `rda_stores` | `store_key`, `data` (JSONB) | Full `RetailStore` document |
| `rda_menu_items` | `menu_item_key`, `store_key`, `data` (JSONB) | Full `RetailMenuItem` document |

See `fixtures/rda/example-shop.json` for the import format.

## Learn tables

| Table | Column | Purpose |
|-------|--------|---------|
| `learn_articles` | `slug`, `data` (JSONB), `published_at`, `updated_at` | Full `LearnArticle` document |

Article shape: `slug`, `title`, `summary`, `category`, `tags[]`, markdown `body`, `published_at`, `updated_at`. See `fixtures/learn/articles.json` and `types/learn.ts`.

Operator import: `POST /api/internal/learn/import` with `Authorization: Bearer $LEARN_IMPORT_SECRET`, or `npm run learn:import`.

## Post-MVP surfaces

| Route | Waiting on |
|-------|------------|
| `/pacs/friends` | Friend invites / social graph |

## Insights and stats

Dashboard and profile stats are computed from persisted sessions and stash only (`src/lib/app-stats.ts`).
