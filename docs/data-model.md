# BudBook Data Model

The native Next.js UI runs on **persisted file-backed stores**, not mock seed JSON. Mock data is retained only for the legacy Base44 SPA compatibility layer.

## Source of truth (native UI)

| Domain | Store | API |
|--------|-------|-----|
| User identity | `lib/budbook-user/defaultUser.ts` (+ env overrides) | `GET /api/internal/budbook-user` |
| Stash (products + inventory) | `data/local-stash.json` | `GET/POST/PATCH/DELETE /api/internal/budbook-stash` |
| Journal sessions | `data/local-sessions.json` | `GET/POST /api/internal/budbook-sessions` |
| Community posts | `data/local-posts.json` | `GET/POST /api/internal/budbook-posts` |
| Retail shops + menus | `data/rda-cache.json` | `GET /api/internal/rda/stores`, `.../menu` |
| CAA COA catalog | `data/caa-registry.json` | `POST /api/internal/caa/parse`, `GET .../catalog` |
| COA parse (legacy alias) | — | `POST /api/internal/budbook-coa/parse` → CAA |

Server components aggregate via `getAppData()` in `src/lib/app-data.ts`. Client pages use the matching hooks (`useServerStash`, `useServerSessions`, `useCurrentUser`).

## Fresh start

On first run, **your** stash, journal, and posts start empty. The RDA retail cache auto-seeds 3 Portland-area shops on first access (`data/rda-cache.json`).

To reset local dev data:

```bash
npm run reset-data   # your stash, journal, posts
npm run reset-rda    # retail shop cache (re-seeds on next visit)
```

## Mock seed data (legacy only)

| Artifact | Purpose | Used by native UI? |
|----------|---------|-------------------|
| `public/budbook-app/mock/budbook-mock-user.json` | Jordan Rivers demo persona | **No** |
| `GET /api/internal/budbook-mock/payloads` | Full mock payload builder | **No** |
| `src/data/socialMock.ts` | Static friends/circles/buddy rules | Buddy keyword replies only |
| `app/api/apps/*/entities/*` | Legacy SPA entity proxy | Legacy SPA only |

The mock JSON file remains in the repo for reference and legacy SPA bootstrap. It is **not merged** into dashboard, stash, journal, profile, or shops.

## Post-MVP surfaces

| Route | Waiting on |
|-------|------------|
| `/budbook-app/friends`, `/circles`, `/learn` | Social graph / CMS |
| Real Metrc / lab API COA parsing | CAA live adapter |

## Insights and stats

Dashboard and profile stats are computed from persisted sessions and stash only (`src/lib/app-stats.ts`). No mock `overview` or `data_insights` fallback.
