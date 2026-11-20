import React from 'react';
import { LogLevel } from '../types';

interface StatusBadgeProps {
  level?: LogLevel | string;
  status?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ level, status, size = 'sm' }) => {
  const value = (level || status || '').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (value === 'INFO') {
    styles = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  } else if (value === 'DEBUG') {
    styles = 'bg-slate-700/20 text-slate-400 border-slate-700';
  } else if (value === 'WARNING' || value === 'DEGRADED') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (value === 'ERROR') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (value === 'CRITICAL') {
    styles = 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse';
  } else if (value === 'OPERATIONAL' || value === 'HEALTHY' || value === 'ACTIVE') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (value === 'ACKNOWLEDGED') {
    styles = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  return (
    <span className={`inline-flex items-center rounded-md font-mono border ${px} ${styles}`}>
      {value}
    </span>
  );
};
