import path from 'path';
import os from 'os';

/**
 * Writable directory for file-backed MVP stores.
 * - Local dev: `<project>/data`
 * - Vercel / serverless: `/tmp/budbook-data` (filesystem is read-only elsewhere)
 */
export function getDataDir(): string {
  if (process.env.BUDBOOK_DATA_DIR) {
    return process.env.BUDBOOK_DATA_DIR;
  }
  if (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'budbook-data');
  }
  return path.join(process.cwd(), 'data');
}

export function dataFile(filename: string): string {
  return path.join(getDataDir(), filename);
}
