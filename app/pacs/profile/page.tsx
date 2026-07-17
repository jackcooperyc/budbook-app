import Avatar from '@/components/Avatar/Avatar';
import { getAvatarSeed } from '@/lib/media';
import { getAppData } from '@/lib/app-data';
import { computeWeeklyFrequency, computeActivitySubtitle } from '@/lib/app-stats';
import './profile.css';

export default async function ProfilePage() {
  const { user, products, sessions } = await getAppData();
  const weeklyFreq = computeWeeklyFrequency(sessions);
  const trend = computeActivitySubtitle(sessions);

  return (
    <div className="profile-page">
      <header className="profile-hero glass-panel">
        <Avatar
          name={user.full_name}
          seed={getAvatarSeed(user.full_name)}
          size="lg"
        />
        <div>
          <h2 className="profile-name">{user.full_name}</h2>
          <p className="profile-username meta-numeric">@{user.username}</p>
          <p className="profile-email">{user.email}</p>
        </div>
      </header>

      <section className="profile-stats glass-panel">
        <div>
          <span className="profile-stat-value meta-numeric">{sessions.length}</span>
          <span className="profile-stat-label">Sessions</span>
        </div>
        <div>
          <span className="profile-stat-value meta-numeric">{weeklyFreq ?? '—'}</span>
          <span className="profile-stat-label">Avg / week</span>
        </div>
        <div>
          <span className="profile-stat-value meta-numeric">{products.length}</span>
          <span className="profile-stat-label">Stash items</span>
        </div>
      </section>

      <p className="profile-trend glass-panel">{trend}</p>
    </div>
  );
}
