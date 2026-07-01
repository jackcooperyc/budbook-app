import EmptyState from '@/components/EmptyState/EmptyState';
import { GraduationCap } from 'lucide-react';
import './learn.css';

export default function LearnPage() {
  return (
    <div className="learn-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Learn</h2>
          <p className="page-subtitle">Education and harm-reduction resources</p>
        </div>
      </header>
      <EmptyState
        icon={GraduationCap}
        title="Learn content coming soon"
        description="Curated articles and guides will be added via CMS in a later phase."
      />
    </div>
  );
}
