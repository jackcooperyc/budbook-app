import React from 'react';
import './EfficacySlider.css';

interface EfficacySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function EfficacySlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
}: EfficacySliderProps) {
  return (
    <label className="efficacy-slider">
      <div className="efficacy-slider-header">
        <span>{label}</span>
        <span className="efficacy-slider-value meta-numeric">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
