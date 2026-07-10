# Retail Data Adapter (RDA) — Internal Spec

The RDA is BudBook's single internal gateway for **retail/marketing data**: store listings, menus, prices, hours, brands, and photos. It mirrors the Compliance Abstraction Adapter (CAA) discipline used for Metrc/BioTrackTHC — **feature code never calls a retail source directly**. All surfaces read normalized RDA shapes through one gateway.

TypeScript contract: [`types/rda.ts`](../types/rda.ts)

---

## Design principles

### One gateway, one schema, swappable sources

```
Feature UI / routes
        │
        ▼
   RDA gateway (lib/rda)
        │
   ┌────┴────┬────────────┬──────────────┐
   ▼         ▼            ▼              ▼
CannMenus  Apify WM   Apify Leafly   Official WM (future)
```

Adapters normalize inbound data into `RetailStore` and `RetailMenuItem`. Swapping Weedmaps from Apify to the official API changes only the adapter layer — nothing above the RDA.

### Hard scope boundary: RDA vs CAA

| Layer | Owns | Does not own |
|-------|------|--------------|
| **RDA** | Stores, menus, prices, brands, photos, hours, reviews | COA, terpenes, `compliance_status` |
| **CAA** | COA, terpene profiles, lab report IDs, compliance state | Retail pricing, store marketing copy |

**Retail potency is display-only** until the CAA confirms it via `product_key`. Cannadex terpene claims remain authoritative. When CAA enrichment is unavailable, the UI shows a **pending** state — it does not hide the product or invent terpene data.

### Sync, don't proxy

RDA routes **sync and cache** retail data; they do not proxy live third-party APIs on every user request.

- Every record carries `source.fetched_at` (ISO datetime) for staleness checks.
- `source.provider` is the attribution key from day one (required for UI badges and audit).
- `source_confidence` degrades to `low` when a record exceeds the freshness window.

---

## Entity model

Three normalized types. See [`types/rda.ts`](../types/rda.ts).

### `RetailSource` (provenance)

Attached to every store and menu item. Tracks:

- `provider` — originating platform (`weedmaps`, `leafly`, `cannmenus`, etc.)
- `adapter` — which RDA adapter produced the record (`cannmenus`, `apify_weedmaps`, `official_weedmaps`, …)
- `source_confidence` — `high` | `medium` | `low`
- `fetched_at` — cache timestamp
- `source_url` — deep link when available

### `RetailStore`

Normalized dispensary/shop listing. Resolves up to the existing BudBook [`Dispensary`](../types/budbook.ts) type for the **My Shops** surface via `toDispensary` (implemented in `lib/rda`).

### `RetailMenuItem`

Normalized product from a store menu. Resolves to BudBook [`Product`](../types/budbook.ts) after CAA enrichment on `product_key` via `toProduct`.

---

## Keying

Internal keys prevent raw Weedmaps/Leafly/CannMenus IDs from leaking into feature code and allow deduplication across providers.

| Key | Scope | Purpose |
|-----|-------|---------|
| `store_key` | `RetailStore` | Stable internal store id; same physical store from two providers collapses to one My Shops entry |
| `menu_item_key` | `RetailMenuItem` | Stable internal menu line id |
| `product_key` | `RetailMenuItem` | Join key to CAA / Cannadex for terpene and COA enrichment |

Key derivation rules (implementation detail for `lib/rda/keying`) should be deterministic from normalized address + license, or from aggregator cross-reference IDs (e.g. CannMenus `cann_sku_id` on `sku`).

---

## Adapter interface

Every source implements [`RetailAdapter`](../types/rda.ts):

```ts
interface RetailAdapter {
  readonly id: RetailAdapterId;
  readonly capabilities: RetailCapability[];

  fetchStores(query: RetailStoreQuery): Promise<RetailStore[]>;
  fetchMenu(store_key: string): Promise<RetailMenuItem[]>;
}
```

### Planned adapters

| Adapter ID | Role | Confidence |
|------------|------|------------|
| `cannmenus` | Primary — drop-in normalized feed | `high` |
| `apify_weedmaps` | Enrichment / gap-fill | `medium` |
| `apify_leafly` | Enrichment / gap-fill | `medium` |
| `official_weedmaps` | Registered slot for future official API swap | `high` |

### Merge order

When adapters return overlapping `store_key` values:

**official > cannmenus > apify**

Higher confidence wins; lower confidence fills gaps only.

---

## Resolvers (`lib/rda`)

| Function | Input | Output |
|----------|-------|--------|
| `toDispensary` | `RetailStore` | `Dispensary` |
| `toProduct` | `RetailMenuItem` + optional CAA enrich | `Product` |

`toProduct` accepts an optional `enrich` payload (`terpene_profile`, `lab_report_id`, `type`) joined on `product_key`. Without enrichment, `terpene_profile` is `[]` and the UI renders pending state.

---

## MVP route surface

Maps to `app/api/internal/rda/*` handlers (not yet implemented). Follows the same App Router + env-guard pattern as existing internal routes.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/internal/rda/stores` | `GET` | Search/list stores (`RetailStoreQuery` query params) |
| `/api/internal/rda/stores/[store_key]` | `GET` | Single store detail |
| `/api/internal/rda/stores/[store_key]/menu` | `GET` | Menu items for a store |
| `/api/internal/rda/sync` | `POST` | Trigger cache refresh for a store or region (operator/dev) |
| `/api/internal/rda/import` | `POST` | Operator shop import (`Authorization: Bearer $RDA_IMPORT_SECRET`) |

### Auth

RDA read routes use `internalApiGuard()` (session auth when `BUDBOOK_AUTH_SECRET` is set). The import route uses `RDA_IMPORT_SECRET` instead of user session.

---

## BudBook surfaces that consume RDA

| Surface | RDA data used |
|---------|---------------|
| `/budbook-app/shops` | `RetailStore` → `Dispensary`, map pins, search |
| `/budbook-app/stash` | Menu browse → add to stash (display potency only) |
| `/budbook-app/cannadex` | `product_key` join for authoritative terpenes (CAA) |
| `/budbook-app/scanner` | COA flow stays on CAA; RDA may suggest matching menu items |

---

## Implementation checklist

- [x] `lib/rda/` — gateway, keying, merge, cache store
- [x] `lib/rda/adapters/cannmenus.ts` — primary adapter (file-backed cache)
- [ ] `lib/rda/adapters/apify_weedmaps.ts` — enrichment adapter (post-MVP)
- [x] `lib/rda/resolvers.ts` — `toDispensary`, `toProduct`
- [x] `app/api/internal/rda/stores/route.ts`
- [x] `app/api/internal/rda/stores/[store_key]/route.ts`
- [x] `app/api/internal/rda/stores/[store_key]/menu/route.ts`
- [x] Wire `/budbook-app/shops` to RDA stores endpoint
- [x] Store menu → stash (`.../menu/[menu_item_key]/add-to-stash`)
- [x] CAA stub (`types/caa.ts`, `lib/caa/enrich.ts`)

---

## Related

- Domain types: [`types/budbook.ts`](../types/budbook.ts)
- Existing internal API pattern: [`app/api/internal/budbook-stash/route.ts`](../app/api/internal/budbook-stash/route.ts)
- CAA spec: *(future — same gateway pattern for compliance data)*
