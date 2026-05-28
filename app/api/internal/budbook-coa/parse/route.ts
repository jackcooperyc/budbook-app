import { NextResponse } from 'next/server';
import { parseCoaUrl } from '@/lib/budbook-coa/parseCoaUrl';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function POST(request: Request) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const body = (await request.json()) as { url?: string };
  const url = body?.url?.trim();

  if (!url) {
    return NextResponse.json({ message: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ message: 'Invalid URL' }, { status: 400 });
  }

  const result = parseCoaUrl(url);
  return NextResponse.json(result);
}
