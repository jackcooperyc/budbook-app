# BudBook App

Standalone host for the BudBook consumer app, extracted from the JCS / CŪPR ecosystem monorepo.

This repository contains:

- A **native Next.js UI** at `/budbook-app/*` (editable design system, dark botanical brand)
- BudBook domain types and normalization layer
- Neon-backed persistence (or file-backed stores for local dev without `DATABASE_URL`)
- Internal APIs for stash, sessions, posts, COA parsing, retail shops, and Buddy AI

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3010/budbook-app](http://localhost:3010/budbook-app).

Port **3010** is pinned in `npm run dev` so BudBook does not collide with other tools that often bind **3000**.

Optional: set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` in `.env.local` for the dispensary map embed (see `.env.example`). Override the dev user with `BUDBOOK_USER_NAME`, `BUDBOOK_USER_USERNAME`, and `BUDBOOK_USER_EMAIL` when `BUDBOOK_AUTH_SECRET` is unset.

**Data:** The native UI starts empty — add products and log sessions to build your profile. See [docs/data-model.md](docs/data-model.md).

**Shops:** Operator-imported retail data via `npm run rda:import -- fixtures/rda/example-shop.json` (see [docs/rda-spec.md](docs/rda-spec.md)).

**Learn:** Education & harm-reduction articles at `/budbook-app/learn`. Auto-seeds on first visit; refresh with `npm run learn:import -- fixtures/learn/articles.json`.

**Theme:** Use the sun/moon toggle in the header, or **Settings → Appearance** for Light / Dark / System. Preference is saved in `localStorage` and applied before first paint to avoid flash.

## Production

Required for production:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres |
| `BUDBOOK_AUTH_SECRET` | JWT session auth (`openssl rand -hex 32`) |

Optional:

| Variable | Purpose |
|----------|---------|
| `BUDBOOK_OPENAI_API_KEY` | Buddy LLM layer |
| `RDA_IMPORT_SECRET` | Protects `POST /api/internal/rda/import` for operator shop imports |
| `LEARN_IMPORT_SECRET` | Protects `POST /api/internal/learn/import` for Learn CMS content imports |

## Structure

| Path | Purpose |
|------|---------|
| `app/budbook-app/` | Native Next.js UI (dashboard, stash, journal, social, cannadex, scanner, buddy) |
| `src/components/` | Design system + product components |
| `lib/repositories/` | Neon + file-backed data access |
| `lib/rda/` | Retail Data Adapter gateway |
| `lib/caa/` | Compliance Abstraction Adapter (Confident LIMS, COA parse) |
| `lib/buddy/` | Buddy AI context + replies |
| `app/api/internal/` | Stash, sessions, posts, CAA, RDA, Buddy APIs |
| `types/budbook.ts` | Domain types |
| `types/rda.ts` | RDA TypeScript contract |
| `docs/mvp-scope.md` | MVP scope tracker |
| `fixtures/rda/` | Example operator shop import JSON |
| `fixtures/learn/` | Learn CMS article seed / import JSON |

### Native routes

| Route | Purpose |
|-------|---------|
| `/budbook-app` | Dashboard |
| `/budbook-app/stash` | Products + inventory |
| `/budbook-app/journal` | Sessions + log form |
| `/budbook-app/scanner` | COA scanner → parse API + stash POST |
| `/budbook-app/media` | Community feed + curated content |
| `/budbook-app/post/new` | Create a community post |
| `/budbook-app/shops` | Dispensaries (operator-imported RDA data) |
| `/budbook-app/buddy` | Buddy AI chat |
| `/budbook-app/friends`, `/circles`, `/cannadex`, `/learn`, `/profile`, `/settings` | Social, Learn CMS, & profile surfaces |

## Related

- Live deployment: [budbook.base44.app](https://budbook.base44.app)
- BudBeat (live performance layer): [budbeat-app](https://github.com/jackcooperyc/budbeat-app)
