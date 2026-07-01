import { inventoryByProductId, productNameById } from '@/lib/budbook-data';
import { formatQuantity } from '@/lib/media';
import {
  computeLiveInsights,
  computeLowStockAlerts,
} from '@/lib/app-stats';
import type { BuddyContext } from './types';

function sessionsForProduct(ctx: BuddyContext, productId: string) {
  return ctx.sessions.filter((s) => s.product_id === productId);
}

function avgPainRelief(ctx: BuddyContext, productId: string): number | null {
  const rows = sessionsForProduct(ctx, productId);
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, s) => sum + (s.pain_before - s.pain_after), 0);
  return total / rows.length;
}

function findProductsByQuery(ctx: BuddyContext, query: string) {
  const q = query.toLowerCase();
  return ctx.products.filter(
    (p) =>
      p.strain_name.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q),
  );
}

function eveningSessions(ctx: BuddyContext) {
  return ctx.sessions.filter((s) => new Date(s.date).getHours() >= 18);
}

export function getBuddyPrompts(ctx: BuddyContext): string[] {
  const prompts = ['What strain helps me sleep?', 'Compare strains for pain relief'];

  const lowStock = computeLowStockAlerts(ctx.products, ctx.inventory);
  if (lowStock.length > 0) {
    prompts.push("What's running low in my stash?");
  }

  if (ctx.sessions.some((s) => s.anxiety_after > s.anxiety_before + 1)) {
    prompts.push('Why did my anxiety spike recently?');
  }

  return prompts.slice(0, 3);
}

export function getBuddyReply(input: string, ctx: BuddyContext): string {
  const q = input.toLowerCase();

  if (q.includes('low') || q.includes('stash') || q.includes('stock') || q.includes('running')) {
    const alerts = computeLowStockAlerts(ctx.products, ctx.inventory);
    if (alerts.length === 0) {
      if (ctx.products.length === 0) {
        return 'Your stash is empty — browse Shops or scan a COA to add products, then I can flag low stock.';
      }
      return 'All tracked products look well stocked right now. I flag items under 2g (flower) or low unit counts.';
    }
    return alerts.join(' ');
  }

  if (q.includes('sleep') || q.includes('evening') || q.includes('night')) {
    const indicas = ctx.products.filter((p) => p.type === 'indica');
    const evening = eveningSessions(ctx);

    if (indicas.length === 0 && evening.length === 0) {
      return 'No evening sessions or indicas in your stash yet. Add an indica-forward product and log a session after 6 PM to unlock sleep insights.';
    }

    const ranked = indicas
      .map((p) => ({
        name: p.strain_name,
        relief: avgPainRelief(ctx, p.id),
        mood: sessionsForProduct(ctx, p.id).map((s) => s.mood_after - s.mood_before),
      }))
      .filter((r) => r.relief != null || r.mood.length > 0)
      .sort((a, b) => (b.relief ?? 0) - (a.relief ?? 0));

    if (ranked.length > 0) {
      const top = ranked[0];
      return `Your journal favors ${top.name} for evening use${top.relief != null ? ` (avg pain relief ${top.relief.toFixed(1)} pts)` : ''}. ${evening.length} evening session${evening.length === 1 ? '' : 's'} logged so far.`;
    }

    return `You have ${indicas.map((p) => p.strain_name).join(', ')} in stash — log an evening session to see which works best for sleep.`;
  }

  if (q.includes('anxiety')) {
    const spikes = ctx.sessions.filter((s) => s.anxiety_after > s.anxiety_before + 1);
    if (spikes.length === 0) {
      return 'No anxiety spikes in your logged sessions. Keep noting pairing context (caffeine, empty stomach) in session notes.';
    }
    const latest = spikes[0];
    const strain = productNameById(ctx.products, latest.product_id);
    const notes = latest.pairing_notes || latest.session_notes;
    return `Your most recent anxiety increase was with ${strain} (${new Date(latest.date).toLocaleDateString()}).${notes ? ` Notes: "${notes}".` : ''} Try separating stimulants by 2+ hours or a CBD-forward option mid-day.`;
  }

  if (q.includes('pain') || q.includes('compare') || q.includes(' vs ')) {
    const mentioned = ctx.products.filter((p) => q.includes(p.strain_name.toLowerCase()));
    const candidates = mentioned.length >= 2 ? mentioned : ctx.products.slice(0, 2);

    if (candidates.length < 2) {
      return 'Log sessions for at least two strains to compare pain outcomes — I use your before/after pain scores.';
    }

    const lines = candidates.map((p) => {
      const relief = avgPainRelief(ctx, p.id);
      const count = sessionsForProduct(ctx, p.id).length;
      return `${p.strain_name}: ${relief != null ? `avg pain relief ${relief.toFixed(1)}` : 'no sessions yet'} (${count} logged)`;
    });

    const withData = candidates
      .map((p) => ({ p, relief: avgPainRelief(ctx, p.id) }))
      .filter((x) => x.relief != null)
      .sort((a, b) => (b.relief ?? 0) - (a.relief ?? 0));

    if (withData.length >= 2) {
      const [best, second] = withData;
      return `${lines.join('. ')}. ${best.p.strain_name} edges out ${second.p.strain_name} on pain relief in your journal.`;
    }

    return lines.join('. ') + '. Log more sessions to sharpen the comparison.';
  }

  const strainMatch = findProductsByQuery(ctx, q);
  if (strainMatch.length === 1) {
    const p = strainMatch[0];
    const inv = inventoryByProductId(ctx.inventory).get(p.id);
    const sessions = sessionsForProduct(ctx, p.id);
    const qty = inv ? formatQuantity(inv.quantity, inv.unit) : 'unknown qty';
    return `${p.strain_name} (${p.type}, ${p.thc_percentage}% THC) — ${qty} in stash, ${sessions.length} session${sessions.length === 1 ? '' : 's'} logged.${sessions.length > 0 ? ` Last rating: ${sessions[0].rating}/5.` : ''}`;
  }

  const insights = computeLiveInsights(ctx.sessions, ctx.products);
  if (insights.length > 0) {
    return insights.join(' ');
  }

  if (ctx.products.length === 0 && ctx.sessions.length === 0) {
    return `Hey ${ctx.userName} — add products to your stash and log a session. I'll surface patterns from your real journal data.`;
  }

  return `Hey ${ctx.userName} — keep logging sessions with pairing notes. I use your stash (${ctx.products.length} products) and journal (${ctx.sessions.length} sessions) for personalized answers.`;
}
