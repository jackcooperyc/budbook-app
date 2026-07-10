import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { hashContent } from '@lib/coa/hash';
import { validateUrl } from '@lib/coa/validate';

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 5 * 1024 * 1024;

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

export type CoaFetchResult = {
  body: string;
  contentHash: string;
  contentType: string;
};

function isPrivateOrReservedIp(ip: string): boolean {
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;

  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  if (version === 6) {
    return ip.startsWith('::ffff:') && isPrivateOrReservedIp(ip.slice(7));
  }

  return false;
}

export async function assertPublicHttpUrl(url: string): Promise<URL> {
  const validation = validateUrl(url);
  if (!validation.ok) {
    throw new Error(`${validation.errorCode}: ${validation.message}`);
  }

  const parsed = new URL(validation.sourceUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error('INVALID_URL: URL hostname is not allowed.');
  }

  const literalIp = isIP(hostname);
  if (literalIp && isPrivateOrReservedIp(hostname)) {
    throw new Error('INVALID_URL: URL resolves to a private or reserved address.');
  }

  if (!literalIp) {
    const results = await lookup(hostname, { verbatim: true, all: true });
    const addresses = Array.isArray(results) ? results : [results];
    for (const entry of addresses) {
      if (isPrivateOrReservedIp(entry.address)) {
        throw new Error('INVALID_URL: URL resolves to a private or reserved address.');
      }
    }
  }

  return parsed;
}

async function readLimitedBody(res: Response): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      throw new Error('RESOLVE_FAILED: COA document exceeds size limit.');
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
    if (total > MAX_BYTES) {
      throw new Error('RESOLVE_FAILED: COA document exceeds size limit.');
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

function bodyToText(buf: Buffer, contentType: string): string {
  if (contentType.includes('pdf')) {
    const raw = buf.toString('latin1');
    return raw.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
  }
  return buf.toString('utf8');
}

/**
 * Open fetch with private-IP blocking. Used by CAA httpExtract and COA resolve.
 */
export async function fetchCoaUrl(url: string): Promise<CoaFetchResult | null> {
  await assertPublicHttpUrl(url);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'text/html,text/plain,application/pdf,*/*' },
    redirect: 'follow',
  });

  if (!res.ok) return null;

  const contentType = res.headers.get('content-type') ?? '';
  const buf = await readLimitedBody(res);
  const body = bodyToText(buf, contentType);

  return {
    body,
    contentHash: hashContent(buf),
    contentType,
  };
}
