import { readFileSync } from 'fs';
import { join } from 'path';
import type { CaaCoaParseResult } from '@/types/caa';
import type { ScanInput } from '@lib/coa/types';
import { hashContent } from '@lib/coa/hash';
import { normalizedFromCaaParse } from '@lib/coa/normalize';
import { parseGenericCoaHtml } from '@lib/coa/providers/genericHtml';
import { looksLikeFidelitySource, fidelityProvider } from '@lib/coa/providers/fidelity';
import { selectProvider } from '@lib/coa/providers';
import { validateScanInput, validateUrl } from '@lib/coa/validate';

const FIXTURE_DIR = join(process.cwd(), 'lib/coa/__fixtures__');

export function loadFixtureHtml(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

export const genericCoaHtml = () => loadFixtureHtml('generic-coa.html');
export const fidelityCoaHtml = () => loadFixtureHtml('fidelity-coa.html');
export const insufficientHtml = () => loadFixtureHtml('insufficient.html');

/** Sample CAA parse result for manual verification of the CAA bridge. */
export const sampleCaaParse: CaaCoaParseResult = {
  lab_report_id: 'lab-report-sample-001',
  product_key: 'brand:acme|strain:blue-dream|type:hybrid',
  strain_name: 'Blue Dream',
  brand: 'Acme Farms',
  type: 'hybrid',
  category: 'flower',
  thc_percentage: 22.4,
  cbd_percentage: 0.8,
  terpene_profile: [
    { terpene_name: 'Myrcene', percentage: 0.42 },
    { terpene_name: 'Pinene', percentage: 0.18 },
  ],
  compliance_status: 'confirmed',
  confidence: 'high',
  parse_source: 'url',
};

export const sampleScanInputs: ScanInput[] = [
  { kind: 'manual_url', url: 'https://lims.example.com/reports/abc123' },
  { kind: 'qr_url', url: 'https://share.confidentlims.com/samples/public/00000000-0000-0000-0000-000000000001' },
  { kind: 'text', text: 'Sample COA document with batch BATCH-001 and full lab results.' },
];

export const sampleInvalidInputs = {
  potencyFragment: 'THC: 24.5%',
  javascriptUrl: 'javascript:alert(1)',
  credentialUrl: 'https://user:pass@lab.example.com/coa',
  emptyUrl: '',
};

/** Expected normalized bridge output from sampleCaaParse. */
export const sampleNormalizedFromCaa = normalizedFromCaaParse(
  sampleCaaParse,
  'https://lims.example.com/reports/abc123',
);

/**
 * Parse fixture HTML without network I/O.
 */
export function parseFixtureGeneric() {
  const html = genericCoaHtml();
  return parseGenericCoaHtml(html, 'https://lab.example.com/reports/coa-blue-dream-001', {
    contentHash: hashContent(html),
  });
}

export function parseFixtureFidelity() {
  const html = fidelityCoaHtml();
  const input = {
    sourceUrl: 'https://reports.fidelity.labs/coa/8891',
    finalUrl: 'https://reports.fidelity.labs/coa/8891',
    html,
    contentType: 'text/html',
    contentHash: hashContent(html),
  };
  return {
    detected: looksLikeFidelitySource(input),
    providerId: selectProvider(input).id,
    parse: fidelityProvider.parse(input),
  };
}

export function parseFixtureInsufficient() {
  const html = insufficientHtml();
  return parseGenericCoaHtml(html, 'https://shop.example.com/about', {
    contentHash: hashContent(html),
  });
}

/**
 * Manual verification (no test runner in repo):
 *
 *   npx tsx scripts/verify-coa-fixtures.ts
 *
 * Or import helpers:
 *
 * ```ts
 * import { validateUrl } from '@lib/coa/validate';
 * import { parseFixtureGeneric } from '@lib/coa/__fixtures__/samples';
 *
 * validateUrl('https://user:pass@evil.test/x'); // BLOCKED_URL
 * const result = parseFixtureGeneric();
 * // result.product.name.value === 'Blue Dream'
 * // result.cannabinoids includes Total THC 22.4%
 * ```
 */

export { validateScanInput, validateUrl };
