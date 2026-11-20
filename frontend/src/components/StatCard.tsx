import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'slate';
  pulse?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  pulse = false
}) => {
  const variantStyles = {
    blue: 'border-sky-500/20 text-sky-400 bg-sky-500/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
    slate: 'border-slate-700/50 text-slate-400 bg-slate-800/40',
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">{title}</span>
        <div className={`p-2.5 rounded-lg border ${variantStyles[variant]} ${pulse ? 'animate-pulse' : ''}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-mono text-white tracking-tight">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
