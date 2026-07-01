"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button/Button';
import { usePosts } from '@/hooks/usePosts';
import './NewPostForm.css';

export default function NewPostForm() {
  const router = useRouter();
  const { createPost } = usePosts();
  const [body, setBody] = useState('');
  const [strain, setStrain] = useState('');
  const [circle, setCircle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createPost({
        body: body.trim(),
        strain: strain || undefined,
        circle: circle || undefined,
      });
      router.push('/budbook-app/media?posted=1');
    } catch {
      setError('Could not publish post.');
      setSaving(false);
    }
  }

  return (
    <form className="new-post-form action-panel" onSubmit={handleSubmit}>
      <h3 className="action-panel-title">Share with your circles</h3>
      <label className="new-post-field">
        <span>What happened in your session?</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Log insights, pairings, or wins…"
          required
        />
      </label>
      <label className="new-post-field">
        <span>Strain (optional)</span>
        <input
          type="text"
          value={strain}
          onChange={(e) => setStrain(e.target.value)}
          placeholder="GMO Cookies"
        />
      </label>
      <label className="new-post-field">
        <span>Circle (optional)</span>
        <input
          type="text"
          value={circle}
          onChange={(e) => setCircle(e.target.value)}
          placeholder="e.g. Evening wind-down"
        />
      </label>
      {error && <p className="new-post-error">{error}</p>}
      <div className="new-post-actions">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Publishing…' : 'Publish'}
        </Button>
      </div>
    </form>
  );
}
