import type { BudbookMockPayloads } from './buildPayloads';

/**
 * Matches Base44 entity GET paths under .../entities/{Entity} or .../entities/{Entity}/{id}
 * (any origin). Returns JSON-serializable data or null if this URL is not a mock entity GET.
 */
export function resolveMockEntityGet(
  urlStr: string,
  payloads: BudbookMockPayloads,
): unknown | null {
  let pathname = '';
  let search = '';
  try {
    const u = new URL(urlStr);
    pathname = u.pathname;
    search = u.search;
  } catch {
    const cut = urlStr.indexOf('?');
    pathname = cut >= 0 ? urlStr.slice(0, cut) : urlStr;
    search = cut >= 0 ? urlStr.slice(cut) : '';
  }

  const withoutQs = pathname.split('?')[0];
  // Allow optional trailing slash (some clients normalize URLs with a trailing /)
  const m = withoutQs.match(/\/entities\/([^/?]+)(?:\/([^/?]+))?\/?$/);
  if (!m) return null;

  const entity = m[1];
  const id = m[2];
  const sp = new URLSearchParams(search);

  if (entity === 'User' && id === 'me') {
    return payloads.user;
  }

  if (entity === 'Product') {
    if (!id) return payloads.products;
    const row = payloads.products.find((p) => String(p.id) === id);
    return row ?? null;
  }

  if (entity === 'Session') {
    if (!id) {
      const limitRaw = parseInt(sp.get('limit') || '50', 10);
      const limit = Number.isFinite(limitRaw)
        ? Math.min(100, Math.max(1, limitRaw))
        : 50;
      return payloads.sessions.slice(0, limit);
    }
    const row = payloads.sessions.find((s) => String(s.id) === id);
    return row ?? null;
  }

  if (entity === 'UserInventory' && !id) {
    return payloads.inventory;
  }

  if (entity === 'Dispensary' && !id) {
    return payloads.dispensaries;
  }

  if (entity === 'Accessory' && !id) {
    return payloads.accessories;
  }

  return null;
}
