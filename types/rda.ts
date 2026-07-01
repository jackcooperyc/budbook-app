/**
 * Retail Data Adapter (RDA) types.
 *
 * The RDA is the single internal gateway for retail/marketing data (store
 * listings, menus, prices, hours, brands) sourced from Weedmaps, Leafly, and
 * aggregators. It mirrors the Compliance Abstraction Adapter (CAA) pattern:
 * feature code never calls a source directly — it reads normalized RDA shapes.
 *
 * Retail data is best-effort and cache-backed. Authoritative terpene/COA data
 * comes from the CAA (Metrc), never from here. `percentage_thc`/`percentage_cbd`
 * are display-only until confirmed by the CAA via `product_key`.
 *
 * See docs/rda-spec.md for the full contract.
 */

import type { Dispensary, Product } from './budbook';

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/** Originating retail platform (not the vendor tool that fetched it). */
export type RetailProvider =
  | 'cannmenus'
  | 'weedmaps'
  | 'leafly'
  | 'dutchie'
  | 'jane';

/** Which RDA adapter produced the record. Drives the future API swap. */
export type RetailAdapterId =
  | 'cannmenus'
  | 'apify_weedmaps'
  | 'apify_leafly'
  | 'official_weedmaps';

/**
 * high   = licensed aggregator or official API
 * medium = actor-sourced (Apify / ScrapingBee)
 * low    = record older than the freshness window
 */
export type SourceConfidence = 'high' | 'medium' | 'low';

export type RetailSource = {
  provider: RetailProvider;
  adapter: RetailAdapterId;
  source_confidence: SourceConfidence;
  fetched_at: string; // ISO datetime
  source_url: string | null;
};

// ---------------------------------------------------------------------------
// Normalized retail entities
// ---------------------------------------------------------------------------

export type RetailServiceFlags = {
  has_delivery: boolean;
  has_storefront: boolean;
  medical: boolean;
  recreational: boolean;
};

/**
 * A normalized dispensary/shop listing. Resolves up to the BudBook `Dispensary`
 * type for the My Shops surface via `toDispensary`.
 */
export type RetailStore = {
  store_key: string; // stable internal id (see docs/rda-spec.md#keying)
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  hours: Record<string, string> | null;
  services: RetailServiceFlags;
  license_number: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  brands_carried: string[];
  source: RetailSource;
};

/**
 * A normalized product listing from a store menu. Resolves to a BudBook
 * `Product` once the CAA enriches it with authoritative terpene/COA data.
 */
export type RetailMenuItem = {
  menu_item_key: string; // stable internal id
  store_key: string; // FK -> RetailStore
  product_key: string; // join key to CAA / Cannadex
  sku: string | null; // cross-platform sku (CannMenus cann_sku_id)
  raw_name: string;
  product_name: string;
  brand_name: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  display_weight: string | null;
  percentage_thc: number | null; // display-only until CAA-confirmed
  percentage_cbd: number | null; // display-only until CAA-confirmed
  mg_thc: number | null;
  mg_cbd: number | null;
  price: number | null;
  medical: boolean;
  recreational: boolean;
  image_url: string | null;
  source: RetailSource;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export type RetailStoreQuery = {
  state?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  distance_miles?: number; // used with lat/lng
};

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

export type RetailCapability = 'stores' | 'menus' | 'reviews' | 'brands';

/**
 * Every source adapter implements this so the RDA can route and swap sources
 * uniformly. Merge order when adapters overlap on store_key:
 * official > cannmenus > apify. Higher confidence wins; lower fills gaps.
 */
export interface RetailAdapter {
  readonly id: RetailAdapterId;
  readonly capabilities: RetailCapability[];

  fetchStores(query: RetailStoreQuery): Promise<RetailStore[]>;
  fetchMenu(store_key: string): Promise<RetailMenuItem[]>;
}

// ---------------------------------------------------------------------------
// Resolvers to existing BudBook entity types (implemented in lib/rda)
// ---------------------------------------------------------------------------

export type ToDispensary = (store: RetailStore) => Dispensary;

/**
 * Resolves a retail menu item to a BudBook Product. `enrich` supplies the
 * CAA-confirmed terpene profile and lab report id, joined on product_key.
 * When enrichment is unavailable, terpene_profile is [] and the UI renders a
 * "pending" state rather than hiding the product.
 */
export type ToProduct = (
  item: RetailMenuItem,
  enrich?: Pick<Product, 'terpene_profile' | 'lab_report_id' | 'type'>,
) => Product;
