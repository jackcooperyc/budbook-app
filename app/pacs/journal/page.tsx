"use client";

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, PenLine } from 'lucide-react';
import type { Session } from '@/types/budbook';
import SessionCard from '@/components/SessionCard/SessionCard';
import SessionLogForm from '@/components/SessionLogForm/SessionLogForm';
import EmptyState from '@/components/EmptyState/EmptyState';
import Skeleton from '@/components/Skeleton/Skeleton';
import Button from '@/components/Button/Button';
import { useServerSessions } from '@/hooks/useServerSessions';
import { useServerStash } from '@/hooks/useServerStash';
import { productNameById } from '@/lib/budbook-data';
import { getLocalSessions } from '@/lib/journalStorage';
import './journal.css';

function JournalContent() {
  const { sessions, loading: sessionsLoading, error: sessionsError, saveSession } =
    useServerSessions();
  const { products, loading: stashLoading } = useServerStash();
  const searchParams = useSearchParams();
  const showLog = searchParams.get('log') === '1';
  const [panelOpen, setPanelOpen] = useState(showLog);
  const [toast, setToast] = useState<string | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (migrated || sessionsLoading) return;
    const local = getLocalSessions();
    if (local.length === 0) {
      setMigrated(true);
      return;
    }
    Promise.all(local.map((s) => saveSession(s))).then(() => {
      localStorage.removeItem('budbook-local-sessions');
      setMigrated(true);
    });
  }, [migrated, sessionsLoading, saveSession]);

  const handleSave = useCallback(
    async (session: Session) => {
      await saveSession(session);
      setPanelOpen(false);
      setToast('Session saved to your journal.');
      setTimeout(() => setToast(null), 2800);
    },
    [saveSession],
  );

  if (sessionsLoading || stashLoading) {
    return (
      <div className="journal-list">
        <Skeleton className="skeleton-row" />
        <Skeleton className="skeleton-row" />
      </div>
    );
  }

  if (sessionsError) {
    return <p className="journal-error">Could not load journal: {sessionsError}</p>;
  }

  return (
    <div className="journal-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Journal</h2>
          <p className="page-subtitle">
            {sessions.length} session{sessions.length === 1 ? '' : 's'} · efficacy tracking
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PenLine size={14} strokeWidth={1.75} />}
          onClick={() => setPanelOpen((v) => !v)}
          disabled={products.length === 0}
        >
          Log session
        </Button>
      </header>

      {products.length === 0 && (
        <p className="journal-hint">
          Add a product to your stash before you can log a session.
        </p>
      )}

      {panelOpen && (
        <SessionLogForm
          products={products}
          onSave={handleSave}
          onCancel={() => setPanelOpen(false)}
        />
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No sessions logged yet"
          description="Track mood, pain, and anxiety before and after each session to unlock insights."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPanelOpen(true)}
              disabled={products.length === 0}
            >
              Log your first session
            </Button>
          }
        />
      ) : (
        <div className="journal-list">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              strainName={productNameById(products, session.product_id)}
            />
          ))}
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<Skeleton className="skeleton-row" />}>
      <JournalContent />
    </Suspense>
  );
}
