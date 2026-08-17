import BuddyChat from '@/components/BuddyChat/BuddyChat';

export default function AssistantPage() {
  return (
    <div className="buddy-page-wrap">
      <header className="page-header">
        <div>
          <h2 className="page-title">PACS Assistant</h2>
          <p className="page-subtitle">Guidance from your scanned products and session history</p>
        </div>
      </header>
      <BuddyChat />
    </div>
  );
}
