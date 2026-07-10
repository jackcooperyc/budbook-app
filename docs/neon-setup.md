# Neon Postgres Setup

BudBook uses Neon when `DATABASE_URL` is set. Without it, the app falls back to file-backed JSON stores (`./data` locally).

## 1. Create a Neon project

**Recommended (Vercel):** provision from the BudBook Vercel project:

```bash
npx vercel integration add neon -n budbook-db -e production -m auth=false --plan free_v3
```

This creates `budbook-db`, connects it to the project, and injects `DATABASE_URL` into Production.

Alternatively use the [Neon console](https://console.neon.tech) or the Cursor **neon-postgres** plugin, then add `DATABASE_URL` manually.

## 2. Configure environment

**Local** (`.env.local`):

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
BUDBOOK_AUTH_SECRET=<openssl rand -hex 32>
```

**Vercel** (Production):

```bash
vercel env add DATABASE_URL production
vercel env add BUDBOOK_AUTH_SECRET production
```

Optional: `RDA_IMPORT_SECRET` for operator shop imports via `POST /api/internal/rda/import`.

## 3. Run migrations

```bash
npm run db:migrate
```

This applies all SQL files in `lib/db/migrations/` (users, products, sessions, posts, CAA catalog, RDA shops).

Alternative: `npm run db:push` (Drizzle Kit schema sync).

## 4. Verify

```bash
npm run dev
```

With `DATABASE_URL` set, stash/journal/posts/CAA/RDA writes go to Postgres. Unset `DATABASE_URL` to use files again.

## Tables

| Table | Replaces |
|-------|----------|
| `users` | Dev user seed (`getDefaultUser`) when auth off |
| `products` + `inventory_items` | `local-stash.json` |
| `sessions` | `local-sessions.json` |
| `posts` | `local-posts.json` |
| `caa_catalog_entries` | `caa-registry.json` |
| `rda_stores` + `rda_menu_items` | `rda-cache.json` |
| `friendships`, `circles`, `circle_members` | `local-social.json` |

## Architecture

```
API routes → lib/repositories/* → Neon (if DATABASE_URL) | JSON files (fallback)
```

User scoping uses `getCurrentUserId()` from `lib/budbook-user/currentUser.ts`, backed by JWT session when `BUDBOOK_AUTH_SECRET` is set.
