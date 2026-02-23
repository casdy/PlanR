import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
    progress: number; // 0 to 1
    size?: number;
    strokeWidth?: number;
    className?: string;
    children?: React.ReactNode;
}

export const ProgressRing = ({
    progress,
    size = 256,
    strokeWidth = 8,
    className,
    children
}: ProgressRingProps) => {
    const radius = (size / 2) - (strokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/30"
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-primary transition-all duration-1000 ease-in-out drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        strokeLinecap: 'round'
                    }}
                />
                {progress >= 1 && (
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-primary animate-ping opacity-20"
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
