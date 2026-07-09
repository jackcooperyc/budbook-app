"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ScanLine, X } from 'lucide-react';
import Button from '@/components/Button/Button';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import type { CaaParseResponse } from '@/types/caa';
import {
  CameraAccessError,
  cameraErrorMessage,
  createQrDetector,
  isBarcodeDetectorSupported,
  openCameraStream,
} from '@/lib/scanner/camera';
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
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const detectorRef = useRef<Awaited<ReturnType<typeof createQrDetector>>>(null);

  const stopQr = useCallback(() => {
    if (scanLoopRef.current != null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setQrOpen(false);
    setQrLoading(false);
    setQrError(null);
  }, []);

  const runParse = useCallback(async (body: Record<string, string>) => {
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
  }, []);

  useEffect(() => () => stopQr(), [stopQr]);

  useEffect(() => {
    if (!qrOpen || qrError || qrLoading) return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    void video.play().catch(() => {
      setQrError('Could not start the camera preview. Try again or paste the URL manually.');
    });

    const detector = detectorRef.current;
    if (!detector) return;

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

    return () => {
      if (scanLoopRef.current != null) {
        cancelAnimationFrame(scanLoopRef.current);
        scanLoopRef.current = null;
      }
    };
  }, [qrOpen, qrError, qrLoading, runParse, stopQr]);

  async function startQr() {
    setQrError(null);
    setQrLoading(true);
    setQrOpen(true);

    if (!isBarcodeDetectorSupported()) {
      setQrError(
        'QR scanning requires Chrome or Edge (BarcodeDetector API). Paste the COA URL or text instead.',
      );
      setQrLoading(false);
      return;
    }

    try {
      const detector = await createQrDetector();
      if (!detector) {
        setQrError('QR scanning is not supported in this browser.');
        setQrLoading(false);
        return;
      }
      detectorRef.current = detector;

      const stream = await openCameraStream();
      streamRef.current = stream;
      setQrLoading(false);
    } catch (err) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      detectorRef.current = null;

      if (err instanceof CameraAccessError) {
        setQrError(err.message);
      } else {
        setQrError(cameraErrorMessage('unknown'));
      }
      setQrLoading(false);
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
          COA text, or scan a QR code. Desktop QR scan works in Chrome or Edge with a webcam.
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
            onClick={() => void startQr()}
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
            {qrLoading ? (
              <p className="scanner-qr-loading">Requesting camera access…</p>
            ) : qrError ? (
              <div className="scanner-qr-error-block">
                <p className="scanner-qr-error">{qrError}</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => void startQr()}>
                  Try again
                </Button>
              </div>
            ) : (
              <video ref={videoRef} className="scanner-qr-video" muted playsInline autoPlay />
            )}
            {!qrError && !qrLoading && (
              <p className="scanner-qr-hint">Point your camera at a COA QR code</p>
            )}
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
