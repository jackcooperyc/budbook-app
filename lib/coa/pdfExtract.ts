/**
 * PDF text-layer extraction for COA scan jobs.
 * Image-only / scanned PDFs may return empty text — callers must treat that as needs_review.
 */
import { extractText, getDocumentProxy } from 'unpdf';

export const MIN_PDF_TEXT_CHARS = 40;

export type PdfTextExtractResult = {
  text: string;
  pageCount: number;
  /** True when extracted text is long enough to attempt field parsing. */
  usable: boolean;
};

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Extract plain text from PDF bytes (text layer only — no OCR).
 */
export async function extractPdfText(
  pdfBytes: Buffer | Uint8Array,
): Promise<PdfTextExtractResult> {
  const data = pdfBytes instanceof Buffer ? new Uint8Array(pdfBytes) : pdfBytes;
  const pdf = await getDocumentProxy(data);
  const pageCount = pdf.numPages;
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join('\n') : String(text ?? '');
  const normalized = normalizeWhitespace(merged);

  return {
    text: normalized,
    pageCount,
    usable: normalized.length >= MIN_PDF_TEXT_CHARS,
  };
}
