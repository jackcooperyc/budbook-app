import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/** Pacs.MT mark — scanner frame with Montana-green accent. */
export default function Logo({
  size = 36,
  showWordmark = false,
  className = '',
}: LogoProps) {
  return (
    <span className={`logo ${className}`.trim()}>
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect className="logo-mark-bg" width="36" height="36" rx="10" />
        {/* Scanner corners */}
        <path
          className="logo-mark-leaf"
          d="M9 12V10h4M27 12V10h-4M9 24v2h4M27 24v2h-4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Scan line */}
        <path className="logo-mark-spine" d="M11 18h14" strokeWidth="1.5" strokeLinecap="round" />
        {/* Package / cert mark */}
        <rect
          className="logo-mark-book"
          x="13"
          y="13"
          width="10"
          height="10"
          rx="1.5"
          strokeWidth="1.4"
        />
      </svg>
      {showWordmark && <span className="logo-wordmark">Pacs.MT</span>}
    </span>
  );
}
