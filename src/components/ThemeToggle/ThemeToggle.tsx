"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  /** Compact icon-only control for the header */
  variant?: 'icon' | 'labeled';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleResolved } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      className={`theme-toggle ${variant === 'labeled' ? 'theme-toggle-labeled' : ''} ${className}`.trim()}
      onClick={toggleResolved}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
      </span>
      {variant === 'labeled' && (
        <span className="theme-toggle-label">{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  );
}
