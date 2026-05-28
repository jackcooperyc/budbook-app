import React from 'react';
import './Avatar.css';
import { getStrainHue } from '@/lib/media';

interface AvatarProps {
  name: string;
  seed: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function Avatar({ name, seed, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = getStrainHue(seed);

  return (
    <span
      className={`avatar avatar-${size}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 42%, 42%), hsl(${hue + 20}, 38%, 28%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
