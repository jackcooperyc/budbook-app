/**
 * Fixture-based COA parse verification (no external network).
 *
 *   npx tsx scripts/verify-coa-fixtures.ts
 */
import assert from 'node:assert/strict';
import {
  parseFixtureFidelity,
  parseFixtureGeneric,
  parseFixtureInsufficient,
  parseFixturePdf,
  sampleInvalidInputs,
  sampleMetrcPackage,
} from '../lib/coa/__fixtures__/samples';
import { isBlockedIp } from '../lib/coa/fetch';
import { validateUrl } from '../lib/coa/validate';
import { metrcPackageToCaaParse, isMetrcUrl } from '../lib/caa/adapters/metrc';

async function main() {
  const generic = parseFixtureGeneric();
  assert.equal(generic.product.name?.value, 'Blue Dream');
  assert.equal(generic.product.brand?.value, 'Acme Farms');
  assert.equal(generic.product.batchNumber?.value, 'BATCH-2026-001');
  assert.equal(generic.lab.name?.value, 'Mountain Peak Analytics');
  assert.equal(generic.lab.reportNumber?.value, 'MPA-COA-99102');
  assert.ok(generic.cannabinoids.some((c) => c.name === 'Total THC' && c.value === 22.4));
  assert.ok(generic.terpenes.some((t) => t.name === 'Myrcene' && t.value === 0.42));
  assert.equal(generic.safety.overallStatus?.value, 'pass');
  assert.equal(generic.extraction.status, 'resolved');
  console.log('✓ generic COA fixture parsed');

  const fidelity = parseFixtureFidelity();
  assert.equal(fidelity.detected, true);
  assert.equal(fidelity.providerId, 'fidelity');
  const fidelityParsed = await fidelity.parse;
  assert.equal(fidelityParsed.source.provider, 'fidelity');
  assert.equal(fidelityParsed.product.name?.value, 'Sunset Sherbet');
  assert.ok(
    fidelityParsed.warnings.some((w) => /Fidelity-specific parser not implemented/i.test(w)),
  );
  console.log('✓ fidelity fixture detected + generic fallback');

  const insufficient = parseFixtureInsufficient();
  assert.equal(insufficient.extraction.status, 'needs_review');
  assert.equal(insufficient.cannabinoids.length, 0);
  console.log('✓ insufficient HTML marked needs_review');

  const pdf = await parseFixturePdf();
  assert.equal(pdf.extracted.usable, true);
  assert.match(pdf.extracted.text, /Blue Dream/i);
  assert.equal(pdf.normalized.source.provider, 'pdf_text');
  assert.equal(pdf.normalized.extraction.status, 'partial');
  assert.ok(pdf.normalized.warnings.includes('PDF_TEXT_EXTRACTED'));
  assert.ok(
    pdf.normalized.cannabinoids.some(
      (c) => (c.name === 'THC' || c.name === 'Total THC') && c.source === 'label_ocr',
    ),
  );
  assert.notEqual(pdf.normalized.product.strain?.confidence, 'high');
  console.log('✓ PDF text-layer fixture extracted with label_ocr provenance');

  const blockedCreds = validateUrl(sampleInvalidInputs.credentialUrl);
  assert.equal(blockedCreds.ok, false);
  if (!blockedCreds.ok) assert.equal(blockedCreds.errorCode, 'BLOCKED_URL');
  console.log('✓ credential URLs blocked');

  const potency = validateUrl(sampleInvalidInputs.potencyFragment);
  assert.equal(potency.ok, false);
  console.log('✓ potency fragments rejected');

  assert.equal(isBlockedIp('127.0.0.1'), true);
  assert.equal(isBlockedIp('10.0.0.5'), true);
  assert.equal(isBlockedIp('192.168.1.1'), true);
  assert.equal(isBlockedIp('169.254.1.1'), true);
  assert.equal(isBlockedIp('8.8.8.8'), false);
  console.log('✓ SSRF IP checks');

  assert.equal(isMetrcUrl('https://mt.metrc.com/industry/packages/ABC123'), true);
  assert.equal(isMetrcUrl('https://lab.example.com/coa'), false);
  const metrcParse = metrcPackageToCaaParse(sampleMetrcPackage, 'url');
  assert.equal(metrcParse.strain_name, 'Wedding Cake');
  assert.ok(metrcParse.thc_percentage > 0);
  console.log('✓ Metrc fixture maps to CAA parse');

  console.log('\nAll COA fixture checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
