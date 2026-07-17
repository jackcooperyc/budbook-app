import { NextResponse } from 'next/server';
import { importLearnArticles } from '@lib/repositories/learn';
import { validateLearnImport } from '@lib/learn/validate';

function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.LEARN_IMPORT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: 'Learn import is not configured (LEARN_IMPORT_SECRET missing)' },
      { status: 503 },
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) return unauthorized();

  const body = (await request.json()) as unknown;
  const validation = validateLearnImport(body);

  if (!validation.ok || !validation.data) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const result = await importLearnArticles(validation.data.articles);
  return NextResponse.json(result);
}
