import { NextResponse } from 'next/server';
import { readServerStash, addProductToServerStash } from '@/lib/budbook-stash/fileStore';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;
  return NextResponse.json(await readServerStash());
}

export async function POST(request: Request) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    strain: string;
    thc: number;
    cbd: number;
    coaId: string;
    terpenes: string[];
    brand?: string;
    type?: 'indica' | 'sativa' | 'hybrid';
  };

  if (!body?.strain || !body?.coaId) {
    return NextResponse.json({ message: 'Invalid stash payload' }, { status: 400 });
  }

  const product = await addProductToServerStash(body);
  return NextResponse.json({ product });
}
