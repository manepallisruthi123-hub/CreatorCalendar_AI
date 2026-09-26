import React from 'react';

export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-slate-800/80 ${variants[variant]} ${className}`}
    />
  );
}

export default Skeleton;
