import type { Dispensary, Product } from '@/types/pacs';
import type { RetailMenuItem, RetailStore } from '@/types/rda';
import type { CaaEnrichment } from '@/types/caa';

export function toDispensary(store: RetailStore): Dispensary {
  const brands =
    store.brands_carried.length > 0
      ? `Brands: ${store.brands_carried.join(', ')}`
      : '';
  const rating =
    store.rating != null
      ? `Rating ${store.rating} (${store.review_count ?? 0} reviews) · via ${store.source.provider}`
      : `via ${store.source.provider}`;

  return {
    id: store.store_key,
    name: store.name,
    shop_name: store.name,
    city: store.city,
    state: store.state,
    address: store.address,
    zip_code: store.zip,
    notes: [brands, rating].filter(Boolean).join(' · '),
    last_visit_date: store.source.fetched_at.slice(0, 10),
  };
}

export function toProduct(item: RetailMenuItem, enrich?: CaaEnrichment | null): Product {
  const confirmed = enrich?.compliance_status === 'confirmed';
  const product: Product = {
    id: `prod-rda-${item.menu_item_key}`,
    name: item.product_name,
    strain_name: item.product_name,
    brand: item.brand_name ?? 'Unknown',
    type: enrich?.type ?? 'hybrid',
    category: item.category,
    thc_percentage: confirmed && enrich?.thc_percentage != null
      ? enrich.thc_percentage
      : item.percentage_thc ?? 0,
    cbd_percentage: confirmed && enrich?.cbd_percentage != null
      ? enrich.cbd_percentage
      : item.percentage_cbd ?? 0,
    terpene_profile: enrich?.terpene_profile ?? [],
    lab_report_id: enrich?.lab_report_id ?? `pending-${item.product_key}`,
    dispensary_id: item.store_key,
    product_key: item.product_key,
  };
  return product;
}
