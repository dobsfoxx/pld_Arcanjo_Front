import * as React from 'react';
import { cn } from '../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
    primary:
        'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400',
    secondary:
        'bg-slate-700 text-white hover:bg-slate-800 focus-visible:ring-slate-400',
    outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
    success:
        'bg-emerald-900 text-white hover:bg-emerald-800 focus-visible:ring-emerald-300',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:py-2.5',
    lg: 'px-4 py-2.5 text-sm sm:px-5 sm:py-3',
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
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    VARIANT_STYLES[variant],
                    SIZE_STYLES[size],
                    fullWidth && 'w-full',
                    className,
                )}
                disabled={disabled}
                {...props}
            >
                {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
                <span className="min-w-0">{children}</span>
                {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
            </button>
        );
    },
);

Button.displayName = 'Button';