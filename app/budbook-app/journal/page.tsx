"use client";

import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, PenLine } from 'lucide-react';
import type { Session } from '@/types/budbook';
import SessionCard from '@/components/SessionCard/SessionCard';
import SessionLogForm from '@/components/SessionLogForm/SessionLogForm';
import EmptyState from '@/components/EmptyState/EmptyState';
import Skeleton from '@/components/Skeleton/Skeleton';
import Button from '@/components/Button/Button';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { useBudbookMock } from '@/hooks/useBudbookMock';
import { productNameById } from '@/lib/budbook-data';
import { getLocalSessions, mergeSessions, saveLocalSession } from '@/lib/journalStorage';
import './journal.css';

function JournalContent() {
  const loading = useSimulatedLoad();
  const { data } = useBudbookMock();
  const searchParams = useSearchParams();
  const showLog = searchParams.get('log') === '1';
  const [panelOpen, setPanelOpen] = useState(showLog);
  const [toast, setToast] = useState<string | null>(null);
  const [localVersion, setLocalVersion] = useState(0);

  const sessions = useMemo(() => {
    if (!data) return [];
    return mergeSessions(data.sessions, getLocalSessions());
  }, [data, localVersion]);

  const handleSave = useCallback(
    (session: Session) => {
      saveLocalSession(session);
      setLocalVersion((v) => v + 1);
      setPanelOpen(false);
      setToast('Session saved to your local journal.');
      setTimeout(() => setToast(null), 2800);
    },
    [],
  );

  if (loading || !data) {
    return (
      <div className="journal-list">
        <Skeleton className="skeleton-row" />
        <Skeleton className="skeleton-row" />
      </div>
    );
  }

  return (
    <div className="journal-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Journal</h2>
          <p className="page-subtitle">
            {sessions.length} sessions · efficacy and pattern recognition
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PenLine size={14} strokeWidth={1.75} />}
          onClick={() => setPanelOpen((v) => !v)}
        >
          Log session
        </Button>
      </header>

      {panelOpen && (
        <SessionLogForm
          products={data.products}
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
            <Button variant="primary" size="sm" onClick={() => setPanelOpen(true)}>
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
              strainName={productNameById(data.products, session.product_id)}
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
