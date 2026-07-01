# BudBook MVP Scope

Functional MVP — persisted user data + RDA retail cache + CAA compliance path.

## MVP user loop

1. Start with an **empty** stash and journal
2. Browse shops (RDA) → menu → add to stash (terpenes pending until CAA match)
3. Scan COA (CAA) → authoritative terpenes → add to stash → appears in Cannadex
4. Log sessions → dashboard insights update
5. Create community posts

## In scope

| Area | Status |
|------|--------|
| File-backed stash, sessions, posts | Done (Neon when `DATABASE_URL` set) |
| RDA shops + menu → stash | Done (Phase 2) |
| CAA COA parse (url / text / QR) | Done (Phase 3) |
| CAA registry + Cannadex catalog | Done (Phase 3) |
| Duplicate COA detection in stash | Done (Phase 3) |
| `product_key` join (RDA menu ↔ CAA) | Done (Phase 3) |
| Default dev user | Done |
| Stash CRUD | Done |

## Data stores

| File | Purpose |
|------|---------|
| `data/local-stash.json` | Your products (starts empty) |
| `data/local-sessions.json` | Your journal (starts empty) |
| `data/local-posts.json` | Your posts (starts empty) |
| `data/caa-registry.json` | CAA-confirmed COA catalog (populated on scan) |
| `data/rda-cache.json` | Retail shops + menus (auto-seeded) |

```bash
npm run reset-data   # clear your stash, journal, posts, CAA registry
npm run reset-rda    # clear shop cache
```

## API routes

| Route | Methods |
|-------|---------|
| `/api/internal/caa/parse` | POST |
| `/api/internal/caa/catalog` | GET |
| `/api/internal/caa/catalog/[product_key]` | GET |
| `/api/internal/rda/stores` | GET |
| `/api/internal/rda/stores/[store_key]/menu` | GET |
| `/api/internal/budbook-stash` | GET, POST (`kind: coa`), PATCH, DELETE |

## Next phase

Phase 4: Buddy live context, post likes, auth decision, production deploy.
