"use client";

import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { ThemePreference as ThemePreferenceValue } from '@/lib/theme';
import './ThemePreference.css';

const OPTIONS: {
  value: ThemePreferenceValue;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'light', label: 'Light', icon: <Sun size={16} strokeWidth={1.75} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={16} strokeWidth={1.75} /> },
  { value: 'system', label: 'System', icon: <Monitor size={16} strokeWidth={1.75} /> },
];

export default function ThemePreference() {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div className="theme-preference">
      <div className="theme-preference-header">
        <span className="theme-preference-label">Appearance</span>
        <span className="theme-preference-hint">
          Currently {resolvedTheme === 'dark' ? 'dark' : 'light'}
          {preference === 'system' ? ' (system)' : ''}
        </span>
      </div>
      <div className="theme-preference-options" role="radiogroup" aria-label="Theme preference">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={preference === option.value}
            className={`theme-preference-option ${preference === option.value ? 'theme-preference-option-active' : ''}`}
            onClick={() => setPreference(option.value)}
          >
            <span className="theme-preference-option-icon" aria-hidden="true">
              {option.icon}
            </span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
