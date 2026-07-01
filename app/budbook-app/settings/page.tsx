"use client";

import React from 'react';
import Button from '@/components/Button/Button';
import ThemePreference from '@/components/ThemePreference/ThemePreference';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import './settings.css';

export default function SettingsPage() {
  const { user } = useCurrentUser();

  async function exportJournal() {
    const res = await fetch('/api/internal/budbook-sessions');
    if (!res.ok) {
      alert('Could not export journal data.');
      return;
    }
    const sessions = await res.json();
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budbook-journal.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>
      <section className="settings-section glass-panel">
        <h3>Profile</h3>
        <p className="settings-row">
          <span>Name</span>
          <span>{user?.full_name ?? '—'}</span>
        </p>
        <p className="settings-row">
          <span>Username</span>
          <span className="meta-numeric">@{user?.username ?? '—'}</span>
        </p>
      </section>
      <section className="settings-section glass-panel">
        <h3>Preferences</h3>
        <ThemePreference />
        <p className="settings-hint">Unit system, reminders, and privacy controls ship in a later pass.</p>
        <Button variant="secondary" size="sm" onClick={exportJournal}>
          Export journal data
        </Button>
      </section>
      <p className="settings-legacy">
        The legacy Base44 SPA bundle is not included in this repository. Use the native BudBook UI for development.
      </p>
    </div>
  );
}
