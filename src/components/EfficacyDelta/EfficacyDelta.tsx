import React from 'react';
import './EfficacyDelta.css';

interface EfficacyDeltaProps {
  moodBefore: number;
  moodAfter: number;
  painBefore: number;
  painAfter: number;
  anxietyBefore: number;
  anxietyAfter: number;
}

function Metric({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) {
  const delta = after - before;
  const improved = label === 'Pain' || label === 'Anxiety' ? delta < 0 : delta > 0;

  return (
    <div className="efficacy-metric">
      <span className="efficacy-label">{label}</span>
      <div className="efficacy-bars">
        <span className="efficacy-bar efficacy-bar-before" style={{ width: `${before * 10}%` }} />
        <span
          className={`efficacy-bar efficacy-bar-after ${improved ? 'efficacy-bar-good' : 'efficacy-bar-neutral'}`}
          style={{ width: `${after * 10}%` }}
        />
      </div>
      <span className={`efficacy-delta meta-numeric ${improved ? 'efficacy-delta-good' : ''}`}>
        {delta > 0 ? '+' : ''}
        {delta}
      </span>
    </div>
  );
}

export default function EfficacyDelta(props: EfficacyDeltaProps) {
  return (
    <div className="efficacy-delta-panel">
      <Metric label="Mood" before={props.moodBefore} after={props.moodAfter} />
      <Metric label="Pain" before={props.painBefore} after={props.painAfter} />
      <Metric label="Anxiety" before={props.anxietyBefore} after={props.anxietyAfter} />
    </div>
  );
}
