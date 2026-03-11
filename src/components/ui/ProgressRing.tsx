import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
    progress: number; // 0 to 100 (percentage)
    size?: number;
    strokeWidth?: number;
    className?: string;
    children?: React.ReactNode;
    /** Tailwind class for the progress stroke, e.g. 'text-orange-500' */
    color?: string;
    /** Tailwind class for the track/background stroke, e.g. 'text-orange-500/20' */
    backgroundColor?: string;
}

export const ProgressRing = ({
    progress,
    size = 256,
    strokeWidth = 8,
    className,
    children,
    color = 'text-primary',
    backgroundColor = 'text-muted/30',
}: ProgressRingProps) => {
    const radius = (size / 2) - (strokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    // progress is 0-100%; convert to fraction for offset
    const fraction = Math.min(Math.max(progress / 100, 0), 1);
    const offset = circumference * (1 - fraction);

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                {/* Background / Track Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={backgroundColor}
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={cn(color, 'transition-all duration-1000 ease-in-out')}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        strokeLinecap: 'round'
                    }}
                />
                {fraction >= 1 && (
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className={cn(color, 'animate-ping opacity-20')}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: 0,
                            strokeLinecap: 'round'
                        }}
                    />
                )}
            </svg>
            <div className="z-10 flex flex-col items-center justify-center">
                {children}
            </div>
        </div>
    );
};

