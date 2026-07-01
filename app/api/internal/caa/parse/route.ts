import { NextResponse } from 'next/server';
import { parseCoaInput } from '@lib/caa/parse';
import { findStashByLabReportId } from '@lib/caa/duplicates';
import { registerCoaParse } from '@lib/caa/registry';
import { mockApiDisabledResponse } from '@/lib/mockApi';
import type { CaaParseResponse } from '@/types/caa';

export async function POST(request: Request) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    url?: string;
    text?: string;
    qr_payload?: string;
  };

  const url = body?.url?.trim();
  const text = body?.text?.trim();
  const qr = body?.qr_payload?.trim();

  let input: string;
  let source: 'url' | 'text' | 'qr';

  if (qr) {
    input = qr;
    source = 'qr';
  } else if (text) {
    input = text;
    source = 'text';
  } else if (url) {
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ message: 'Invalid URL' }, { status: 400 });
    }
    input = url;
    source = 'url';
  } else {
    return NextResponse.json({ message: 'url, text, or qr_payload is required' }, { status: 400 });
  }

  const parse = parseCoaInput(input, source);
  await registerCoaParse(parse);
  const existing = await findStashByLabReportId(parse.lab_report_id);

  const response: CaaParseResponse = {
    parse,
    duplicate_in_stash: existing != null,
    existing_product_id: existing?.product_id ?? null,
  };

  return NextResponse.json(response);
}
