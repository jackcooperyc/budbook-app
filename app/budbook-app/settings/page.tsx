"use client";

import React from 'react';
import Button from '@/components/Button/Button';
import ThemePreference from '@/components/ThemePreference/ThemePreference';
import './settings.css';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <h2 className="page-title">Settings</h2>
      <section className="settings-section glass-panel">
        <h3>Profile</h3>
        <p className="settings-row">
          <span>Name</span>
          <span>Jordan Rivers</span>
        </p>
        <p className="settings-row">
          <span>Username</span>
          <span className="meta-numeric">@jordanrivers</span>
        </p>
      </section>
      <section className="settings-section glass-panel">
        <h3>Preferences</h3>
        <ThemePreference />
        <p className="settings-hint">Unit system, reminders, and privacy controls ship in a later pass.</p>
        <Button variant="secondary" size="sm" onClick={() => alert('Demo only')}>
          Export journal data
        </Button>
      </section>
      <p className="settings-legacy">
        Need the full Base44 experience?{' '}
        <a href="/budbook-app/index.html?mock=1">Open legacy app</a>
      </p>
    </div>
  );
}
