/** Normalize QR scan payloads into fetchable COA URLs when possible. */

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i;

export function extractUrlFromQrPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return null;
    }
  }

  const embedded = trimmed.match(URL_IN_TEXT)?.[0];
  if (embedded) {
    try {
      return new URL(embedded).toString();
    } catch {
      return null;
    }
  }

  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return null;
    }
  }

  return null;
}
