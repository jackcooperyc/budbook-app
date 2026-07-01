import EmptyState from '@/components/EmptyState/EmptyState';
import { Users } from 'lucide-react';
import './friends.css';

export default function FriendsPage() {
  return (
    <div className="friends-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Friends</h2>
          <p className="page-subtitle">People you share sessions and insights with</p>
        </div>
      </header>
      <EmptyState
        icon={Users}
        title="Friends coming soon"
        description="Social connections will ship after core stash and journal flows are production-ready."
      />
    </div>
  );
}
