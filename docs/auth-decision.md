# Auth Decision

## Decision

**Session auth is implemented for production.** Email sign-in with JWT httpOnly cookie when `PACSMT_AUTH_SECRET` is set.

Without `PACSMT_AUTH_SECRET`, local dev uses the single default user (`getDefaultUser` / `getCurrentUserId`).

## Implementation

| Component | Behavior |
|-----------|----------|
| `POST /api/auth/sign-in` | Email + display name → session cookie |
| `POST /api/auth/sign-out` | Clear session |
| `GET /api/auth/session` | Current session status |
| `internalApiGuard()` | Requires session when auth is enabled |
| `resolveCurrentUser()` | Session user in production; dev user locally |
| `getCurrentUserId()` | Scopes stash, sessions, posts, social by `user_id` |

## Vercel setup

```bash
openssl rand -hex 32   # → PACSMT_AUTH_SECRET in Production
```

Middleware protects `/pacs/*` and `/api/internal/*` when auth is enabled.

## Future work

OAuth providers (Clerk, Neon Auth) can map provider subject → `users.id` on first login. Schema and `user_id` scoping are already in place.
