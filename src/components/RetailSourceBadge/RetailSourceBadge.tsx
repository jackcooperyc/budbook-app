import type { RetailProvider } from '@/types/rda';
import './RetailSourceBadge.css';

const LABELS: Record<RetailProvider, string> = {
  cannmenus: 'CannMenus',
  weedmaps: 'Weedmaps',
  leafly: 'Leafly',
  dutchie: 'Dutchie',
  jane: 'Jane',
};

interface RetailSourceBadgeProps {
  provider: RetailProvider;
  confidence?: 'high' | 'medium' | 'low';
}

export default function RetailSourceBadge({ provider, confidence = 'high' }: RetailSourceBadgeProps) {
  return (
    <span className={`retail-source-badge retail-source-${confidence}`} title={`Source: ${LABELS[provider]}`}>
      {LABELS[provider]}
    </span>
  );
}
