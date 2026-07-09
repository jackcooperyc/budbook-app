# Phase 5 — Auth, live adapters, social graph

## 1. Session auth

Email sign-in with JWT httpOnly cookie when `BUDBOOK_AUTH_SECRET` is set.

| Route | Purpose |
|-------|---------|
| `POST /api/auth/sign-in` | Email + display name → session cookie |
| `POST /api/auth/sign-out` | Clear session |
| `GET /api/auth/session` | Current session status |
| `/budbook-app/sign-in` | Sign-in UI |

Middleware protects `/budbook-app/*` and `/api/internal/*` when auth is enabled.

**Vercel:** `openssl rand -hex 32` → `BUDBOOK_AUTH_SECRET` in Production.

Without `BUDBOOK_AUTH_SECRET`, dev mode uses the default user (unchanged local DX).

## 2. CAA live adapter

`lib/caa/adapters/httpExtract.ts` fetches COA URLs and extracts THC/CBD/terpenes from document text before falling back to keyword hints.

Paste raw lab report text in the scanner for best live-parse results.

## 3. RDA cache refresh

`lib/rda/refresh.ts` re-seeds shop cache when `source.fetched_at` exceeds `RDA_CACHE_TTL_MS` (default 24h).

Hook point for future CannMenus / Weedmaps live adapters.

## 4. Social graph

| Table | Purpose |
|-------|---------|
| `friendships` | Friend connections per user |
| `circles` | Wellness groups |
| `circle_members` | Membership |

APIs: `GET /api/internal/budbook-friends`, `GET/POST /api/internal/budbook-circles`.

Demo friends/circles seed on first visit.

## 5. Buddy LLM (optional)

Set `BUDBOOK_OPENAI_API_KEY` for GPT-powered replies. Without it, rule-based coach uses live stash/journal context.

```bash
npm run db:migrate   # applies 001 + 002
```
