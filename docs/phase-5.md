# Phase 5 — Auth, live adapters, social graph

## 1. Session auth

Email sign-in with JWT httpOnly cookie when `PACSMT_AUTH_SECRET` is set.

| Route | Purpose |
|-------|---------|
| `POST /api/auth/sign-in` | Email + display name → session cookie |
| `POST /api/auth/sign-out` | Clear session |
| `GET /api/auth/session` | Current session status |
| `/pacs/sign-in` | Sign-in UI |

Middleware protects `/pacs/*` and `/api/internal/*` when auth is enabled.

**Vercel:** `openssl rand -hex 32` → `PACSMT_AUTH_SECRET` in Production.

Without `PACSMT_AUTH_SECRET`, dev mode uses the default user (unchanged local DX).

## 2. CAA live adapter

`lib/caa/adapters/httpExtract.ts` fetches COA URLs and extracts THC/CBD/terpenes from document text before falling back to keyword hints.

**PDF text layer:** `lib/coa/pdfExtract.ts` + `pdfNormalize.ts` extract plain text from digital PDFs (`provider: pdf_text`, field `source: label_ocr`). Scanned/image PDFs stay needs-review without OCR.

**Metrc (optional):** `lib/caa/adapters/metrc.ts` when all of these are set:

```bash
METRC_BASE_URL=https://api-mt.metrc.com
METRC_USER_KEY=...
METRC_VENDOR_KEY=...
```

Without Metrc env, Metrc URLs fall through to HTML/PDF extractors.

Paste raw lab report text in the scanner for best live-parse results.

## 3. RDA cache refresh

`lib/rda/refresh.ts` marks operator-imported records as stale (`source_confidence: low`) when `source.fetched_at` exceeds `RDA_CACHE_TTL_MS` (default 24h). Data is **not** wiped on TTL expiry.

Hook point for future CannMenus / Weedmaps live adapters.

## 4. Social graph

| Table | Purpose |
|-------|---------|
| `friendships` | Friend connections per user |
| `circles` | Wellness groups |
| `circle_members` | Membership |

APIs: `GET /api/internal/friends`, `GET/POST /api/internal/circles`.

Friends and circles start empty — users create circles via the UI. Friend invites ship post-MVP.

## 5. Buddy LLM (optional)

Set `PACSMT_OPENAI_API_KEY` for GPT-powered replies. Without it, rule-based coach uses live stash/journal context.

```bash
npm run db:migrate   # applies 001 + 002 + 003
```
