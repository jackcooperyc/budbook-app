# Pacs.MT

**Product Analysis Certification Scanner for Montana Cannabis Packaging**

Next.js app for scanning COAs, verifying Montana lab data (CAA / Metrc), and tracking certified products.

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3010/pacs/scanner](http://localhost:3010/pacs/scanner).

Port **3010** is pinned in `npm run dev`.

Optional: set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` in `.env.local` for the dispensary map embed (see `.env.example`). Override the dev user with `PACSMT_USER_NAME`, `PACSMT_USER_USERNAME`, and `PACSMT_USER_EMAIL` when `PACSMT_AUTH_SECRET` is unset.

**Data:** The UI starts empty — scan COAs and log sessions to build your profile. See [docs/data-model.md](docs/data-model.md).

**Shops:** Operator-imported retail data via `npm run rda:import -- fixtures/rda/example-shop.json` (see [docs/rda-spec.md](docs/rda-spec.md)).

**Learn:** Education & harm-reduction articles at `/pacs/learn`. Auto-seeds on first visit; refresh with `npm run learn:import -- fixtures/learn/articles.json`.

**Theme:** Header sun/moon toggle, or **Settings → Appearance**. Preference is saved in `localStorage` (`pacsmt-theme`; migrates legacy `budbook-theme`).

## Production

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres |
| `PACSMT_AUTH_SECRET` | JWT session auth (`openssl rand -hex 32`) |

Optional:

| Variable | Purpose |
|----------|---------|
| `PACSMT_OPENAI_API_KEY` | PACS Assistant LLM layer |
| `RDA_IMPORT_SECRET` | Protects `POST /api/internal/rda/import` |
| `LEARN_IMPORT_SECRET` | Protects `POST /api/internal/learn/import` |
| `METRC_BASE_URL` / `METRC_USER_KEY` / `METRC_VENDOR_KEY` | Live Metrc COA lookup |

**Deploy note:** Rename Vercel env from `BUDBOOK_*` → `PACSMT_*` before shipping. Session cookie is now `pacsmt_session` (users re-login once). Legacy `/budbook-app/*` URLs permanently redirect to `/pacs/*`.

## Structure

| Path | Purpose |
|------|---------|
| `app/pacs/` | Native UI (scanner-first, dashboard, stash, journal, registry, assistant) |
| `src/components/` | Design system + product components |
| `lib/repositories/` | Neon + file-backed data access |
| `lib/rda/` | Retail Data Adapter |
| `lib/caa/` / `lib/coa/` | Compliance / COA scan pipeline |
| `lib/buddy/` | PACS Assistant context + replies |
| `app/api/internal/` | Stash, journal, posts, CAA, RDA, Learn, scans |
| `types/pacs.ts` | Domain types |
| `docs/mvp-scope.md` | MVP scope tracker |

### Native routes

| Route | Purpose |
|-------|---------|
| `/pacs` → `/pacs/scanner` | COA scanner (landing) |
| `/pacs/dashboard` | Insights dashboard |
| `/pacs/stash` | Products + inventory |
| `/pacs/journal` | Sessions + log form |
| `/pacs/registry` | CAA-confirmed product registry |
| `/pacs/assistant` | PACS Assistant chat |
| `/pacs/learn` | Learn CMS articles |
| `/pacs/shops`, `/friends`, `/circles`, `/media`, `/profile`, `/settings` | Supporting surfaces |

## Related

- Production: [budbook.cupr.app](https://budbook.cupr.app) (domain migration TBD)
- BudBeat: [budbeat-app](https://github.com/jackcooperyc/budbeat-app)
