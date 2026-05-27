import { readFile } from 'fs/promises';
import path from 'path';
import type {
  BudbookMockRaw,
  BudbookMockPayloads,
  Product,
  InventoryItem,
  Session,
  Dispensary,
  Accessory,
  AccessoryCategory,
  AccessoryCondition,
} from '@/types/budbook';

export type { BudbookMockRaw, BudbookMockPayloads };

function classificationToType(c: string): Product['type'] {
  const x = String(c || '').toLowerCase();
  if (x === 'indica' || x === 'sativa' || x === 'hybrid') return x;
  return 'hybrid';
}

export function buildPayloadsFromRaw(raw: BudbookMockRaw): BudbookMockPayloads {
  const stash = raw.stash;

  const products: Product[] = stash.products.map((prod) => ({
    id: prod.id,
    name: prod.strain_name,
    strain_name: prod.strain_name,
    brand: prod.brand,
    type: classificationToType(prod.classification),
    category: prod.category,
    thc_percentage: prod.thc_percentage,
    cbd_percentage: prod.cbd_percentage,
    terpene_profile: prod.top_terpenes.map((t) => ({
      terpene_name: t.name,
      percentage: t.percentage,
    })),
    lab_report_id: prod.lab_report_id,
    dispensary_id: prod.preferred_dispensary_id,
  }));

  const inventory: InventoryItem[] = stash.products.map((prod) => {
    const qty = prod.remaining_quantity;
    const unit = qty.unit === 'g' ? 'grams' : qty.unit;
    return {
      id: `inv-${prod.id}`,
      product_id: prod.id,
      quantity: qty.value,
      unit,
      is_active: true,
      purchase_date: prod.purchase_date || '2026-04-01',
      notes: '',
    };
  });

  const ratings = [5, 4, 3, 4];
  const sessions: Session[] = raw.recent_sessions.map((s, idx) => {
    const pre = s.efficacy_mapping.pre;
    const post = s.efficacy_mapping.post;
    return {
      id: s.id,
      date: s.timestamp,
      product_id: s.variables.product_id,
      consumption_method: s.variables.consumption_method,
      dosage: s.variables.dosage,
      pairing_notes: s.variables.pairing || '',
      rating: ratings[idx] != null ? ratings[idx] : 4,
      mood_before: pre.mood,
      mood_after: post.mood,
      pain_before: pre.pain,
      pain_after: post.pain,
      anxiety_before: pre.anxiety,
      anxiety_after: post.anxiety,
      effects_felt: ['Calm', 'Body relaxation'],
      activities: ['Wind-down'],
      session_notes: s.pattern_recognition,
      session_name: '',
    };
  });

  sessions.sort(
    (a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime(),
  );

  const dispensaries: Dispensary[] = stash.retail_directory.map((d) => ({
    id: d.id,
    name: d.dispensary_name,
    shop_name: d.dispensary_name,
    city: d.location.city,
    state: d.location.state,
    address: d.location.address_line,
    zip_code: d.location.zip,
    notes: `Preferred budtender: ${d.preferred_budtender.name} — ${d.preferred_budtender.contact}`,
    last_visit_date: d.last_transaction_date,
  }));

  function accessoryCategoryFromHardware(h: { model_name: string }): AccessoryCategory {
    const n = h.model_name.toLowerCase();
    if (n.includes('grinder') || n.includes('shredder')) return 'grinder';
    if (
      n.includes('vaporizer') ||
      n.includes('pax') ||
      n.includes('cupr') ||
      n.includes('dry herb')
    ) {
      return 'vaporizer_dry_herb';
    }
    return 'other';
  }

  function accessoryConditionSlug(raw: string): AccessoryCondition {
    const x = String(raw || '').toLowerCase();
    if (x.includes('optimal') || x.includes('excellent') || x.includes('good')) return 'good';
    if (x.includes('need') || x.includes('maint')) return 'needs_maintenance';
    return 'good';
  }

  const accessories: Accessory[] = stash.hardware.map((h) => ({
    id: h.id,
    name: h.model_name,
    brand: h.brand,
    category: accessoryCategoryFromHardware(h),
    condition: accessoryConditionSlug(h.condition),
    purchase_date: '2026-04-01',
    notes: '',
    is_favorite: false,
    image_url: '',
    usage_sessions_count: h.usage_count,
    condition_status: h.condition,
    next_maintenance_date: h.next_scheduled_maintenance,
    ecosystem_tag: h.ecosystem,
  }));

  return {
    overview: raw.overview,
    user: {
      id: 'user-mock-jordan-rivers',
      email: 'jordan.rivers.mock@example.com',
      full_name: 'Jordan Rivers',
      username: 'jordanrivers',
      role: 'user',
    },
    products,
    inventory,
    sessions,
    dispensaries,
    accessories,
  };
}

let payloadsPromise: Promise<BudbookMockPayloads> | null = null;

export async function getBudbookMockPayloads(): Promise<BudbookMockPayloads> {
  if (!payloadsPromise) {
    payloadsPromise = (async () => {
      const fp = path.join(
        process.cwd(),
        'public/budbook-app/mock/budbook-mock-user.json',
      );
      const txt = await readFile(fp, 'utf8');
      const raw = JSON.parse(txt) as BudbookMockRaw;
      return buildPayloadsFromRaw(raw);
    })();
  }
  return payloadsPromise;
}
