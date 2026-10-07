import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const borderStyles = {
    default: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700',
    success: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/40',
    danger: 'border-rose-200 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/5 hover:border-rose-300 dark:hover:border-rose-500/40',
    info: 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/40',
  }[variant];

  const valueStyles = {
    default: 'text-slate-900 dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-rose-600 dark:text-rose-400',
    info: 'text-indigo-600 dark:text-indigo-400',
  }[variant];

  return (
    <div className={`p-5 rounded-2xl border ${borderStyles} backdrop-blur-sm shadow-xs dark:shadow-none transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold tracking-tight ${valueStyles}`}>{value}</span>
        {subtitle && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>}
      </div>
    </div>
  );
};
