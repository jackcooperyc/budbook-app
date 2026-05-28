import React from 'react';
import type { Session } from '@/types/budbook';
import EfficacyDelta from '@/components/EfficacyDelta/EfficacyDelta';
import Chip from '@/components/Chip/Chip';
import './SessionCard.css';

interface SessionCardProps {
  session: Session;
  strainName: string;
}

export default function SessionCard({ session, strainName }: SessionCardProps) {
  const date = new Date(session.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="session-card glass-panel">
      <div className="session-card-header">
        <div>
          <h3 className="session-card-strain">{strainName}</h3>
          <p className="session-card-meta">
            {date} · {session.consumption_method} · {session.dosage}
          </p>
        </div>
        <Chip label={`${session.rating}★`} />
      </div>
      <EfficacyDelta
        moodBefore={session.mood_before}
        moodAfter={session.mood_after}
        painBefore={session.pain_before}
        painAfter={session.pain_after}
        anxietyBefore={session.anxiety_before}
        anxietyAfter={session.anxiety_after}
      />
      {session.session_notes && (
        <p className="session-card-notes">{session.session_notes}</p>
      )}
    </article>
  );
}
