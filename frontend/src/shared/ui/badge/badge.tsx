import React from 'react';
import { cn } from '../../lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  pulse?: boolean;
}

const variantStyles = {
  info: 'bg-brand-primary/15 text-brand-primary border-brand-primary/30',
  success: 'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
  warning: 'bg-brand-warning/15 text-brand-warning border-brand-warning/30',
  danger: 'bg-brand-danger/15 text-brand-danger border-brand-danger/30',
  neutral: 'bg-surface-elevated text-text-secondary border-border-subtle',
};

const pulseColors = {
  info: 'bg-brand-primary',
  success: 'bg-brand-accent',
  warning: 'bg-brand-warning',
  danger: 'bg-brand-danger',
  neutral: 'bg-text-secondary',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'info',
  pulse = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-badge border transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              pulseColors[variant],
            )}
          />
          <span className={cn('relative inline-flex rounded-full h-2 w-2', pulseColors[variant])} />
        </span>
      )}
      {children}
    </div>
  );
};
