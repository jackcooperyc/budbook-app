import Link from 'next/link';
import { ArrowRight, BookOpen, Package, PenLine } from 'lucide-react';
import InsightCard from '@/components/InsightCard/InsightCard';
import SessionCard from '@/components/SessionCard/SessionCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import { getAppData } from '@/lib/app-data';
import {
  computeWeeklyFrequency,
  computeLowStockAlerts,
  computeLiveInsights,
  computeActivitySubtitle,
} from '@/lib/app-stats';
import { productNameById } from '@/lib/budbook-data';
import './home.css';

export default async function DashboardPage() {
  const { user, products, inventory, sessions } = await getAppData();
  const totalSessions = sessions.length;
  const weeklyFreq = computeWeeklyFrequency(sessions);
  const lowAlerts = computeLowStockAlerts(products, inventory);
  const insights = computeLiveInsights(sessions, products);
  const subtitle = computeActivitySubtitle(sessions);
  const recentSessions = sessions.slice(0, 2);

  return (
    <div className="dashboard">
      <section className="dashboard-hero glass-panel">
        <p className="dashboard-eyebrow">Welcome back, {user.full_name.split(' ')[0]}</p>
        <h2 className="dashboard-title">
          Your <span className="gradient-text">wellness OS</span>
        </h2>
        <p className="dashboard-subtitle">{subtitle}</p>
        <div className="dashboard-stats meta-numeric">
          <div>
            <span className="dashboard-stat-value">{totalSessions}</span>
            <span className="dashboard-stat-label">Sessions logged</span>
          </div>
          <div>
            <span className="dashboard-stat-value">{weeklyFreq ?? '—'}</span>
            <span className="dashboard-stat-label">Avg / week</span>
          </div>
          <div>
            <span className="dashboard-stat-value">{products.length}</span>
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
        {insights.length > 0 ? (
          <div className="dashboard-insights">
            {insights.map((text, i) => (
              <InsightCard key={text} text={text} index={i} />
            ))}
          </div>
        ) : (
          <p className="dashboard-empty-hint">
            Log a few sessions to unlock personalized insights from your journal.
          </p>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Recent sessions</h3>
        </div>
        {recentSessions.length > 0 ? (
          <div className="dashboard-sessions">
            {recentSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                strainName={productNameById(products, session.product_id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No sessions yet"
            description="Your recent sessions will appear here once you start logging."
            action={
              <Link href="/budbook-app/journal?log=1">
                <Button variant="primary" size="sm">
                  Log a session
                </Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
