import Link from 'next/link';
import { ArrowRight, Package, PenLine } from 'lucide-react';
import { getBudbookMockPayloads } from '@/lib/mockApi';
import InsightCard from '@/components/InsightCard/InsightCard';
import SessionCard from '@/components/SessionCard/SessionCard';
import Button from '@/components/Button/Button';
import { parseOverview, productNameById } from '@/lib/budbook-data';
import './home.css';

export default async function DashboardPage() {
  const data = await getBudbookMockPayloads();
  const overview = parseOverview(data.overview);
  const insights = overview.data_insights ?? [];
  const recentSessions = data.sessions.slice(0, 2);
  const lowAlerts = overview.inventory_telemetry?.low_product_alerts ?? [];

  return (
    <div className="dashboard">
      <section className="dashboard-hero glass-panel">
        <p className="dashboard-eyebrow">Welcome back, {data.user.full_name.split(' ')[0]}</p>
        <h2 className="dashboard-title">
          Your <span className="gradient-text">wellness OS</span>
        </h2>
        <p className="dashboard-subtitle">
          {overview.activity_summary?.macroscopic_trend ??
            'Log sessions, track stash, and learn what works for your body.'}
        </p>
        <div className="dashboard-stats meta-numeric">
          <div>
            <span className="dashboard-stat-value">
              {overview.activity_summary?.total_sessions_logged ?? data.sessions.length}
            </span>
            <span className="dashboard-stat-label">Sessions logged</span>
          </div>
          <div>
            <span className="dashboard-stat-value">
              {overview.activity_summary?.average_weekly_frequency ?? '—'}
            </span>
            <span className="dashboard-stat-label">Avg / week</span>
          </div>
          <div>
            <span className="dashboard-stat-value">{data.products.length}</span>
            <span className="dashboard-stat-label">Products in stash</span>
          </div>
        </div>
        <div className="dashboard-cta">
          <Link href="/budbook-app/journal?log=1">
            <Button variant="primary" icon={<PenLine size={16} strokeWidth={1.75} />}>
              Log session
            </Button>
          </Link>
          <Link href="/budbook-app/stash">
            <Button variant="secondary" icon={<Package size={16} strokeWidth={1.75} />}>
              View stash
            </Button>
          </Link>
          <Link href="/budbook-app/buddy">
            <Button variant="ghost" size="sm">
              Ask Buddy AI
            </Button>
          </Link>
        </div>
      </section>

      {lowAlerts.length > 0 && (
        <section className="dashboard-alerts">
          {lowAlerts.map((alert) => (
            <p key={alert} className="dashboard-alert">
              {alert}
            </p>
          ))}
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Data insights</h3>
          <Link href="/budbook-app/journal" className="dashboard-link">
            Journal <ArrowRight size={14} />
          </Link>
        </div>
        <div className="dashboard-insights">
          {insights.map((text, i) => (
            <InsightCard key={text} text={text} index={i} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Recent sessions</h3>
        </div>
        <div className="dashboard-sessions">
          {recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              strainName={productNameById(data.products, session.product_id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
