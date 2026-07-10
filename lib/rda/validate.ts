import type { RetailMenuItem, RetailStore } from '@/types/rda';

export type RdaValidationError = {
  path: string;
  message: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, key: string, path: string, errors: RdaValidationError[]) {
  const value = obj[key];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ path: `${path}.${key}`, message: 'required string' });
  }
}

function validateRetailStore(store: unknown, index: number): RetailStore | null {
  const path = `stores[${index}]`;
  const errors: RdaValidationError[] = [];

  if (!isObject(store)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }

  requireString(store, 'store_key', path, errors);
  requireString(store, 'name', path, errors);
  requireString(store, 'address', path, errors);
  requireString(store, 'city', path, errors);
  requireString(store, 'state', path, errors);
  requireString(store, 'zip', path, errors);

  if (!isObject(store.source)) {
    errors.push({ path: `${path}.source`, message: 'required object' });
  } else {
    requireString(store.source, 'provider', `${path}.source`, errors);
    requireString(store.source, 'adapter', `${path}.source`, errors);
    requireString(store.source, 'fetched_at', `${path}.source`, errors);
  }

  if (errors.length > 0) return null;
  return store as RetailStore;
}

function validateRetailMenuItem(item: unknown, storeKey: string, index: number): RetailMenuItem | null {
  const path = `menus.${storeKey}[${index}]`;
  const errors: RdaValidationError[] = [];

  if (!isObject(item)) {
    errors.push({ path, message: 'must be an object' });
    return null;
  }

  requireString(item, 'menu_item_key', path, errors);
  requireString(item, 'store_key', path, errors);
  requireString(item, 'product_key', path, errors);
  requireString(item, 'raw_name', path, errors);
  requireString(item, 'product_name', path, errors);
  requireString(item, 'category', path, errors);

  if (!isObject(item.source)) {
    errors.push({ path: `${path}.source`, message: 'required object' });
  }

  if (errors.length > 0) return null;
  return item as RetailMenuItem;
}

export function validateRdaImport(input: unknown): {
  ok: boolean;
  errors: RdaValidationError[];
  data?: { stores: RetailStore[]; menus: Record<string, RetailMenuItem[]> };
} {
  const errors: RdaValidationError[] = [];

  if (!isObject(input)) {
    return { ok: false, errors: [{ path: '', message: 'body must be an object' }] };
  }

  if (!Array.isArray(input.stores)) {
    errors.push({ path: 'stores', message: 'must be an array' });
  }

  if (!isObject(input.menus)) {
    errors.push({ path: 'menus', message: 'must be an object' });
  }

  if (errors.length > 0) return { ok: false, errors };

  const stores: RetailStore[] = [];
  for (let i = 0; i < (input.stores as unknown[]).length; i++) {
    const store = validateRetailStore((input.stores as unknown[])[i], i);
    if (!store) {
      errors.push({ path: `stores[${i}]`, message: 'invalid store' });
    } else {
      stores.push(store);
    }
  }

  const menus: Record<string, RetailMenuItem[]> = {};
  for (const [storeKey, rawItems] of Object.entries(input.menus as Record<string, unknown>)) {
    if (!Array.isArray(rawItems)) {
      errors.push({ path: `menus.${storeKey}`, message: 'must be an array' });
      continue;
    }

    const items: RetailMenuItem[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = validateRetailMenuItem(rawItems[i], storeKey, i);
      if (!item) {
        errors.push({ path: `menus.${storeKey}[${i}]`, message: 'invalid menu item' });
      } else {
        items.push(item);
      }
    }
    menus[storeKey] = items;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], data: { stores, menus } };
}
