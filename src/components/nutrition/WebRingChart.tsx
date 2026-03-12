import React from 'react';
import { motion } from 'framer-motion';
import { useNutritionTheme } from './WebTheme';
import { useLanguage } from '../../hooks/useLanguage';

interface WebRingChartProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const WebRingChart: React.FC<WebRingChartProps> = ({ 
  current, 
  target, 
  size = 180, 
  strokeWidth = 12 
}) => {
  const { theme } = useNutritionTheme();
  const { t } = useLanguage();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference - (percentage * circumference);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.calories}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">{t('remaining_label')}</span>
        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none my-0.5">
          {Math.max(0, target - current)}
        </span>
        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-500 uppercase">{t('kcal')}</span>
      </div>
    </div>
  );
};
