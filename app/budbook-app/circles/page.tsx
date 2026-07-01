import EmptyState from '@/components/EmptyState/EmptyState';
import { UsersRound } from 'lucide-react';
import './circles.css';

export default function CirclesPage() {
  return (
    <div className="circles-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Circles</h2>
          <p className="page-subtitle">Private groups for shared wellness journeys</p>
        </div>
      </header>
      <EmptyState
        icon={UsersRound}
        title="Circles coming soon"
        description="Create and join circles once the social graph backend is wired up."
      />
    </div>
  );
}
