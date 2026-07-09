import jsQR from 'jsqr';

export type QrDetector = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
};

const DECODE_SCALES = [1, 1.5, 2, 2.5, 0.75, 0.5, 3];
const MAX_DECODE_DIM = 2000;

/** iPhone photos are often HEIC/JPEG with a mismatched file extension — sniff magic bytes. */
export function sniffImageMime(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp';
  }
  const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (ftyp === 'ftyp') {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('mif1')) {
      return 'image/heic';
    }
  }
  return null;
}

export async function fileToImageBlob(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const sniffed = sniffImageMime(buffer);
  if (sniffed === 'image/heic') {
    throw new Error(
      'HEIC photos cannot be read in the browser. On iPhone: Share → Save as JPEG, or take a screenshot of the QR code.',
    );
  }
  const type = sniffed ?? (file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg');
  if (sniffed && file.type && file.type !== sniffed) {
    return new Blob([buffer], { type: sniffed });
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return new Blob([buffer], { type });
  }
  return file;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image — try exporting as JPEG or PNG.'));
    };
    image.src = objectUrl;
  });
}

async function loadImageSource(file: File): Promise<HTMLImageElement | ImageBitmap> {
  const blob = await fileToImageBlob(file);
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    return loadImageFromBlob(blob);
  }
}

function sourceDimensions(source: ImageBitmap | HTMLImageElement): { width: number; height: number } | null {
  const width = source.width;
  const height = source.height;
  if (!width || !height) return null;
  return { width, height };
}

async function detectWithBarcodeApi(
  detector: QrDetector,
  source: ImageBitmapSource,
): Promise<string | null> {
  try {
    const codes = await detector.detect(source);
    const value = codes[0]?.rawValue?.trim();
    return value || null;
  } catch {
    return null;
  }
}

function jsQrFromImageData(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  const value = result?.data?.trim();
  return value || null;
}

function jsQrWithEnhancements(ctx: CanvasRenderingContext2D, width: number, height: number): string | null {
  const base = ctx.getImageData(0, 0, width, height);
  const direct = jsQrFromImageData(base);
  if (direct) return direct;

  const gray = toGrayscaleContrast(base, 1.8);
  const fromGray = jsQrFromImageData(gray);
  if (fromGray) return fromGray;

  const sharp = toGrayscaleContrast(base, 2.4);
  return jsQrFromImageData(sharp);
}

function toGrayscaleContrast(imageData: ImageData, contrast: number): ImageData {
  const { data, width, height } = imageData;
  const out = new ImageData(width, height);
  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
    gray = Math.max(0, Math.min(255, gray));
    const v = gray > 140 ? 255 : gray < 115 ? 0 : gray;
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }
  return out;
}

type CropRegion = { x: number; y: number; w: number; h: number };

function cropRegions(width: number, height: number): CropRegion[] {
  return [
    { x: 0, y: 0, w: width, h: height },
    { x: Math.floor(width * 0.4), y: Math.floor(height * 0.1), w: Math.floor(width * 0.58), h: Math.floor(height * 0.8) },
    { x: Math.floor(width * 0.5), y: Math.floor(height * 0.15), w: Math.floor(width * 0.48), h: Math.floor(height * 0.7) },
    { x: Math.floor(width * 0.3), y: Math.floor(height * 0.1), w: Math.floor(width * 0.65), h: Math.floor(height * 0.85) },
    { x: Math.floor(width * 0.05), y: Math.floor(height * 0.2), w: Math.floor(width * 0.9), h: Math.floor(height * 0.6) },
  ];
}

function drawCrop(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  region: CropRegion,
  scale: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const sw = region.w / sourceWidth;
  const sh = region.h / sourceHeight;
  const sx = region.x / sourceWidth;
  const sy = region.y / sourceHeight;
  const cw = Math.max(1, Math.round(region.w * scale));
  const ch = Math.max(1, Math.round(region.h * scale));
  canvas.width = cw;
  canvas.height = ch;
  ctx.imageSmoothingEnabled = scale >= 1;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, cw, ch);
  return ctx;
}

async function tryDecodeCanvas(
  detector: QrDetector | null,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    const fromJs = jsQrWithEnhancements(ctx, canvas.width, canvas.height);
    if (fromJs) return fromJs;
  }

  if (!detector) return null;

  try {
    const bitmap = await createImageBitmap(canvas);
    try {
      return await detectWithBarcodeApi(detector, bitmap);
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

async function decodeRegion(
  detector: QrDetector | null,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  region: CropRegion,
): Promise<string | null> {
  const maxDim = Math.max(region.w, region.h);
  const scales =
    maxDim < 900
      ? DECODE_SCALES
      : DECODE_SCALES.filter((s) => s <= 2);

  for (const scale of scales) {
    const boundedScale = Math.min(scale, MAX_DECODE_DIM / Math.max(region.w, region.h));
    const ctx = drawCrop(source, sourceWidth, sourceHeight, canvas, region, boundedScale);
    if (!ctx) continue;
    const value = await tryDecodeCanvas(detector, canvas);
    if (value) return value;
  }
  return null;
}

async function decodeFromSource(
  detector: QrDetector | null,
  source: CanvasImageSource,
  width: number,
  height: number,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  for (const region of cropRegions(width, height)) {
    const value = await decodeRegion(detector, source, width, height, canvas, region);
    if (value) return value;
  }
  return null;
}

/** Decode QR from a live camera frame. */
export async function detectQrInVideo(
  detector: QrDetector | null,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  if (video.readyState < 2) return null;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  return decodeFromSource(detector, video, width, height, canvas);
}

/** Decode QR from a still image file (photos of physical COA labels). */
export async function detectQrInImageFile(
  detector: QrDetector | null,
  file: File,
  canvas: HTMLCanvasElement,
): Promise<string | null> {
  const source = await loadImageSource(file);
  try {
    const dims = sourceDimensions(source);
    if (!dims) return null;
    return await decodeFromSource(detector, source as CanvasImageSource, dims.width, dims.height, canvas);
  } finally {
    if ('close' in source && typeof source.close === 'function') {
      source.close();
    }
  }
}
