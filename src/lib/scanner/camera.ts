export type CameraErrorCode =
  | 'insecure'
  | 'unsupported'
  | 'denied'
  | 'not_found'
  | 'in_use'
  | 'unknown';

export class CameraAccessError extends Error {
  readonly code: CameraErrorCode;

  constructor(code: CameraErrorCode, message: string) {
    super(message);
    this.name = 'CameraAccessError';
    this.code = code;
  }
}

export function cameraErrorMessage(code: CameraErrorCode): string {
  switch (code) {
    case 'insecure':
      return 'Camera requires a secure connection (HTTPS). Open BudBook over https://budbook.cupr.app.';
    case 'unsupported':
      return 'This browser does not support camera access. Try Chrome or Edge, or paste the COA URL manually.';
    case 'denied':
      return 'Camera permission was blocked. Click the lock icon in the address bar → Camera → Allow. On Mac, also check System Settings → Privacy & Security → Camera → Google Chrome.';
    case 'not_found':
      return 'Chrome cannot access a camera on this device. On Mac: System Settings → Privacy & Security → Camera → enable Google Chrome, then reload. If you have no webcam, use Upload QR image or paste the COA URL.';
    case 'in_use':
      return 'Your camera is in use by another app. Close other apps and try again.';
    default:
      return 'Could not open the camera. Try Upload QR image, or paste the COA URL manually.';
  }
}

function isLikelyMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia('(max-width: 768px)').matches)
  );
}

function mapDomException(err: unknown, videoDeviceCount: number): CameraAccessError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return new CameraAccessError('denied', cameraErrorMessage('denied'));
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return new CameraAccessError(
          'not_found',
          videoDeviceCount > 0
            ? 'A camera is connected but Chrome could not open it. Check site and system camera permissions, then try again or use Upload QR image.'
            : cameraErrorMessage('not_found'),
        );
      case 'NotReadableError':
      case 'TrackStartError':
        return new CameraAccessError('in_use', cameraErrorMessage('in_use'));
      default:
        break;
    }
  }

  return new CameraAccessError('unknown', cameraErrorMessage('unknown'));
}

function constraintAttempts(): MediaStreamConstraints[] {
  if (isLikelyMobile()) {
    return [
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: { facingMode: { ideal: 'user' } }, audio: false },
      { video: true, audio: false },
    ];
  }

  return [
    { video: { facingMode: { ideal: 'user' } }, audio: false },
    { video: true, audio: false },
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
  ];
}

async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

/**
 * Request a camera stream with desktop-safe fallbacks and per-device retries.
 */
export async function openCameraStream(): Promise<MediaStream> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new CameraAccessError('insecure', cameraErrorMessage('insecure'));
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraAccessError('unsupported', cameraErrorMessage('unsupported'));
  }

  let lastError: unknown;

  for (const constraints of constraintAttempts()) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw mapDomException(err, 0);
      }
    }
  }

  const videoInputs = await listVideoInputs();

  for (const device of videoInputs) {
    if (!device.deviceId) continue;
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: device.deviceId } },
        audio: false,
      });
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw mapDomException(err, videoInputs.length);
      }
    }
  }

  throw mapDomException(lastError, videoInputs.length);
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export async function createQrDetector() {
  if (!isBarcodeDetectorSupported()) return null;

  const BarcodeDetector = (
    window as unknown as {
      BarcodeDetector: new (opts: { formats: string[] }) => {
        detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
      };
    }
  ).BarcodeDetector;

  return new BarcodeDetector({ formats: ['qr_code'] });
}

/** Decode a QR code from a still image (screenshot or photo of a COA label). */
export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  const detector = await createQrDetector();
  if (!detector) return null;

  const bitmap = await createImageBitmap(file);
  try {
    const codes = await detector.detect(bitmap);
    return codes[0]?.rawValue ?? null;
  } finally {
    bitmap.close();
  }
}
