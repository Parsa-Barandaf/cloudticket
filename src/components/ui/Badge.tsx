import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  info: 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
