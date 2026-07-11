import { NextResponse } from 'next/server';
import type { CoaScanErrorCode } from '@lib/coa/types';

export function apiError(
  code: CoaScanErrorCode,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

export function statusForCode(code: CoaScanErrorCode): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'NOT_FOUND':
      return 404;
    case 'RETRY_NOT_ALLOWED':
    case 'RETRY_LIMIT_EXCEEDED':
    case 'CONFIRM_NOT_ALLOWED':
      return 409;
    case 'INVALID_URL':
    case 'INVALID_INPUT':
    case 'BLOCKED_URL':
      return 400;
    case 'FETCH_TIMEOUT':
    case 'FETCH_FAILED':
    case 'UNSUPPORTED_CONTENT':
    case 'PDF_NOT_SUPPORTED_YET':
    case 'PARSE_INSUFFICIENT_DATA':
      return 422;
    default:
      return 500;
  }
}
