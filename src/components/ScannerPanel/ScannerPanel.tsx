"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, ScanLine } from 'lucide-react';
import Button from '@/components/Button/Button';
import type { CoaParseResult } from '@/lib/budbook-coa/parseCoaUrl';
import { useServerStash } from '@/hooks/useServerStash';
import './ScannerPanel.css';

export default function ScannerPanel() {
  const router = useRouter();
  const { addProduct } = useServerStash();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CoaParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/internal/budbook-coa/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url || 'https://lab.example.com/coa/demo' }),
      });
      if (!res.ok) throw new Error('Could not parse COA URL');
      setResult(await res.json());
    } catch {
      setError('Parse failed — check the URL and try again.');
    } finally {
      setScanning(false);
    }
  }

  async function handleAddToStash() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      await addProduct({
        strain: result.strain,
        thc: result.thc,
        cbd: result.cbd,
        coaId: result.coaId,
        terpenes: result.terpenes,
        brand: result.brand,
        type: result.type,
      });
      router.push('/budbook-app/stash?added=1');
    } catch {
      setError('Could not save to stash.');
      setSaving(false);
    }
  }

  return (
    <div className="scanner-panel">
      <div className="scanner-hero glass-panel">
        <ScanLine size={36} strokeWidth={1.5} className="scanner-icon" aria-hidden="true" />
        <h2>COA Scanner</h2>
        <p>
          Paste a lab report URL — we extract strain, cannabinoids, and terpenes. Try a URL
          containing &quot;wedding&quot;, &quot;gmo&quot;, or &quot;blue&quot; for matched results.
        </p>
      </div>

      <form className="scanner-form action-panel" onSubmit={handleScan}>
        <label className="scanner-field">
          <span>Lab report URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://lab.example.com/report/wedding-cake-…"
          />
        </label>
        <div className="scanner-actions">
          <Button type="submit" variant="primary" size="sm" disabled={scanning}>
            {scanning ? 'Parsing…' : 'Parse COA'}
          </Button>
          <Button type="button" variant="secondary" size="sm" icon={<QrCode size={14} />}>
            Scan QR
          </Button>
        </div>
      </form>

      {error && (
        <p className="scanner-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="scanner-result glass-panel">
          <div className="scanner-result-header">
            <h3>Extracted product</h3>
            <span className={`scanner-confidence scanner-confidence-${result.confidence}`}>
              {result.confidence === 'high' ? 'URL match' : 'Demo inference'}
            </span>
          </div>
          <p className="scanner-result-strain">{result.strain}</p>
          <p className="scanner-result-brand">{result.brand}</p>
          <p className="scanner-result-meta meta-numeric">
            THC {result.thc}% · CBD {result.cbd}% · {result.coaId}
          </p>
          <p className="scanner-result-terps">Terpenes: {result.terpenes.join(', ')}</p>
          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={handleAddToStash}
          >
            {saving ? 'Saving…' : 'Add to stash'}
          </Button>
        </div>
      )}
    </div>
  );
}
