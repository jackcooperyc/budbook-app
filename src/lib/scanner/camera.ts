/** Camera helpers for QR scanning — desktop webcams, mobile rear camera, permission UX. */

export type CameraErrorCode =
  | 'insecure'
  | 'unsupported'
  | 'denied'
  | 'not_found'
  | 'in_use'
  | 'site_blocked'
  | 'unknown';

export class CameraAccessError extends Error {
  readonly code: CameraErrorCode;

  constructor(code: CameraErrorCode, message: string) {
    super(message);
    this.name = 'CameraAccessError';
    this.code = code;
  }
}

const SITE_CAMERA_HINT =
  'In Chrome: click the lock/tune icon in the address bar → Site settings → Camera → Allow, then reload.';

const MAC_CAMERA_HINT =
  'On Mac: System Settings → Privacy & Security → Camera → enable Google Chrome, then reload.';

export function cameraErrorMessage(
  code: CameraErrorCode,
  permission?: PermissionState | 'unsupported',
): string {
  if (permission === 'denied') {
    return `Camera is blocked for this site. ${SITE_CAMERA_HINT} You can also use Upload QR image or paste the COA URL.`;
  }

  switch (code) {
    case 'insecure':
      return 'Camera requires a secure connection (HTTPS). Open Pacs.MT over https://budbook.cupr.app.';
    case 'unsupported':
      return 'This browser does not support camera access. Try Chrome or Edge, or paste the COA URL manually.';
    case 'denied':
      return `Camera permission was blocked. ${SITE_CAMERA_HINT} ${MAC_CAMERA_HINT} Or use Upload QR image / paste the COA URL.`;
    case 'not_found':
      return `No camera was found or Chrome could not open it. ${SITE_CAMERA_HINT} ${MAC_CAMERA_HINT} If you have no webcam, use Upload QR image or paste the COA URL.`;
    case 'in_use':
      return 'Your camera is in use by another app. Close other apps and try again.';
    case 'site_blocked':
      return `This page is not allowed to use the camera. ${SITE_CAMERA_HINT}`;
    default:
      return `Could not open the camera. ${SITE_CAMERA_HINT} Try Upload QR image or paste the COA URL.`;
  }
}

/** Best-effort read of browser camera permission — use only when reporting errors, not before getUserMedia. */
export async function queryCameraPermission(): Promise<PermissionState | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
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
      case 'OverconstrainedError':
        return new CameraAccessError(
          'not_found',
          videoDeviceCount > 0
            ? `A camera is connected but Chrome could not open it. ${SITE_CAMERA_HINT} ${MAC_CAMERA_HINT} Or use Upload QR image.`
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

  // Desktop: start with the loosest possible constraint. Some Mac webcams will
  // throw NotFound/Overconstrained when we ask for resolution or facingMode.
  return [
    { video: true, audio: false },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
  ];
}

async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

/**
 * Request a camera stream. Invoke synchronously from a click handler so Chrome
 * still has user activation when prompting — do not await other work first.
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
        const permission = await queryCameraPermission();
        if (permission === 'denied') {
          throw new CameraAccessError('site_blocked', cameraErrorMessage('site_blocked'));
        }
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
        const permission = await queryCameraPermission();
        if (permission === 'denied') {
          throw new CameraAccessError('site_blocked', cameraErrorMessage('site_blocked'));
        }
        throw mapDomException(err, videoInputs.length);
      }
    }
  }

  const permission = await queryCameraPermission();
  if (permission === 'denied') {
    throw new CameraAccessError('site_blocked', cameraErrorMessage('site_blocked'));
  }

  throw mapDomException(lastError, videoInputs.length);
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export type QrDetector = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

export async function createQrDetector(): Promise<QrDetector | null> {
  if (!isBarcodeDetectorSupported()) return null;

  const BarcodeDetector = (
    window as unknown as {
      BarcodeDetector: new (opts: { formats: string[] }) => QrDetector;
    }
  ).BarcodeDetector;

  return new BarcodeDetector({ formats: ['qr_code'] });
}

/** Raise webcam resolution after the stream opens (best-effort). */
export async function boostCameraResolution(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  if (!track?.applyConstraints) return;
  try {
    await track.applyConstraints({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    });
  } catch {
    /* device may not support higher resolution */
  }
}

/** Decode a QR code from a still image (screenshot or photo of a COA label). */
export async function decodeQrFromImageFile(
  file: File,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  const { detectQrInImageFile } = await import('./detect');
  const detector = await createQrDetector();
  return detectQrInImageFile(detector, file, canvas);
}
