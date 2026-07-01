import type { InventoryItem, Product, Session } from '@/types/budbook';
import { inventoryByProductId, isLowStock, productNameById } from '@/lib/budbook-data';
import { formatQuantity } from '@/lib/media';

export function computeActivitySubtitle(sessions: Session[]): string {
  if (sessions.length === 0) {
    return 'Add products to your stash and log sessions to build your wellness profile.';
  }
  const recent = sessions.slice(0, 3);
  const moodDelta =
    recent.reduce((sum, s) => sum + (s.mood_after - s.mood_before), 0) / recent.length;
  if (moodDelta > 0.3) {
    return 'Recent sessions show improving mood — keep logging to refine patterns.';
  }
  if (sessions.length < 3) {
    return `${sessions.length} session${sessions.length === 1 ? '' : 's'} logged — a few more unlock stronger insights.`;
  }
  return 'Your journal is active — insights update as you log more sessions.';
}

export function computeWeeklyFrequency(sessions: Session[]): number | null {
  if (sessions.length === 0) return null;
  const times = sessions.map((s) => new Date(s.date).getTime());
  const spanMs = Math.max(...times) - Math.min(...times);
  const weeks = Math.max(1, spanMs / (7 * 24 * 60 * 60 * 1000));
  return Math.round((sessions.length / weeks) * 10) / 10;
}

export function computeLowStockAlerts(
  products: Product[],
  inventory: InventoryItem[],
): string[] {
  const invMap = inventoryByProductId(inventory);
  return products
    .filter((p) => isLowStock(p, invMap.get(p.id)))
    .map((p) => {
      const inv = invMap.get(p.id);
      const qty = inv ? formatQuantity(inv.quantity, inv.unit) : 'low';
      return `${p.strain_name} is running low (${qty} remaining)`;
    });
}

export function computeLiveInsights(
  sessions: Session[],
  products: Product[],
): string[] {
  const insights: string[] = [];
  const recent = sessions.slice(0, 5);

  if (recent.length >= 2) {
    const moodLift = recent
      .map((s) => s.mood_after - s.mood_before)
      .reduce((a, b) => a + b, 0);
    const avgLift = moodLift / recent.length;
    if (avgLift > 0.5) {
      insights.push(
        `Your last ${recent.length} sessions show a positive mood trend (+${avgLift.toFixed(1)} avg).`,
      );
    }
  }

  const byProduct = new Map<string, number>();
  for (const s of sessions) {
    byProduct.set(s.product_id, (byProduct.get(s.product_id) ?? 0) + 1);
  }
  const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) {
    insights.push(
      `${productNameById(products, top[0])} is your most-logged strain (${top[1]} sessions).`,
    );
  }

  if (sessions.length > 0) {
    const last = sessions[0];
    insights.push(
      `Last session: ${productNameById(products, last.product_id)} via ${last.consumption_method}.`,
    );
  }

  return insights.slice(0, 3);
}
