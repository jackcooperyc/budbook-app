import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}
