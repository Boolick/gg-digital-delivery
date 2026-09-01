import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-elevated/60',
        variant === 'rectangular' && 'rounded-card',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-btn w-3/4',
        className,
      )}
      {...props}
    />
  );
};
