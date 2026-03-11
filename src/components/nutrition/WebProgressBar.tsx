import React from 'react';
import { motion } from 'framer-motion';
import { useNutritionTheme } from './WebTheme';

interface WebProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export const WebProgressBar: React.FC<WebProgressBarProps> = ({ label, current, target, color, unit = 'g' }) => {
  const { theme } = useNutritionTheme();
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="text-xs font-medium text-zinc-400">
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};
