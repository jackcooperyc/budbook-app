"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  correctionsFromNormalized,
  fieldConfidenceLabel,
  type CoaFieldCorrections,
} from '@lib/coa/confirm';
import type {
  ConfidenceLevel,
  FieldSource,
  NormalizedCoaResult,
  ScanJobStatus,
} from '@lib/coa/types';
import Button from '@/components/Button/Button';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';

type CoaReviewConfirmProps = {
  scanId: string;
  status: ScanJobStatus;
  normalized: NormalizedCoaResult;
  sourceUrl: string;
  provider: string | null;
  duplicateInStash?: boolean;
  existingProductId?: string | null;
  onConfirmed: (productId: string) => void;
  onCancel?: () => void;
};

function confidenceClass(level: ConfidenceLevel): string {
  if (level === 'high') return 'scanner-confidence-high';
  if (level === 'medium') return 'scanner-confidence-medium';
  return 'scanner-confidence-low';
}

function FieldBadge({
  field,
}: {
  field: { source: FieldSource; confidence: ConfidenceLevel } | undefined;
}) {
  const info = fieldConfidenceLabel(field);
  return (
    <span className={`scanner-confidence ${confidenceClass(info.level)}`}>
      {info.label}
    </span>
  );
}

function extractionBanner(status: ScanJobStatus, confidence: ConfidenceLevel): {
  text: string;
  className: string;
} {
  if (status === 'needs_review' || confidence === 'low') {
    return {
      text: 'Needs review — some fields are missing or low confidence. Correct before saving.',
      className: 'scanner-review-banner scanner-review-banner-warn',
    };
  }
  if (status === 'partial' || confidence === 'medium') {
    return {
      text: 'Partial extraction — verify uncertain fields. Low-confidence values are not lab-verified.',
      className: 'scanner-review-banner scanner-review-banner-warn',
    };
  }
  return {
    text: 'Evidence-backed preview — confirm or correct fields, then save to My Stash.',
    className: 'scanner-review-banner',
  };
}

export default function CoaReviewConfirm({
  scanId,
  status,
  normalized,
  sourceUrl,
  provider,
  duplicateInStash,
  existingProductId,
  onConfirmed,
  onCancel,
}: CoaReviewConfirmProps) {
  const initial = useMemo(() => correctionsFromNormalized(normalized), [normalized]);
  const [draft, setDraft] = useState({
    name: initial.name,
    brand: initial.brand,
    category: initial.category,
    strain: initial.strain,
    batchNumber: initial.batchNumber,
    lotNumber: initial.lotNumber,
    labName: initial.labName,
    reportNumber: initial.reportNumber,
    thc: initial.thc != null ? String(initial.thc) : '',
    cbd: initial.cbd != null ? String(initial.cbd) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banner = extractionBanner(status, normalized.extraction.confidence);
  const terpenes = normalized.terpenes.map((t) => ({
    terpene_name: t.name,
    percentage: t.value ?? 0,
  }));

  function setField<K extends keyof typeof draft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.strain.trim() && !draft.name.trim()) {
      setError('Enter a product or strain name before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    const corrections: CoaFieldCorrections = {
      name: draft.name,
      brand: draft.brand,
      category: draft.category,
      strain: draft.strain || draft.name,
      batchNumber: draft.batchNumber,
      lotNumber: draft.lotNumber,
      labName: draft.labName,
      reportNumber: draft.reportNumber,
    };
    if (draft.thc.trim() !== '') {
      const thc = Number(draft.thc);
      if (Number.isFinite(thc)) corrections.thc = thc;
    }
    if (draft.cbd.trim() !== '') {
      const cbd = Number(draft.cbd);
      if (Number.isFinite(cbd)) corrections.cbd = cbd;
    }

    try {
      const res = await fetch(`/api/internal/scans/${encodeURIComponent(scanId)}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrections }),
      });
      const data = (await res.json()) as {
        code?: string;
        message?: string;
        product?: { id: string };
      };
      if (!res.ok) {
        throw new Error(data.message ?? data.code ?? 'Confirm failed');
      }
      if (!data.product?.id) {
        throw new Error('Save succeeded but no product was returned.');
      }
      onConfirmed(data.product.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save to stash.');
      setSaving(false);
    }
  }

  return (
    <form className="scanner-result glass-panel scanner-review" onSubmit={(e) => void handleConfirm(e)}>
      <div className="scanner-result-header">
        <h3>Review &amp; confirm</h3>
        <span
          className={`scanner-confidence ${confidenceClass(normalized.extraction.confidence)}`}
        >
          {status === 'resolved' && normalized.extraction.confidence === 'high'
            ? 'Evidence ready'
            : status.replace(/_/g, ' ')}
        </span>
      </div>

      <p className={banner.className}>{banner.text}</p>

      <p className="scanner-result-meta meta-numeric">
        Source: {provider ?? normalized.source.provider}
        {' · '}
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Open report
        </a>
      </p>

      {duplicateInStash && (
        <p className="scanner-duplicate" role="status">
          This lab report may already be in your stash
          {existingProductId ? ` (${existingProductId})` : ''}. Saving again will reuse the
          existing product when the report number matches.
        </p>
      )}

      <div className="scanner-review-grid">
        <label className="scanner-field">
          <span className="scanner-field-label">
            Product / strain <FieldBadge field={normalized.product.strain ?? normalized.product.name} />
          </span>
          <input
            type="text"
            value={draft.strain || draft.name}
            onChange={(e) => {
              setField('strain', e.target.value);
              setField('name', e.target.value);
            }}
            placeholder="Required"
            required
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            Brand <FieldBadge field={normalized.product.brand} />
          </span>
          <input
            type="text"
            value={draft.brand}
            onChange={(e) => setField('brand', e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            Category <FieldBadge field={normalized.product.category} />
          </span>
          <input
            type="text"
            value={draft.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder="flower, edible…"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            Lab <FieldBadge field={normalized.lab.name} />
          </span>
          <input
            type="text"
            value={draft.labName}
            onChange={(e) => setField('labName', e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            Batch / lot{' '}
            <FieldBadge field={normalized.product.batchNumber ?? normalized.product.lotNumber} />
          </span>
          <input
            type="text"
            value={draft.batchNumber || draft.lotNumber}
            onChange={(e) => {
              setField('batchNumber', e.target.value);
              setField('lotNumber', e.target.value);
            }}
            placeholder="Optional"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            Report # <FieldBadge field={normalized.lab.reportNumber} />
          </span>
          <input
            type="text"
            value={draft.reportNumber}
            onChange={(e) => setField('reportNumber', e.target.value)}
            placeholder="Used for stash dedup"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            THC %{' '}
            <FieldBadge
              field={normalized.cannabinoids.find((c) => c.name === 'THC' || c.name === 'Total THC')}
            />
          </span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={draft.thc}
            onChange={(e) => setField('thc', e.target.value)}
            placeholder="—"
          />
        </label>

        <label className="scanner-field">
          <span className="scanner-field-label">
            CBD %{' '}
            <FieldBadge
              field={normalized.cannabinoids.find((c) => c.name === 'CBD' || c.name === 'Total CBD')}
            />
          </span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={draft.cbd}
            onChange={(e) => setField('cbd', e.target.value)}
            placeholder="—"
          />
        </label>
      </div>

      {terpenes.length > 0 && <TerpeneProfile terpenes={terpenes} compact />}

      {normalized.warnings.length > 0 && (
        <ul className="scanner-review-warnings">
          {normalized.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {error && (
        <p className="scanner-error" role="alert">
          {error}
        </p>
      )}

      <div className="scanner-actions">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Confirm & save to stash'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={onCancel}>
            Discard
          </Button>
        )}
        <Link className="scanner-review-stash-link" href="/budbook-app/stash">
          My Stash
        </Link>
      </div>
    </form>
  );
}
