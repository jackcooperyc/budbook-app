import { NextResponse } from 'next/server';
import { internalApiGuard } from '@lib/auth/guard';
import { createCircle, listCircles } from '@lib/repositories/social';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await listCircles());
}

export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    isPrivate?: boolean;
  };

  if (!body?.name?.trim()) {
    return NextResponse.json({ message: 'Circle name is required' }, { status: 400 });
  }

  const circle = await createCircle({
    name: body.name,
    description: body.description,
    isPrivate: body.isPrivate,
  });

  return NextResponse.json(circle);
}
