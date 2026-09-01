import React from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card border transition-all duration-300 overflow-hidden',
          variant === 'default' && 'bg-surface-card border-border-subtle',
          variant === 'interactive' &&
            'bg-surface-card border-border-subtle hover:-translate-y-1.5 hover:shadow-card-hover hover:border-brand-primary/40 cursor-pointer',
          variant === 'glass' && 'bg-surface/80 backdrop-blur-md border-border-subtle/50',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
