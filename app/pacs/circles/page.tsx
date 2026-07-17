"use client";

import React, { Suspense, useState } from 'react';
import CircleCard from '@/components/CircleCard/CircleCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import Button from '@/components/Button/Button';
import Skeleton from '@/components/Skeleton/Skeleton';
import { useCircles } from '@/hooks/useCircles';
import { Plus, UsersRound } from 'lucide-react';
import './circles.css';

function CirclesContent() {
  const { circles, loading, createCircle } = useCircles();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createCircle({ name: name.trim(), isPrivate: true });
      setName('');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="circles-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Circles</h2>
          <p className="page-subtitle">Private groups for shared wellness journeys</p>
        </div>
      </header>

      <form className="circles-create glass-panel" onSubmit={(e) => void handleCreate(e)}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New circle name"
          aria-label="Circle name"
        />
        <Button type="submit" variant="primary" size="sm" icon={<Plus size={14} />} disabled={creating}>
          Create
        </Button>
      </form>

      <div className="circles-list">
        {loading ? (
          <Skeleton className="skeleton-row" />
        ) : circles.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No circles yet"
            description="Create a circle for your wellness group or join one from an invite."
          />
        ) : (
          circles.map((circle) => <CircleCard key={circle.id} circle={circle} />)
        )}
      </div>
    </div>
  );
}

export default function CirclesPage() {
  return (
    <Suspense fallback={<Skeleton className="skeleton-row" />}>
      <CirclesContent />
    </Suspense>
  );
}
