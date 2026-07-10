# BudBook MVP Scope

Functional MVP — persisted user data + operator-imported RDA shops + CAA compliance path.

## MVP user loop

1. Start with an **empty** stash and journal
2. Browse shops (RDA, operator-imported) → menu → add to stash (terpenes pending until CAA match)
3. Scan COA (CAA) → authoritative terpenes → add to stash → appears in Cannadex
4. Log sessions → dashboard insights update
5. Create community posts (attributed to signed-in user when auth is enabled)

## In scope

| Area | Status |
|------|--------|
| File-backed stash, sessions, posts | Done (Neon when `DATABASE_URL` set) |
| RDA shops + menu → stash | Done (operator import) |
| CAA COA parse (url / text / QR) | Done |
| CAA registry + Cannadex catalog | Done |
| Duplicate COA detection in stash | Done |
| `product_key` join (RDA menu ↔ CAA) | Done |
| Session auth (`BUDBOOK_AUTH_SECRET`) | Done |
| Stash CRUD | Done |
| Neon Postgres persistence | Done |
| Buddy AI (live stash + journal context) | Done |
| Post likes | Done |

## Data stores

| Store | Purpose |
|-------|---------|
| Neon `products` + `inventory_items` | Stash (or `data/local-stash.json` locally) |
| Neon `sessions` | Journal (or `data/local-sessions.json`) |
| Neon `posts` | Community posts (or `data/local-posts.json`) |
| Neon `caa_catalog_entries` | CAA-confirmed COA catalog |
| Neon `rda_stores` + `rda_menu_items` | Retail shops + menus (or `data/rda-cache.json`) |

```bash
npm run reset-data   # clear your stash, journal, posts, CAA registry
npm run reset-rda    # clear RDA shops and menus
npm run rda:import -- fixtures/rda/example-shop.json   # import operator shop data
```

## API routes

| Route | Methods |
|-------|---------|
| `/api/internal/caa/parse` | POST |
| `/api/internal/caa/catalog` | GET |
| `/api/internal/caa/catalog/[product_key]` | GET |
| `/api/internal/rda/stores` | GET |
| `/api/internal/rda/stores/[store_key]/menu` | GET |
| `/api/internal/rda/import` | POST (Bearer `RDA_IMPORT_SECRET`) |
| `/api/internal/budbook-stash` | GET, POST (`kind: coa`), PATCH, DELETE |
| `/api/internal/budbook-posts` | GET, POST, PATCH (`action: like`) |
| `/api/internal/buddy/chat` | GET (prompts), POST (message) |

## Next phase

Learn CMS, RDA live Weedmaps/Leafly adapter, CAA Metrc integration, invite-based friend requests.

See [phase-5.md](./phase-5.md) for auth, social, and adapter details.
