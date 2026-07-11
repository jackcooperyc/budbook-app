"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ScanLine, Upload, X } from 'lucide-react';
import Button from '@/components/Button/Button';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import type { CaaParseResponse } from '@/types/caa';
import type {
  CoaScanErrorCode,
  NormalizedCoaResult,
  ScanJobStatus,
} from '@lib/coa/types';
import { COA_SCAN_MAX_ATTEMPTS } from '@lib/coa/types';
import {
  boostCameraResolution,
  CameraAccessError,
  cameraErrorMessage,
  createQrDetector,
  decodeQrFromImageFile,
  openCameraStream,
} from '@/lib/scanner/camera';
import { detectQrInVideo } from '@/lib/scanner/detect';
import CoaReviewConfirm from './CoaReviewConfirm';
import './ScannerPanel.css';

type InputMode = 'url' | 'text';

type ScanApiPayload = {
  scanId?: string;
  status?: ScanJobStatus;
  provider?: string | null;
  attemptCount?: number;
  sourceUrl?: string;
  sourceType?: string;
  normalized?: NormalizedCoaResult | null;
  error?: { code: CoaScanErrorCode; message: string } | null;
  coaReportId?: string | null;
  parse?: CaaParseResponse['parse'] | null;
  duplicate_in_stash?: boolean;
  existing_product_id?: string | null;
  coa_report_id?: string | null;
  code?: CoaScanErrorCode;
  message?: string;
};

type ReviewState = {
  scanId: string;
  status: ScanJobStatus;
  normalized: NormalizedCoaResult;
  sourceUrl: string;
  provider: string | null;
  duplicateInStash: boolean;
  existingProductId: string | null;
};

type LegacyResult = CaaParseResponse;

function looksLikeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function errorMessageFromPayload(data: ScanApiPayload, fallback: string): string {
  if (data.error?.message) {
    return data.code || data.error.code
      ? `${data.error.code ?? data.code}: ${data.error.message}`
      : data.error.message;
  }
  if (data.message) {
    return data.code ? `${data.code}: ${data.message}` : data.message;
  }
  return fallback;
}

function canRetryStatus(status: ScanJobStatus | undefined, attemptCount: number | undefined): boolean {
  if (!status) return false;
  if (status !== 'failed' && status !== 'needs_review') return false;
  return (attemptCount ?? 0) < COA_SCAN_MAX_ATTEMPTS;
}

export default function ScannerPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [legacyResult, setLegacyResult] = useState<LegacyResult | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryableScanId, setRetryableScanId] = useState<string | null>(null);
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

  const applyScanPayload = useCallback((data: ScanApiPayload, preferReview: boolean) => {
    const scanId = data.scanId;
    const status = data.status;
    const normalized = data.normalized ?? null;

    if (
      preferReview &&
      scanId &&
      normalized &&
      status &&
      (status === 'resolved' || status === 'partial' || status === 'needs_review')
    ) {
      setReview({
        scanId,
        status,
        normalized,
        sourceUrl: data.sourceUrl || normalized.source.sourceUrl,
        provider: data.provider ?? normalized.source.provider,
        duplicateInStash: Boolean(data.duplicate_in_stash),
        existingProductId: data.existing_product_id ?? null,
      });
      setLegacyResult(null);
      setRetryableScanId(
        canRetryStatus(status, data.attemptCount) && status === 'needs_review' ? scanId : null,
      );
      return;
    }

    if (data.parse) {
      setLegacyResult({
        parse: data.parse,
        duplicate_in_stash: Boolean(data.duplicate_in_stash),
        existing_product_id: data.existing_product_id ?? null,
        coa_report_id: data.coa_report_id ?? data.coaReportId ?? null,
        scan_job_id: scanId ?? null,
      });
      setReview(null);
      setRetryableScanId(null);
      return;
    }

    if (preferReview && scanId && normalized) {
      setReview({
        scanId,
        status: status ?? 'needs_review',
        normalized,
        sourceUrl: data.sourceUrl || normalized.source.sourceUrl,
        provider: data.provider ?? normalized.source.provider,
        duplicateInStash: Boolean(data.duplicate_in_stash),
        existingProductId: data.existing_product_id ?? null,
      });
      setLegacyResult(null);
      return;
    }

    throw new Error(
      errorMessageFromPayload(data, 'Could not extract lab data from that input.'),
    );
  }, []);

  const runPhase2UrlScan = useCallback(
    async (sourceType: 'manual_url' | 'qr_url', sourceUrl: string) => {
      setScanning(true);
      setLegacyResult(null);
      setReview(null);
      setError(null);
      setRetryableScanId(null);
      try {
        const res = await fetch('/api/internal/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceType, sourceUrl }),
        });
        const data = (await res.json()) as ScanApiPayload;

        if (!res.ok) {
          if (data.scanId && canRetryStatus(data.status, data.attemptCount)) {
            setRetryableScanId(data.scanId);
          } else if (data.scanId && (data.status === 'failed' || data.status === 'needs_review')) {
            setRetryableScanId(
              canRetryStatus(data.status, data.attemptCount) ? data.scanId : null,
            );
          }
          // Partial/needs_review with normalized still opens review UI.
          if (
            data.normalized &&
            data.scanId &&
            (data.status === 'partial' || data.status === 'needs_review' || data.status === 'resolved')
          ) {
            applyScanPayload(data, true);
            if (data.status === 'needs_review') {
              setError(
                errorMessageFromPayload(
                  data,
                  'Extraction needs review — correct fields below or retry.',
                ),
              );
            }
            return;
          }
          throw new Error(errorMessageFromPayload(data, 'Scan failed'));
        }

        applyScanPayload(data, true);
        if (data.scanId && canRetryStatus(data.status, data.attemptCount)) {
          setRetryableScanId(data.scanId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'COA scan failed — check your input and try again.');
      } finally {
        setScanning(false);
      }
    },
    [applyScanPayload],
  );

  const runLegacyParse = useCallback(
    async (body: Record<string, string>) => {
      setScanning(true);
      setLegacyResult(null);
      setReview(null);
      setError(null);
      setRetryableScanId(null);
      try {
        const res = await fetch('/api/internal/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as ScanApiPayload;
        if (!res.ok) {
          if (data.scanId && canRetryStatus(data.status, data.attemptCount)) {
            setRetryableScanId(data.scanId);
          }
          throw new Error(errorMessageFromPayload(data, 'Parse failed'));
        }
        // Prefer review when Phase 2 normalized payload is present.
        if (data.normalized && data.scanId) {
          applyScanPayload(data, true);
        } else {
          applyScanPayload(data, false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'CAA parse failed — check your input and try again.');
      } finally {
        setScanning(false);
      }
    },
    [applyScanPayload],
  );

  const handleQrPayload = useCallback(
    async (payload: string) => {
      const trimmed = payload.trim();
      if (looksLikeHttpUrl(trimmed)) {
        await runPhase2UrlScan('qr_url', trimmed);
        setUrl(trimmed);
        setMode('url');
        return;
      }
      await runLegacyParse({ qr_payload: trimmed });
    },
    [runLegacyParse, runPhase2UrlScan],
  );

  async function handleRetry() {
    if (!retryableScanId) return;
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/internal/scans/${encodeURIComponent(retryableScanId)}/retry`,
        { method: 'POST' },
      );
      const data = (await res.json()) as ScanApiPayload;
      if (!res.ok) {
        if (canRetryStatus(data.status, data.attemptCount)) {
          setRetryableScanId(retryableScanId);
        } else {
          setRetryableScanId(null);
        }
        if (
          data.normalized &&
          (data.status === 'partial' || data.status === 'needs_review' || data.status === 'resolved')
        ) {
          applyScanPayload({ ...data, scanId: data.scanId ?? retryableScanId }, true);
        }
        throw new Error(errorMessageFromPayload(data, 'Retry failed'));
      }
      applyScanPayload({ ...data, scanId: data.scanId ?? retryableScanId }, true);
      setRetryableScanId(
        canRetryStatus(data.status, data.attemptCount) ? (data.scanId ?? retryableScanId) : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed.');
    } finally {
      setScanning(false);
    }
  }

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
          void handleQrPayload(payload);
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
  }, [qrOpen, qrError, qrLoading, handleQrPayload, stopQr]);

  async function startQr() {
    setQrError(null);
    setQrLoading(true);
    setQrOpen(true);

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setQrError('QR scanning requires HTTPS. Paste the COA URL or use Upload QR image.');
      setQrLoading(false);
      return;
    }

    const streamPromise = openCameraStream();

    try {
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
      await handleQrPayload(payload);
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
      void runPhase2UrlScan('manual_url', url.trim());
    } else {
      if (!text.trim()) {
        setError('Paste COA text to parse.');
        return;
      }
      void runLegacyParse({ text: text.trim() });
    }
  }

  async function handleLegacyAddToStash() {
    if (!legacyResult) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/internal/budbook-stash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'coa',
          coa: legacyResult.parse,
          coa_report_id: legacyResult.coa_report_id,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.push('/budbook-app/stash?added=1');
    } catch {
      setError('Could not save to stash.');
      setSaving(false);
    }
  }

  const parse = legacyResult?.parse;

  return (
    <div className="scanner-panel">
      <div className="scanner-hero glass-panel">
        <ScanLine size={36} strokeWidth={1.5} className="scanner-icon" aria-hidden="true" />
        <h2>COA Scanner</h2>
        <p>
          Scan a package QR or paste a lab report URL for an evidence-backed preview. Correct
          uncertain fields, confirm, and save to My Stash. Paste text still uses the CAA path.
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
            {scanning ? 'Scanning…' : mode === 'url' ? 'Scan URL' : 'Parse via CAA'}
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
        <div className="scanner-error-block" role="alert">
          <p className="scanner-error">{error}</p>
          {retryableScanId && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={scanning}
              onClick={() => void handleRetry()}
            >
              {scanning ? 'Retrying…' : 'Retry scan'}
            </Button>
          )}
        </div>
      )}

      {review && (
        <CoaReviewConfirm
          scanId={review.scanId}
          status={review.status}
          normalized={review.normalized}
          sourceUrl={review.sourceUrl}
          provider={review.provider}
          duplicateInStash={review.duplicateInStash}
          existingProductId={review.existingProductId}
          onConfirmed={() => {
            router.push('/budbook-app/stash?added=1');
          }}
          onCancel={() => {
            setReview(null);
            setError(null);
            setRetryableScanId(null);
          }}
        />
      )}

      {parse && !review && (
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

          {legacyResult.duplicate_in_stash && (
            <p className="scanner-duplicate" role="status">
              This lab report is already in your stash
              {legacyResult.existing_product_id ? ` (${legacyResult.existing_product_id})` : ''}.
            </p>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={saving || legacyResult.duplicate_in_stash}
            onClick={() => void handleLegacyAddToStash()}
          >
            {saving ? 'Saving…' : legacyResult.duplicate_in_stash ? 'Already in stash' : 'Add to stash'}
          </Button>
        </div>
      )}
    </div>
  );
}
