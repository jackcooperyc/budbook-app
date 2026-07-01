/** Deterministic internal store id from normalized location + license. */
export function deriveStoreKey(
  state: string,
  city: string,
  license: string | null,
  name: string,
): string {
  const slug = [state, city, license ?? name]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `store-${slug}`;
}

export function deriveMenuItemKey(storeKey: string, sku: string | null, rawName: string): string {
  const id = sku ?? rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  return `menu-${storeKey}-${id}`;
}

export function deriveProductKey(brand: string | null, productName: string, category: string): string {
  const slug = [brand ?? 'unknown', productName, category]
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `pk-${slug}`;
}
