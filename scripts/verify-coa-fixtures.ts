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
  sampleInvalidInputs,
} from '../lib/coa/__fixtures__/samples';
import { isBlockedIp } from '../lib/coa/fetch';
import { validateUrl } from '../lib/coa/validate';

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

  console.log('\nAll COA fixture checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
