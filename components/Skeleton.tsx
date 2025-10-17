import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-slate-200 animate-pulse rounded-md ${className}`} />
);
