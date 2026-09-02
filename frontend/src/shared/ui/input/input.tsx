import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, className, error, success, leftIcon, rightIcon, helperText, disabled, id, ...props },
    ref,
  ) => {
    const inputId =
      id || (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-11 bg-surface-card text-text-primary placeholder:text-text-muted text-sm rounded-input border transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              error && 'border-brand-danger focus:ring-brand-danger/30',
              !error && success && 'border-brand-accent focus:ring-brand-accent/30',
              !error &&
                !success &&
                'border-border-subtle hover:border-slate-700 focus:border-brand-primary focus:ring-brand-primary/30',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-text-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'text-xs px-1',
              error ? 'text-brand-danger font-medium' : 'text-text-muted',
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
