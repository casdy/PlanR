import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const variants = {
            primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg glow-primary border border-transparent',
            secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80',
            ghost: 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            danger: 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-lg shadow-destructive/20',
            outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10'
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs rounded-lg',
            md: 'h-10 px-4 py-2 rounded-xl',
            lg: 'h-12 px-6 text-lg rounded-2xl',
            icon: 'h-10 w-10 p-2 rounded-full flex items-center justify-center'
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    'relative inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
