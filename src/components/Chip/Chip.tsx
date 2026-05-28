import React from 'react';
import './Chip.css';

interface ChipProps {
  label: string;
  variant?: 'default' | 'indica' | 'sativa' | 'hybrid' | 'low';
}

export default function Chip({ label, variant = 'default' }: ChipProps) {
  return <span className={`chip chip-${variant}`}>{label}</span>;
}
