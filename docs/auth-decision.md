# Auth Decision (Phase 4)

## Decision

**Defer full authentication for MVP+.** Continue using the single dev user (`getDefaultUser` / `getCurrentUserId`) with Neon row scoping by `user_id`.

## Rationale

- The core loop (stash → sessions → insights → posts) works end-to-end with persisted Neon data.
- Adding OAuth (Clerk, NextAuth, Neon Auth) is a product decision that touches every route, env vars, and Vercel preview URLs — better as a dedicated sprint than a sidecar.
- `users` table and `user_id` foreign keys are already in place for a clean auth swap.

## When auth ships

1. Replace `getCurrentUserId()` body with session lookup.
2. Gate `/api/internal/*` behind authenticated session (keep `BUDBOOK_MOCK_ENABLED` only for dev/staging if needed).
3. Map provider subject → `users.id` on first login.
4. Buddy, stash, sessions, and posts already scope by `user_id` — no schema change required.

## Alternatives considered

| Option | Verdict |
|--------|---------|
| Clerk + Next.js middleware | Strong UX; adds vendor + monthly cost |
| Neon Auth | Tight Postgres integration; newer surface area |
| NextAuth (Auth.js) | Flexible; more setup for App Router |

**Recommendation:** Clerk or Neon Auth when multi-user beta starts.
