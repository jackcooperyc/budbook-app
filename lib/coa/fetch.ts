import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { hashContent } from '@lib/coa/hash';
import type { CoaScanErrorCode } from '@lib/coa/types';
import { validateUrl } from '@lib/coa/validate';

export const FETCH_TIMEOUT_MS = 12_000;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const MAX_REDIRECTS = 5;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
]);

export class CoaFetchError extends Error {
  readonly code: CoaScanErrorCode;

  constructor(code: CoaScanErrorCode, message: string) {
    super(message);
    this.name = 'CoaFetchError';
    this.code = code;
  }
}

export type CoaFetchResult = {
  body: string;
  contentHash: string;
  contentType: string;
  finalUrl: string;
  isPdf: boolean;
  redirectCount: number;
  /** Byte length of the fetched body — full HTML is not persisted by default. */
  byteLength: number;
};

function ipv4Octets(ip: string): number[] | null {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }
  return parts;
}

/** True for loopback, private, link-local, multicast, CGNAT, and other reserved ranges. */
export function isBlockedIp(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();
  if (!normalized) return true;

  if (
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1' ||
    normalized === '::' ||
    normalized === '0:0:0:0:0:0:0:0'
  ) {
    return true;
  }

  // IPv4-mapped IPv6
  if (normalized.startsWith('::ffff:')) {
    return isBlockedIp(normalized.slice('::ffff:'.length));
  }

  // IPv6 link-local / ULA / multicast
  if (
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('ff')
  ) {
    return true;
  }

  const version = isIP(normalized);
  if (version === 6) {
    // Block unspecified / documentation-ish short forms already covered; allow public v6.
    return false;
  }

  if (version !== 4) return true;

  const octets = ipv4Octets(normalized);
  if (!octets) return true;
  const [a, b] = octets;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 IETF + special
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function hostnameLooksLocal(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  return false;
}

/**
 * Validate that a URL is safe to fetch: http(s), no credentials, public DNS only.
 */
export async function assertPublicHttpUrl(url: string): Promise<URL> {
  const validation = validateUrl(url);
  if (!validation.ok) {
    throw new CoaFetchError(validation.errorCode, validation.message);
  }

  let parsed: URL;
  try {
    parsed = new URL(validation.sourceUrl);
  } catch {
    throw new CoaFetchError('INVALID_URL', 'URL is not valid.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CoaFetchError('INVALID_URL', 'Only http and https URLs are supported.');
  }

  if (parsed.username || parsed.password) {
    throw new CoaFetchError('BLOCKED_URL', 'URLs with embedded credentials are not allowed.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) {
    throw new CoaFetchError('INVALID_URL', 'URL must include a hostname.');
  }

  if (hostnameLooksLocal(hostname)) {
    throw new CoaFetchError('BLOCKED_URL', 'URL hostname is not allowed.');
  }

  const literalIp = isIP(hostname);
  if (literalIp) {
    if (isBlockedIp(hostname)) {
      throw new CoaFetchError('BLOCKED_URL', 'URL resolves to a private or reserved address.');
    }
    return parsed;
  }

  let addresses: Array<{ address: string }>;
  try {
    const results = await lookup(hostname, { verbatim: true, all: true });
    addresses = Array.isArray(results) ? results : [results];
  } catch {
    throw new CoaFetchError('FETCH_FAILED', `DNS lookup failed for hostname "${hostname}".`);
  }

  if (addresses.length === 0) {
    throw new CoaFetchError('FETCH_FAILED', `DNS lookup returned no addresses for "${hostname}".`);
  }

  for (const entry of addresses) {
    if (isBlockedIp(entry.address)) {
      throw new CoaFetchError(
        'BLOCKED_URL',
        `URL resolves to a private or reserved address (${entry.address}).`,
      );
    }
  }

  return parsed;
}

function isPdfResponse(contentType: string, contentDisposition: string, buf: Buffer): boolean {
  const ct = contentType.toLowerCase();
  const cd = contentDisposition.toLowerCase();
  if (ct.includes('application/pdf') || ct.includes('application/x-pdf')) return true;
  if (cd.includes('filename=') && /\.pdf["';]?$/i.test(cd)) return true;
  if (cd.includes('.pdf')) return true;
  // Magic header
  if (buf.length >= 5 && buf.subarray(0, 5).toString('utf8') === '%PDF-') return true;
  return false;
}

async function readLimitedBody(res: Response): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_RESPONSE_BYTES) {
      throw new CoaFetchError('UNSUPPORTED_CONTENT', 'COA document exceeds size limit.');
    }
    return buf;
  }

  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new CoaFetchError('UNSUPPORTED_CONTENT', 'COA document exceeds size limit.');
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

function resolveRedirectUrl(current: URL, location: string): URL {
  try {
    return new URL(location, current);
  } catch {
    throw new CoaFetchError('FETCH_FAILED', 'Redirect Location header was not a valid URL.');
  }
}

/**
 * SSRF-safe fetch for COA HTML pages.
 * Does not forward cookies, Authorization, or internal headers.
 * Follows redirects manually and revalidates every hop.
 */
export async function fetchCoaUrl(url: string): Promise<CoaFetchResult> {
  let current = await assertPublicHttpUrl(url);
  let redirectCount = 0;

  while (true) {
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'User-Agent': 'StashdCOAResolver/1.0',
        },
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      const message = err instanceof Error ? err.message : 'COA fetch failed.';
      if (name === 'TimeoutError' || name === 'AbortError' || /aborted|timeout/i.test(message)) {
        throw new CoaFetchError('FETCH_TIMEOUT', 'COA fetch timed out.');
      }
      throw new CoaFetchError('FETCH_FAILED', message);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new CoaFetchError('FETCH_FAILED', 'Redirect response missing Location header.');
      }
      redirectCount += 1;
      if (redirectCount > MAX_REDIRECTS) {
        throw new CoaFetchError('FETCH_FAILED', `Too many redirects (max ${MAX_REDIRECTS}).`);
      }
      const next = resolveRedirectUrl(current, location);
      current = await assertPublicHttpUrl(next.toString());
      continue;
    }

    if (!res.ok) {
      throw new CoaFetchError(
        'FETCH_FAILED',
        `Remote server returned HTTP ${res.status} for COA URL.`,
      );
    }

    const contentType = res.headers.get('content-type') ?? '';
    const contentDisposition = res.headers.get('content-disposition') ?? '';
    const buf = await readLimitedBody(res);
    const isPdf = isPdfResponse(contentType, contentDisposition, buf);

    if (isPdf) {
      return {
        body: '',
        contentHash: hashContent(buf),
        contentType: contentType || 'application/pdf',
        finalUrl: current.toString(),
        isPdf: true,
        redirectCount,
        byteLength: buf.length,
      };
    }

    const lowerType = contentType.toLowerCase();
    if (
      lowerType &&
      !lowerType.includes('text/html') &&
      !lowerType.includes('application/xhtml') &&
      !lowerType.includes('text/plain') &&
      !lowerType.includes('application/json') &&
      !lowerType.includes('application/ld+json')
    ) {
      throw new CoaFetchError(
        'UNSUPPORTED_CONTENT',
        `Unsupported content type "${contentType.split(';')[0] || 'unknown'}". HTML COA pages only.`,
      );
    }

    const body = buf.toString('utf8');
    return {
      body,
      contentHash: hashContent(buf),
      contentType,
      finalUrl: current.toString(),
      isPdf: false,
      redirectCount,
      byteLength: buf.length,
    };
  }
}
