# BudBook App

Standalone host for the BudBook consumer SPA, extracted from the JCS / CŪPR ecosystem monorepo.

This repository contains:

- A **native Next.js UI** at `/budbook-app/*` (editable design system, dark botanical brand)
- The compiled legacy BudBook SPA under `public/budbook-app/` (Base44 build output)
- Local mock API routes so both UIs run offline with mock data
- BudBook domain types and mock payload normalization
- File-backed dev APIs for stash, COA parsing hints, and community posts

The original Vite / Base44 source project is not included here — only the production build artifacts and the Next.js shell that serves them.

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3010/budbook-app](http://localhost:3010/budbook-app) for the **native Next.js UI** (editable design system).

Legacy Base44 SPA (compiled build): [http://localhost:3010/budbook-app/index.html?mock=1](http://localhost:3010/budbook-app/index.html?mock=1)

Port **3010** is pinned in `npm run dev` so BudBook does not collide with other tools that often bind **3000**.

Optional: set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` in `.env.local` for the dispensary map embed (see `.env.example`).

## Production

In production the SPA talks to Base44 (`base44.app`) unless mock mode is enabled.

To allow mock data in a deployed environment:

```bash
BUDBOOK_MOCK_ENABLED=1 npm run start
```

## Structure

| Path | Purpose |
|------|---------|
| `app/budbook-app/` | Native Next.js UI (dashboard, stash, journal, social, cannadex, scanner, buddy) |
| `src/components/` | Design system + product components (PostCard, SessionLogForm, DispensaryMap, etc.) |
| `src/lib/budbook-stash/` | File-backed stash store (`data/local-stash.json`) |
| `src/lib/budbook-posts/` | File-backed community posts (`data/local-posts.json`) |
| `src/lib/budbook-coa/` | COA URL hint parser for scanner demo |
| `public/budbook-app/` | Legacy compiled Base44 SPA |
| `lib/budbook-mock/` | Mock entity payload builder |
| `app/api/internal/` | Mock + dev APIs (payloads, stash, posts, COA parse) |
| `types/budbook.ts` | Domain types |
| `public/budbook_pitchdeck.html` | Pitch deck (from JCS Data Matrix) |

### Native routes

| Route | Purpose |
|-------|---------|
| `/budbook-app` | Dashboard |
| `/budbook-app/stash` | Products + hardware (mock + server stash) |
| `/budbook-app/journal` | Sessions + log form |
| `/budbook-app/scanner` | COA scanner → parse API + stash POST |
| `/budbook-app/media` | Community feed + curated content |
| `/budbook-app/post/new` | Create a community post |
| `/budbook-app/shops` | Dispensaries with search + map pin selection |
| `/budbook-app/buddy` | Buddy AI chat |
| `/budbook-app/friends`, `/circles`, `/cannadex`, `/learn`, `/profile`, `/settings` | Social & profile surfaces |

## Related

- Live deployment: [budbook.base44.app](https://budbook.base44.app)
- BudBeat (live performance layer): [budbeat-app](https://github.com/jackcooperyc/budbeat-app)
