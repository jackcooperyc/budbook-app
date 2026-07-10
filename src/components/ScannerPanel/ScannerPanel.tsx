"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ScanLine, Upload, X } from 'lucide-react';
import Button from '@/components/Button/Button';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import type { CaaParseResponse } from '@/types/caa';
import {
  boostCameraResolution,
  CameraAccessError,
  cameraErrorMessage,
  createQrDetector,
  decodeQrFromImageFile,
  openCameraStream,
} from '@/lib/scanner/camera';
import { detectQrInVideo } from '@/lib/scanner/detect';
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
  const [qrDecoding, setQrDecoding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const scanBusyRef = useRef(false);
  const detectorRef = useRef<Awaited<ReturnType<typeof createQrDetector>>>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const stopQr = useCallback(() => {
    if (scanLoopRef.current != null) {
      window.clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    scanBusyRef.current = false;
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
      const res = await fetch('/api/internal/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as CaaParseResponse & { message?: string };
      if (!res.ok) {
        throw new Error(data.message ?? 'Parse failed');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CAA parse failed — check your input and try again.');
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || scanBusyRef.current) {
        scanLoopRef.current = window.setTimeout(tick, 120);
        return;
      }

      scanBusyRef.current = true;
      try {
        const payload = await detectQrInVideo(detector, video, canvas);
        if (payload) {
          stopQr();
          void runParse({ qr_payload: payload });
          return;
        }
      } catch {
        /* continue scanning */
      } finally {
        scanBusyRef.current = false;
      }
      scanLoopRef.current = window.setTimeout(tick, 180);
    };

    scanLoopRef.current = window.setTimeout(tick, 300);

    return () => {
      if (scanLoopRef.current != null) {
        window.clearTimeout(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      scanBusyRef.current = false;
    };
  }, [qrOpen, qrError, qrLoading, runParse, stopQr]);

  async function startQr() {
    setQrError(null);
    setQrLoading(true);
    setQrOpen(true);

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setQrError('QR scanning requires HTTPS. Paste the COA URL or use Upload QR image.');
      setQrLoading(false);
      return;
    }

    // Request the camera immediately while the click still has user activation.
    const streamPromise = openCameraStream();

    try {
      // BarcodeDetector is not available on iOS Safari; we still support scanning via jsQR.
      const [detector, stream] = await Promise.all([createQrDetector(), streamPromise]);
      detectorRef.current = detector;
      streamRef.current = stream;
      await boostCameraResolution(stream);
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

  async function handleQrImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setQrDecoding(true);
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      const payload = await decodeQrFromImageFile(file, canvas);
      if (!payload) {
        setError(
          'No QR code found in that image. Fill the frame with the code, use good lighting, or paste the COA URL.',
        );
        return;
      }
      stopQr();
      await runParse({ qr_payload: payload });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not read QR code from image. Try a PNG/JPEG screenshot or paste the COA URL.',
      );
    } finally {
      setQrDecoding(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'url') {
      if (!url.trim()) {
        setError('Paste a lab report URL to parse.');
        return;
      }
      void runParse({ url: url.trim() });
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
        body: JSON.stringify({ kind: 'coa', coa: result.parse, coa_report_id: result.coa_report_id }),
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
          COA text, or scan a QR code. On desktop without a webcam, use Upload QR image.
        </p>
      </div>

      <input
        ref={qrFileRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="scanner-qr-file-input"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleQrImageUpload(e)}
      />
      <canvas ref={canvasRef} className="scanner-qr-canvas" aria-hidden="true" />

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
          <Button type="submit" variant="primary" size="sm" disabled={scanning || qrDecoding}>
            {scanning ? 'Parsing…' : 'Parse via CAA'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<QrCode size={14} />}
            onClick={() => void startQr()}
            disabled={scanning || qrDecoding}
          >
            Scan QR
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => qrFileRef.current?.click()}
            disabled={scanning || qrDecoding}
          >
            {qrDecoding ? 'Reading QR…' : 'Upload QR image'}
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
                <div className="scanner-qr-error-actions">
                  <Button type="button" variant="secondary" size="sm" onClick={() => void startQr()}>
                    Try again
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Upload size={14} />}
                    onClick={() => qrFileRef.current?.click()}
                  >
                    Upload QR image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="scanner-qr-viewfinder">
                <video ref={videoRef} className="scanner-qr-video" muted playsInline autoPlay />
                <div className="scanner-qr-reticle" aria-hidden="true" />
              </div>
            )}
            {!qrError && !qrLoading && (
              <p className="scanner-qr-hint">
                Fill the frame with the QR code — hold steady 6–12 inches away. Screen glare? Use
                Upload QR image.
              </p>
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
            <span className="scanner-confidence scanner-confidence-high">Lab verified</span>
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
