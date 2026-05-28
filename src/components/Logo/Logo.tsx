import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

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
        <path
          className="logo-mark-book"
          d="M10 10h8v16H10c-1.1 0-2-.9-2-2V12c0-1.1.9-2 2-2zm10 0h6c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-6V10z"
        />
        <path
          className="logo-mark-leaf"
          d="M24 8c2 3 2.5 6.5 1 9.5-1.2 2.3-3.8 3.8-6.5 3.5 2.8-.8 4.8-3.2 5.2-6 0 0 1.2-3.2-.7-7z"
        />
        <path className="logo-mark-spine" d="M18 10v16" strokeWidth="1.2" />
      </svg>
      {showWordmark && <span className="logo-wordmark">BudBook</span>}
    </span>
  );
}
