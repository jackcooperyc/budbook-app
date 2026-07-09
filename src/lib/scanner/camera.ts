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
      return 'Camera permission was blocked. Check site permissions in your browser lock icon, or paste the COA URL manually.';
    case 'not_found':
      return 'No camera was found on this device. Use paste-text or URL mode instead.';
    case 'in_use':
      return 'Your camera is in use by another app. Close other apps and try again.';
    default:
      return 'Could not open the camera. Try Chrome or Edge on desktop, or paste the COA URL manually.';
  }
}

function mapDomException(err: unknown): CameraAccessError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return new CameraAccessError('denied', cameraErrorMessage('denied'));
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return new CameraAccessError('not_found', cameraErrorMessage('not_found'));
      case 'NotReadableError':
      case 'TrackStartError':
        return new CameraAccessError('in_use', cameraErrorMessage('in_use'));
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return new CameraAccessError('unknown', cameraErrorMessage('unknown'));
      default:
        break;
    }
  }

  return new CameraAccessError('unknown', cameraErrorMessage('unknown'));
}

/**
 * Request a camera stream with desktop-safe fallbacks.
 * Mobile rear camera (`environment`) is tried first; desktop webcams typically need `user` or unconstrained video.
 */
export async function openCameraStream(): Promise<MediaStream> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new CameraAccessError('insecure', cameraErrorMessage('insecure'));
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraAccessError('unsupported', cameraErrorMessage('unsupported'));
  }

  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    { video: { facingMode: { ideal: 'user' } }, audio: false },
    { video: true, audio: false },
  ];

  let lastError: unknown;

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        throw mapDomException(err);
      }
    }
  }

  throw mapDomException(lastError);
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
