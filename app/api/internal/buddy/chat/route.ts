import { NextResponse } from 'next/server';
import { buildBuddyContext } from '@lib/buddy/buildContext';
import { getBuddyLlmReply } from '@lib/buddy/llm';
import { getBuddyPrompts, getBuddyReply } from '@lib/buddy/reply';
import { internalApiGuard } from '@lib/auth/guard';

export async function GET() {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const context = await buildBuddyContext();
  return NextResponse.json({ prompts: getBuddyPrompts(context) });
}

export async function POST(request: Request) {
  const blocked = await internalApiGuard();
  if (blocked) return blocked;

  const body = (await request.json()) as { message?: string };
  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ message: 'message is required' }, { status: 400 });
  }

  const context = await buildBuddyContext();
  const llmReply = await getBuddyLlmReply(message, context);
  const reply = llmReply ?? getBuddyReply(message, context);

  return NextResponse.json({ reply, prompts: getBuddyPrompts(context) });
}
