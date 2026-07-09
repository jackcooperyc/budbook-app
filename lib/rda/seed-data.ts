import type { RetailMenuItem, RetailStore } from '@/types/rda';
import { deriveMenuItemKey, deriveProductKey, deriveStoreKey } from './keying';

const FETCHED_AT = () => new Date().toISOString();

function source(url: string | null = null) {
  return {
    provider: 'cannmenus' as const,
    adapter: 'cannmenus' as const,
    source_confidence: 'high' as const,
    fetched_at: FETCHED_AT(),
    source_url: url,
  };
}

export function buildRdaSeed(): { stores: RetailStore[]; menus: Record<string, RetailMenuItem[]> } {
  const stores: RetailStore[] = [
    {
      store_key: deriveStoreKey('OR', 'Portland', 'OLCC-12345', 'Green Leaf Collective'),
      name: 'Green Leaf Collective',
      address: '1842 NE Alberta St',
      city: 'Portland',
      state: 'OR',
      zip: '97211',
      lat: 45.559,
      lng: -122.644,
      hours: { mon: '9am–9pm', tue: '9am–9pm', wed: '9am–9pm', thu: '9am–9pm', fri: '9am–10pm', sat: '9am–10pm', sun: '10am–8pm' },
      services: { has_delivery: true, has_storefront: true, medical: true, recreational: true },
      license_number: 'OLCC-12345',
      rating: 4.6,
      review_count: 312,
      image_url: null,
      brands_carried: ['BudBook Farms', 'Pacific Roots', 'TerpTown'],
      source: source('https://cannmenus.example/green-leaf'),
    },
    {
      store_key: deriveStoreKey('OR', 'Portland', 'OLCC-67890', 'Rose City Wellness'),
      name: 'Rose City Wellness',
      address: '520 SE Morrison St',
      city: 'Portland',
      state: 'OR',
      zip: '97214',
      lat: 45.517,
      lng: -122.663,
      hours: { mon: '10am–8pm', tue: '10am–8pm', wed: '10am–8pm', thu: '10am–8pm', fri: '10am–9pm', sat: '10am–9pm', sun: '11am–6pm' },
      services: { has_delivery: false, has_storefront: true, medical: true, recreational: true },
      license_number: 'OLCC-67890',
      rating: 4.4,
      review_count: 189,
      image_url: null,
      brands_carried: ['Willamette Gardens', 'Cascade Cultivation'],
      source: source('https://cannmenus.example/rose-city'),
    },
    {
      store_key: deriveStoreKey('OR', 'Beaverton', 'OLCC-24680', 'Valley View Dispensary'),
      name: 'Valley View Dispensary',
      address: '9900 SW Canyon Rd',
      city: 'Beaverton',
      state: 'OR',
      zip: '97005',
      lat: 45.492,
      lng: -122.775,
      hours: { mon: '9am–9pm', tue: '9am–9pm', wed: '9am–9pm', thu: '9am–9pm', fri: '9am–9pm', sat: '9am–9pm', sun: '10am–7pm' },
      services: { has_delivery: true, has_storefront: true, medical: false, recreational: true },
      license_number: 'OLCC-24680',
      rating: 4.2,
      review_count: 97,
      image_url: null,
      brands_carried: ['TerpTown', 'Valley Select'],
      source: source('https://cannmenus.example/valley-view'),
    },
  ];

  const greenLeaf = stores[0].store_key;
  const roseCity = stores[1].store_key;
  const valleyView = stores[2].store_key;

  const menus: Record<string, RetailMenuItem[]> = {
    [greenLeaf]: [
      menuItem(greenLeaf, 'Wedding Cake', 'BudBook Farms', 'flower', '3.5g', 24.99, 28.4, 0.1, 'cann-sku-wc-35'),
      menuItem(greenLeaf, 'GMO Cookies', 'Pacific Roots', 'flower', '3.5g', 32.0, 31.2, 0.05, 'cann-sku-gmo-35'),
      menuItem(greenLeaf, 'Blue Dream', 'TerpTown', 'flower', '1g', 12.0, 22.1, 0.08, 'cann-sku-bd-1'),
    ],
    [roseCity]: [
      menuItem(roseCity, "Charlotte's Web", 'Willamette Gardens', 'tincture', '30ml', 45.0, 0.3, 18.2, 'cann-sku-cw-30'),
      menuItem(roseCity, 'Sour Diesel', 'Cascade Cultivation', 'flower', '3.5g', 28.0, 26.8, 0.06, 'cann-sku-sd-35'),
    ],
    [valleyView]: [
      menuItem(valleyView, 'Zkittlez', 'Valley Select', 'flower', '3.5g', 26.0, 24.5, 0.07, 'cann-sku-zk-35'),
      menuItem(valleyView, 'Northern Lights', 'TerpTown', 'pre-roll', '1g', 8.0, 21.0, 0.04, 'cann-sku-nl-1'),
    ],
  };

  return { stores, menus };
}

function menuItem(
  storeKey: string,
  productName: string,
  brand: string,
  category: string,
  weight: string,
  price: number,
  thc: number,
  cbd: number,
  sku: string,
): RetailMenuItem {
  const rawName = `${brand} ${productName} ${weight}`;
  const productKey = deriveProductKey(brand, productName, category);
  return {
    menu_item_key: deriveMenuItemKey(storeKey, sku, rawName),
    store_key: storeKey,
    product_key: productKey,
    sku,
    raw_name: rawName,
    product_name: productName,
    brand_name: brand,
    category,
    subcategory: null,
    tags: category === 'flower' ? ['indica-leaning'] : [],
    display_weight: weight,
    percentage_thc: thc,
    percentage_cbd: cbd,
    mg_thc: null,
    mg_cbd: null,
    price,
    medical: true,
    recreational: true,
    image_url: null,
    source: source(),
  };
}
