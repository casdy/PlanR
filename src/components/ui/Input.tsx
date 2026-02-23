import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, icon: Icon, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5 text-left">
                {label && (
                    <label className="text-sm font-semibold text-foreground/70 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {Icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
                            <Icon size={18} />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full h-14 bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl px-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-foreground",
                            Icon && "pl-12",
                            error ? "border-destructive focus:ring-destructive/40" : "hover:bg-white/10 dark:hover:bg-slate-900/60",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-medium text-destructive ml-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
