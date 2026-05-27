# BudBook App

Standalone host for the BudBook consumer SPA, extracted from the JCS / CŪPR ecosystem monorepo.

This repository contains:

- The compiled BudBook SPA under `public/budbook-app/` (Base44 build output)
- Local mock API routes so the app runs offline with `?mock=1`
- BudBook domain types and mock payload normalization

The original Vite / Base44 source project is not included here — only the production build artifacts and the Next.js shell that serves them.

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000/budbook-app/?mock=1](http://localhost:3000/budbook-app/?mock=1).

## Production

In production the SPA talks to Base44 (`base44.app`) unless mock mode is enabled.

To allow mock data in a deployed environment:

```bash
BUDBOOK_MOCK_ENABLED=1 npm run start
```

## Structure

| Path | Purpose |
|------|---------|
| `public/budbook-app/` | Compiled SPA assets |
| `lib/budbook-mock/` | Mock entity payload builder |
| `app/api/` | Mock API routes for offline demo |
| `types/budbook.ts` | Domain types |
| `public/budbook_pitchdeck.html` | Pitch deck (from JCS Data Matrix) |

## Related

- Live deployment: [budbook.base44.app](https://budbook.base44.app)
- BudBeat (live performance layer): [budbeat-app](https://github.com/jackcooperyc/budbeat-app)
