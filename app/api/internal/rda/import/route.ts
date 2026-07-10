import { NextResponse } from 'next/server';
import { importRdaCache } from '@lib/repositories/rda';
import { validateRdaImport } from '@lib/rda/validate';

function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.RDA_IMPORT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: 'RDA import is not configured (RDA_IMPORT_SECRET missing)' },
      { status: 503 },
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) return unauthorized();

  const body = (await request.json()) as unknown;
  const validation = validateRdaImport(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await importRdaCache(validation.data);
  return NextResponse.json(result);
}
