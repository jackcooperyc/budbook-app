"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ScanLine, X } from 'lucide-react';
import Button from '@/components/Button/Button';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import type { CaaParseResponse } from '@/types/caa';
import './ScannerPanel.css';

type InputMode = 'url' | 'text';

export default function ScannerPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CaaParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const stopQr = useCallback(() => {
    if (scanLoopRef.current != null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setQrOpen(false);
    setQrError(null);
  }, []);

  useEffect(() => () => stopQr(), [stopQr]);

  async function runParse(body: Record<string, string>) {
    setScanning(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/internal/caa/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Parse failed');
      setResult(await res.json());
    } catch {
      setError('CAA parse failed — check your input and try again.');
    } finally {
      setScanning(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'url') {
      void runParse({ url: url || 'https://lab.example.com/coa/demo' });
    } else {
      if (!text.trim()) {
        setError('Paste COA text to parse.');
        return;
      }
      void runParse({ text: text.trim() });
    }
  }

  async function startQr() {
    setQrError(null);
    if (!('BarcodeDetector' in window)) {
      setQrError('QR scanning requires Chrome or Edge. Paste the URL manually instead.');
      setQrOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setQrOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });

      const detector = new (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
        formats: ['qr_code'],
      });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          scanLoopRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && codes[0].rawValue) {
            stopQr();
            void runParse({ qr_payload: codes[0].rawValue });
            return;
          }
        } catch {
          /* continue scanning */
        }
        scanLoopRef.current = requestAnimationFrame(tick);
      };
      scanLoopRef.current = requestAnimationFrame(tick);
    } catch {
      setQrError('Camera access denied or unavailable.');
      setQrOpen(true);
    }
  }

  async function handleAddToStash() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/internal/budbook-stash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'coa', coa: result.parse }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/budbook-app/stash?added=1');
    } catch {
      setError('Could not save to stash.');
      setSaving(false);
    }
  }

  const parse = result?.parse;

  return (
    <div className="scanner-panel">
      <div className="scanner-hero glass-panel">
        <ScanLine size={36} strokeWidth={1.5} className="scanner-icon" aria-hidden="true" />
        <h2>COA Scanner</h2>
        <p>
          Ingest lab reports through the Compliance Abstraction Adapter (CAA). Paste a URL,
          COA text, or scan a QR code. Try URLs containing &quot;wedding&quot;, &quot;gmo&quot;, or
          &quot;blue&quot;.
        </p>
      </div>

      <div className="scanner-tabs">
        <button
          type="button"
          className={`scanner-tab ${mode === 'url' ? 'scanner-tab-active' : ''}`}
          onClick={() => setMode('url')}
        >
          URL
        </button>
        <button
          type="button"
          className={`scanner-tab ${mode === 'text' ? 'scanner-tab-active' : ''}`}
          onClick={() => setMode('text')}
        >
          Paste text
        </button>
      </div>

      <form className="scanner-form action-panel" onSubmit={handleSubmit}>
        {mode === 'url' ? (
          <label className="scanner-field">
            <span>Lab report URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://lab.example.com/report/wedding-cake-…"
            />
          </label>
        ) : (
          <label className="scanner-field">
            <span>COA text</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Paste lab report text, batch ID, or strain name…"
            />
          </label>
        )}
        <div className="scanner-actions">
          <Button type="submit" variant="primary" size="sm" disabled={scanning}>
            {scanning ? 'Parsing…' : 'Parse via CAA'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<QrCode size={14} />}
            onClick={startQr}
            disabled={scanning}
          >
            Scan QR
          </Button>
        </div>
      </form>

      {qrOpen && (
        <div className="scanner-qr-overlay" role="dialog" aria-label="QR scanner">
          <div className="scanner-qr-modal glass-panel">
            <button type="button" className="scanner-qr-close" onClick={stopQr} aria-label="Close">
              <X size={18} />
            </button>
            {qrError ? (
              <p className="scanner-qr-error">{qrError}</p>
            ) : (
              <video ref={videoRef} className="scanner-qr-video" muted playsInline />
            )}
            <p className="scanner-qr-hint">Point your camera at a COA QR code</p>
          </div>
        </div>
      )}

      {error && (
        <p className="scanner-error" role="alert">
          {error}
        </p>
      )}

      {parse && (
        <div className="scanner-result glass-panel">
          <div className="scanner-result-header">
            <h3>CAA extraction</h3>
            <span className={`scanner-confidence scanner-confidence-${parse.confidence}`}>
              {parse.confidence === 'high' ? 'Matched' : 'Inferred'}
            </span>
          </div>
          <p className="scanner-result-strain">{parse.strain_name}</p>
          <p className="scanner-result-brand">{parse.brand}</p>
          <p className="scanner-result-meta meta-numeric">
            THC {parse.thc_percentage}% · CBD {parse.cbd_percentage}% · {parse.lab_report_id}
          </p>
          <TerpeneProfile terpenes={parse.terpene_profile} compact />
          <p className="scanner-result-caa">
            CAA status: <strong>{parse.compliance_status}</strong>
            {' · '}
            <Link href={`/budbook-app/cannadex/${encodeURIComponent(parse.product_key)}`}>
              View in Cannadex
            </Link>
          </p>

          {result.duplicate_in_stash && (
            <p className="scanner-duplicate" role="status">
              This lab report is already in your stash
              {result.existing_product_id ? ` (${result.existing_product_id})` : ''}.
            </p>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={saving || result.duplicate_in_stash}
            onClick={handleAddToStash}
          >
            {saving ? 'Saving…' : result.duplicate_in_stash ? 'Already in stash' : 'Add to stash'}
          </Button>
        </div>
      )}
    </div>
  );
}
