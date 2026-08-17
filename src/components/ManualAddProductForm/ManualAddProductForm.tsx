"use client";

import React, { useState } from 'react';
import type { Product } from '@/types/pacs';
import Button from '@/components/Button/Button';
import './ManualAddProductForm.css';

interface ManualAddProductFormProps {
  onSave: (input: {
    strain: string;
    brand?: string;
    type: Product['type'];
    thc: number;
    cbd: number;
    quantity: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ManualAddProductForm({ onSave, onCancel }: ManualAddProductFormProps) {
  const [strain, setStrain] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<Product['type']>('hybrid');
  const [thc, setThc] = useState('22');
  const [cbd, setCbd] = useState('0.5');
  const [quantity, setQuantity] = useState('3.5');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!strain.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        strain: strain.trim(),
        brand: brand.trim() || undefined,
        type,
        thc: parseFloat(thc) || 0,
        cbd: parseFloat(cbd) || 0,
        quantity: parseFloat(quantity) || 3.5,
      });
    } catch {
      setError('Could not save product.');
      setSaving(false);
    }
  }

  return (
    <form className="manual-add-form action-panel" onSubmit={handleSubmit}>
      <h3 className="action-panel-title">Add product manually</h3>

      <label className="manual-add-field">
        <span>Strain name</span>
        <input
          type="text"
          value={strain}
          onChange={(e) => setStrain(e.target.value)}
          placeholder="Wedding Cake"
          required
        />
      </label>

      <div className="manual-add-row">
        <label className="manual-add-field">
          <span>Brand</span>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="manual-add-field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as Product['type'])}>
            <option value="indica">Indica</option>
            <option value="sativa">Sativa</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
      </div>

      <div className="manual-add-row">
        <label className="manual-add-field">
          <span>THC %</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={thc}
            onChange={(e) => setThc(e.target.value)}
            required
          />
        </label>
        <label className="manual-add-field">
          <span>CBD %</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={cbd}
            onChange={(e) => setCbd(e.target.value)}
            required
          />
        </label>
        <label className="manual-add-field">
          <span>Quantity (g)</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
      </div>

      {error && <p className="manual-add-error">{error}</p>}

      <div className="manual-add-actions">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Add to stash'}
        </Button>
      </div>
    </form>
  );
}
