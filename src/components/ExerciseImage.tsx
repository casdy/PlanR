/**
 * @file src/components/ExerciseImage.tsx
 * @description Smart image loader for exercise GIFs fetched from ExerciseDB.
 *
 * Given an exercise name, it fetches the matching GIF URL from ExerciseDB and
 * renders it with a fade-in animation. Shows a spinner while loading and a
 * dumbbell icon fallback if the fetch fails or returns no image.
 *
 * Uses an `isMounted` flag to avoid state updates on unmounted components.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Loader2 } from 'lucide-react';
import { getExerciseByName } from '../services/exerciseDBService';
import { cn } from '../lib/utils';

interface ExerciseImageProps {
  exerciseName: string;
  className?: string;
}

export function ExerciseImage({ exerciseName, className }: ExerciseImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!exerciseName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getExerciseByName(exerciseName)
      .then((exercise) => {
        if (isMounted) {
          setImageUrl(exercise?.gifUrl || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load exercise image", err);
        if (isMounted) {
          setImageUrl(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [exerciseName]);

  if (loading) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-slate-800/50 flex items-center justify-center", className)}>
         <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-slate-800 flex items-center justify-center", className)}>
        <Dumbbell className="w-8 h-8 text-slate-500" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-white flex items-center justify-center p-1 shadow-md group", className)}>
      <motion.img
        key={exerciseName}
        src={imageUrl}
        alt={exerciseName}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none rounded-xl" />
    </div>
  );
}
