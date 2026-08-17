import { NextResponse } from 'next/server';
import { addServerSession, readServerSessions } from '@/lib/sessions-store/fileStore';
import { internalApiGuard } from '@lib/auth/guard';
import type { Session } from '@/types/pacs';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;
  return NextResponse.json(await readServerSessions());
}

export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as Partial<Session>;

  if (!body?.product_id || !body?.consumption_method || !body?.dosage) {
    return NextResponse.json({ message: 'Invalid session payload' }, { status: 400 });
  }

  const session = await addServerSession({
    date: body.date ?? new Date().toISOString(),
    product_id: body.product_id,
    consumption_method: body.consumption_method,
    dosage: body.dosage,
    pairing_notes: body.pairing_notes ?? '',
    rating: body.rating ?? 4,
    mood_before: body.mood_before ?? 5,
    mood_after: body.mood_after ?? 7,
    pain_before: body.pain_before ?? 5,
    pain_after: body.pain_after ?? 4,
    anxiety_before: body.anxiety_before ?? 5,
    anxiety_after: body.anxiety_after ?? 4,
    effects_felt: body.effects_felt ?? [],
    activities: body.activities ?? [],
    session_notes: body.session_notes ?? '',
    session_name: body.session_name ?? '',
    id: body.id,
  });

  return NextResponse.json(session);
}
