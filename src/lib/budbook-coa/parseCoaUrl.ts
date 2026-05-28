export type CoaParseResult = {
  strain: string;
  thc: number;
  cbd: number;
  coaId: string;
  terpenes: string[];
  brand: string;
  type: 'indica' | 'sativa' | 'hybrid';
  confidence: 'high' | 'demo';
};

const STRAIN_HINTS: Record<string, Partial<CoaParseResult>> = {
  wedding: {
    strain: 'Wedding Cake',
    thc: 26.4,
    cbd: 0.1,
    terpenes: ['Limonene', 'Caryophyllene', 'Myrcene'],
    type: 'hybrid',
    brand: 'Archive Portland',
  },
  gmo: {
    strain: 'GMO Cookies',
    thc: 29.8,
    cbd: 0.08,
    terpenes: ['Caryophyllene', 'Limonene', 'Myrcene'],
    type: 'indica',
    brand: 'Archive Portland',
  },
  blue: {
    strain: 'Blue Dream',
    thc: 22.4,
    cbd: 0.16,
    terpenes: ['Myrcene', 'Pinene', 'Caryophyllene'],
    type: 'hybrid',
    brand: 'Pacific Crest Cannabis',
  },
  charlotte: {
    strain: "Charlotte's Web — Everyday Plus",
    thc: 0.35,
    cbd: 16.2,
    terpenes: ['Bisabolol', 'Humulene', 'Linalool'],
    type: 'hybrid',
    brand: "Charlotte's Web",
  },
};

function coaIdFromUrl(url: string): string {
  const slug = url.replace(/[^a-z0-9]/gi, '').slice(-12).toUpperCase() || 'SCAN';
  return `COA-2026-OR-${slug}`;
}

export function parseCoaUrl(url: string): CoaParseResult {
  const normalized = url.trim().toLowerCase();

  for (const [hint, data] of Object.entries(STRAIN_HINTS)) {
    if (normalized.includes(hint)) {
      return {
        strain: data.strain!,
        thc: data.thc!,
        cbd: data.cbd!,
        terpenes: data.terpenes!,
        type: data.type!,
        brand: data.brand!,
        coaId: coaIdFromUrl(url),
        confidence: 'high',
      };
    }
  }

  const hash = normalized.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const variants = Object.values(STRAIN_HINTS);
  const pick = variants[hash % variants.length];

  return {
    strain: pick.strain!,
    thc: pick.thc!,
    cbd: pick.cbd!,
    terpenes: pick.terpenes!,
    type: pick.type!,
    brand: pick.brand!,
    coaId: coaIdFromUrl(url),
    confidence: 'demo',
  };
}
