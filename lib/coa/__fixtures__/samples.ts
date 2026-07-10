import type { CaaCoaParseResult } from '@/types/caa';
import type { ScanInput } from '@lib/coa/types';
import { normalizedFromCaaParse } from '@lib/coa/normalize';
import { validateScanInput, validateUrl } from '@lib/coa/validate';

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
  { kind: 'qr_url', url: 'https://client.confidentcannabis.com/sample/report' },
  { kind: 'text', text: 'Sample COA document with batch BATCH-001 and full lab results.' },
];

export const sampleInvalidInputs = {
  potencyFragment: 'THC: 24.5%',
  javascriptUrl: 'javascript:alert(1)',
  emptyUrl: '',
};

/** Expected normalized bridge output from sampleCaaParse. */
export const sampleNormalizedFromCaa = normalizedFromCaaParse(
  sampleCaaParse,
  'https://lims.example.com/reports/abc123',
);

/**
 * Manual verification (no test runner in repo):
 *
 * ```ts
 * import { validateScanInput } from '@lib/coa/validate';
 * import { resolveCoaScan } from '@lib/coa/resolve';
 * import { sampleScanInputs, sampleInvalidInputs } from '@lib/coa/__fixtures__/samples';
 *
 * validateScanInput(sampleScanInputs[0]); // ok: true
 * validateScanInput({ kind: 'manual_url', url: sampleInvalidInputs.potencyFragment }); // INVALID_INPUT
 * await resolveCoaScan(sampleScanInputs[0]); // throws RESOLVE_NOT_IMPLEMENTED
 * ```
 */
