import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary' | 'accent' | 'ai';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
    children, 
    variant = 'default', 
    className 
}) => {
    const variants = {
        default: 'bg-primary text-primary-foreground',
        outline: 'border border-white/10 text-muted-foreground bg-white/5',
        secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        accent: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20',
        ai: 'bg-primary/10 text-primary border border-primary/20 glow-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]'
    };

    return (
        <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-widest',
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};
