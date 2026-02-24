import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { thumbnailService } from '../services/thumbnailService';
import { cn } from '../lib/utils';

interface ExerciseImageProps {
  exerciseName: string;
  className?: string;
}

export function ExerciseImage({ exerciseName, className }: ExerciseImageProps) {
  // Synchronous and deterministic SVG generation
  const svgDataUrl = useMemo(() => {
    if (!exerciseName) return null;
    return thumbnailService.generateSvg(exerciseName);
  }, [exerciseName]);

  if (!svgDataUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-slate-800 flex items-center justify-center", className)}>
        <Dumbbell className="w-8 h-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-900 shadow-md group", className)}>
      <motion.img
        key={exerciseName}
        src={svgDataUrl}
        alt={exerciseName}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
