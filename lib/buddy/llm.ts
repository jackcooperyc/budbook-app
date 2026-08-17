import type { BuddyContext } from './types';

function formatContext(ctx: BuddyContext): string {
  const stashLines = ctx.products
    .slice(0, 8)
    .map((p) => `- ${p.strain_name} (${p.type}, ${p.thc_percentage}% THC)`)
    .join('\n');
  const sessionLines = ctx.sessions
    .slice(0, 5)
    .map(
      (s) =>
        `- ${s.date.slice(0, 10)} product=${s.product_id} mood ${s.mood_before}→${s.mood_after} pain ${s.pain_before}→${s.pain_after} method=${s.consumption_method}`,
    )
    .join('\n');

  return `User: ${ctx.userName}
Stash (${ctx.products.length} products):
${stashLines || '(empty)'}
Recent sessions (${ctx.sessions.length} total):
${sessionLines || '(none)'}`;
}

export async function getBuddyLlmReply(
  message: string,
  ctx: BuddyContext,
): Promise<string | null> {
  const apiKey = process.env.PACSMT_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.PACSMT_OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are the PACS Assistant for Pacs.MT (Product Analysis Certification Scanner for Montana Cannabis Packaging). Use ONLY the user stash and journal context provided. Give practical, non-medical guidance about scanned products and sessions in 2-4 sentences. Do not invent products or sessions not in context.',
        },
        {
          role: 'user',
          content: `${formatContext(ctx)}\n\nUser question: ${message}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}
