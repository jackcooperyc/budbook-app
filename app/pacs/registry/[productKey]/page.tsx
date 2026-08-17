import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { getCatalogEntry } from '@lib/caa/registry';
import { findStashByLabReportId } from '@lib/caa/duplicates';
import Chip from '@/components/Chip/Chip';
import TerpeneProfile from '@/components/TerpeneProfile/TerpeneProfile';
import Button from '@/components/Button/Button';
import EmptyState from '@/components/EmptyState/EmptyState';
import './detail.css';

type Params = { params: Promise<{ productKey: string }> };

export default async function RegistryDetailPage({ params }: Params) {
  const { productKey } = await params;
  const entry = await getCatalogEntry(decodeURIComponent(productKey));

  if (!entry) {
    return (
      <EmptyState
        icon={Package}
        title="Strain not found"
        description="This product_key is not in the CAA catalog. Scan a COA to register it."
        action={
          <Link href="/pacs/registry">
            <Button variant="primary" size="sm">
              Back to Registry
            </Button>
          </Link>
        }
      />
    );
  }

  const inStash = entry.lab_report_id
    ? await findStashByLabReportId(entry.lab_report_id)
    : null;

  return (
    <div className="cannadex-detail">
      <Link href="/pacs/registry" className="cannadex-detail-back">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Registry
      </Link>

      <header className="cannadex-detail-hero glass-panel">
        <div className="cannadex-detail-title-row">
          <h2 className="page-title">{entry.strain_name}</h2>
          <Chip label={entry.type} variant={entry.type} />
        </div>
        <p className="cannadex-detail-brand">{entry.brand}</p>
        <p className="cannadex-detail-meta meta-numeric">
          THC {entry.thc_percentage}% · CBD {entry.cbd_percentage}% · {entry.category}
        </p>
        <p className="cannadex-detail-lab">
          Lab report: <code>{entry.lab_report_id}</code>
        </p>
        <p className="cannadex-detail-key">
          product_key: <code>{entry.product_key}</code>
        </p>
        <span className="cannadex-detail-badge">CAA {entry.compliance_status}</span>
      </header>

      <section className="cannadex-detail-section glass-panel">
        <h3>Authoritative terpene profile</h3>
        <TerpeneProfile terpenes={entry.terpene_profile} />
      </section>

      {inStash && (
        <section className="cannadex-detail-stash glass-panel">
          <p>
            In your stash as <strong>{inStash.strain_name}</strong>
          </p>
          <Link href="/pacs/stash">
            <Button variant="secondary" size="sm">
              View stash
            </Button>
          </Link>
        </section>
      )}

      <p className="cannadex-detail-registered meta-numeric">
        Registered {new Date(entry.registered_at).toLocaleDateString()}
      </p>
    </div>
  );
}
