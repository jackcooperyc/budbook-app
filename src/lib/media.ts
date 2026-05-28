export function getAvatarSeed(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function getStrainHue(strainId: string): number {
  let hash = 0;
  for (let i = 0; i < strainId.length; i++) {
    hash = strainId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 100 + (Math.abs(hash) % 40);
}

export function getStrainCoverUrl(productId: string, width = 400, height = 300): string {
  const seed = productId.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'strain';
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export function getTerpeneBarWidths(
  terpenes: { terpene_name: string; percentage: number }[],
  count = 5,
): number[] {
  const sorted = [...terpenes].sort((a, b) => b.percentage - a.percentage).slice(0, count);
  const max = sorted[0]?.percentage || 1;
  return sorted.map((t) => Math.round((t.percentage / max) * 100));
}

export function formatQuantity(value: number, unit: string): string {
  const u = unit === 'grams' ? 'g' : unit;
  return `${value}${u}`;
}
