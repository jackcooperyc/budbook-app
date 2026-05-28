import { getBudbookMockPayloads } from '@/lib/mockApi';
import Avatar from '@/components/Avatar/Avatar';
import { getAvatarSeed } from '@/lib/media';
import { parseOverview } from '@/lib/budbook-data';
import './profile.css';

export default async function ProfilePage() {
  const data = await getBudbookMockPayloads();
  const overview = parseOverview(data.overview);
  const summary = overview.activity_summary;

  return (
    <div className="profile-page">
      <header className="profile-hero glass-panel">
        <Avatar
          name={data.user.full_name}
          seed={getAvatarSeed(data.user.full_name)}
          size="lg"
        />
        <div>
          <h2 className="profile-name">{data.user.full_name}</h2>
          <p className="profile-username meta-numeric">@{data.user.username}</p>
          <p className="profile-email">{data.user.email}</p>
        </div>
      </header>

      <section className="profile-stats glass-panel">
        <div>
          <span className="profile-stat-value meta-numeric">
            {summary?.total_sessions_logged ?? data.sessions.length}
          </span>
          <span className="profile-stat-label">Sessions</span>
        </div>
        <div>
          <span className="profile-stat-value meta-numeric">
            {summary?.average_weekly_frequency ?? '—'}
          </span>
          <span className="profile-stat-label">Avg / week</span>
        </div>
        <div>
          <span className="profile-stat-value meta-numeric">{data.products.length}</span>
          <span className="profile-stat-label">Stash items</span>
        </div>
      </section>

      {summary?.macroscopic_trend && (
        <p className="profile-trend glass-panel">{summary.macroscopic_trend}</p>
      )}
    </div>
  );
}
