import { NextResponse } from 'next/server';
import { buildBuddyContext } from '@lib/buddy/buildContext';
import { getBuddyPrompts, getBuddyReply } from '@lib/buddy/reply';
import { mockApiDisabledResponse } from '@/lib/mockApi';

export async function GET() {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const context = await buildBuddyContext();
  return NextResponse.json({ prompts: getBuddyPrompts(context) });
}

export async function POST(request: Request) {
  const blocked = mockApiDisabledResponse();
  if (blocked) return blocked;

  const body = (await request.json()) as { message?: string };
  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ message: 'message is required' }, { status: 400 });
  }

  const context = await buildBuddyContext();
  const reply = getBuddyReply(message, context);

  return NextResponse.json({ reply, prompts: getBuddyPrompts(context) });
}
