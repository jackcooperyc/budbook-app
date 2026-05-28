"use client";

import React, { useState } from 'react';
import type { Product, Session } from '@/types/budbook';
import Button from '@/components/Button/Button';
import EfficacySlider from '@/components/EfficacySlider/EfficacySlider';
import { createSessionId } from '@/lib/journalStorage';
import './SessionLogForm.css';

const METHODS = ['Dry Herb Vape', 'Tincture', 'Edible', 'Joint', 'Bong'];

interface SessionLogFormProps {
  products: Product[];
  onSave: (session: Session) => void;
  onCancel: () => void;
}

export default function SessionLogForm({ products, onSave, onCancel }: SessionLogFormProps) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [method, setMethod] = useState(METHODS[0]);
  const [dosage, setDosage] = useState('0.15g');
  const [pairing, setPairing] = useState('');
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(7);
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(4);
  const [anxietyBefore, setAnxietyBefore] = useState(5);
  const [anxietyAfter, setAnxietyAfter] = useState(4);
  const [rating, setRating] = useState(4);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;

    const session: Session = {
      id: createSessionId(),
      date: new Date().toISOString(),
      product_id: productId,
      consumption_method: method,
      dosage,
      pairing_notes: pairing,
      rating,
      mood_before: moodBefore,
      mood_after: moodAfter,
      pain_before: painBefore,
      pain_after: painAfter,
      anxiety_before: anxietyBefore,
      anxiety_after: anxietyAfter,
      effects_felt: [],
      activities: [],
      session_notes: 'Logged locally — pattern recognition will update after sync.',
      session_name: '',
    };
    onSave(session);
  }

  return (
    <form className="session-log-form action-panel" onSubmit={handleSubmit}>
      <h3 className="action-panel-title">Log session</h3>

      <label className="session-log-field">
        <span>Product</span>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.strain_name} ({p.brand})
            </option>
          ))}
        </select>
      </label>

      <div className="session-log-row">
        <label className="session-log-field">
          <span>Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="session-log-field">
          <span>Dosage</span>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="0.15g"
            required
          />
        </label>
      </div>

      <label className="session-log-field">
        <span>Pairing notes (optional)</span>
        <input
          type="text"
          value={pairing}
          onChange={(e) => setPairing(e.target.value)}
          placeholder="Herbal tea, food, caffeine…"
        />
      </label>

      <div className="efficacy-slider-grid">
        <div>
          <p className="efficacy-slider-group-title">Before</p>
          <EfficacySlider label="Mood" value={moodBefore} onChange={setMoodBefore} />
          <EfficacySlider label="Pain" value={painBefore} onChange={setPainBefore} />
          <EfficacySlider label="Anxiety" value={anxietyBefore} onChange={setAnxietyBefore} />
        </div>
        <div>
          <p className="efficacy-slider-group-title">After</p>
          <EfficacySlider label="Mood" value={moodAfter} onChange={setMoodAfter} />
          <EfficacySlider label="Pain" value={painAfter} onChange={setPainAfter} />
          <EfficacySlider label="Anxiety" value={anxietyAfter} onChange={setAnxietyAfter} />
        </div>
      </div>

      <EfficacySlider label="Overall rating" value={rating} onChange={setRating} min={1} max={5} />

      <div className="session-log-actions">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Save session
        </Button>
      </div>
    </form>
  );
}
