import type { CoaProviderInput } from '@lib/coa/providers/types';

export function stripHtmlTags(html: string): string {
  const withDefs = html.replace(
    /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi,
    (_m, dt: string, dd: string) => {
      const label = dt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const value = dd.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return label && value ? ` ${label}: ${value} ` : ' ';
    },
  );

  return withDefs
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractHtmlTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1] ? stripHtmlTags(match[1]) : '';
  return title || undefined;
}

export function extractCanonicalUrl(html: string, fallbackUrl: string): string | undefined {
  const match =
    html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    ) ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i,
    );
  if (!match?.[1]) return undefined;
  try {
    return new URL(match[1], fallbackUrl).toString();
  } catch {
    return undefined;
  }
}

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) != null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
  return blocks;
}

export function enrichProviderInput(
  input: CoaProviderInput,
): CoaProviderInput & {
  title?: string;
  canonicalUrl?: string;
  visibleText?: string;
} {
  return {
    ...input,
    title: extractHtmlTitle(input.html),
    canonicalUrl: extractCanonicalUrl(input.html, input.finalUrl),
    visibleText: stripHtmlTags(input.html),
  };
}
