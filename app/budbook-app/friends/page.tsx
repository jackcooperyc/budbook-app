import FriendCard from '@/components/FriendCard/FriendCard';
import { friends } from '@/data/socialMock';
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
      <div className="friends-list">
        {friends.map((f) => (
          <FriendCard key={f.id} friend={f} />
        ))}
      </div>
    </div>
  );
}
