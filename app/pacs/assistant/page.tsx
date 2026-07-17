import BuddyChat from '@/components/BuddyChat/BuddyChat';

export default function BuddyPage() {
  return (
    <div className="buddy-page-wrap">
      <header className="page-header">
        <div>
          <h2 className="page-title">Buddy AI</h2>
          <p className="page-subtitle">Personalized coaching from your session history</p>
        </div>
      </header>
      <BuddyChat />
    </div>
  );
}
