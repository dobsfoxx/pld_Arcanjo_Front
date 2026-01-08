import * as React from 'react';
import { cn } from '../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loading?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
    primary:
        'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus-visible:ring-slate-500',
    secondary:
        'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-500',
    outline:
        'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-500',
    success:
        'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 focus-visible:ring-emerald-500',
    danger:
        'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus-visible:ring-red-500',
    ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-500',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm min-h-[34px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-base min-h-[46px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            fullWidth,
            leftIcon,
            rightIcon,
            children,
            disabled,
            loading,
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap',
                    'transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                    VARIANT_STYLES[variant],
                    SIZE_STYLES[size],
                    fullWidth && 'w-full',
                    className,
                )}
                disabled={disabled || loading}
                aria-busy={loading}
                aria-disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : leftIcon ? (
                    <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
                ) : null}
                <span className="min-w-0">{children}</span>
                {!loading && rightIcon ? <span className="shrink-0" aria-hidden="true">{rightIcon}</span> : null}
            </button>
        );
    },
);

Button.displayName = 'Button';