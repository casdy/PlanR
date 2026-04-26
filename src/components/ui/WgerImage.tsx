import { useState, useEffect } from 'react';
import { Loader2, Dumbbell } from 'lucide-react';
import { getExerciseByName, getExerciseImageUrl } from '../../services/wgerService';
import { cn } from '../../lib/utils';

interface WgerImageProps {
    exerciseName: string;
    className?: string;
    iconClassName?: string;
}

export const WgerImage = ({ exerciseName, className, iconClassName }: WgerImageProps) => {
    const [mediaUrl, setMediaUrl] = useState<string>('');
    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsMediaLoading(true);
        setImageError(false);

        getExerciseByName(exerciseName).then((exercise) => {
            if (isMounted) {
                setMediaUrl(exercise ? getExerciseImageUrl(exercise) : '');
                setIsMediaLoading(false);
            }
        }).catch(() => {
            if (isMounted) setIsMediaLoading(false);
        });

        return () => { isMounted = false; };
    }, [exerciseName]);

    if (isMediaLoading) {
        return (
            <div className={cn("w-full h-full flex items-center justify-center", className)}>
                <Loader2 className={cn("w-6 h-6 text-muted-foreground/30 animate-spin", iconClassName)} />
            </div>
        );
    }

    if (mediaUrl && !imageError) {
        return (
            <img 
                src={mediaUrl} 
                alt={exerciseName} 
                className={cn("w-full h-full object-contain drop-shadow-sm rounded-lg", className)}
                loading="lazy"
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div className={cn("w-full h-full flex items-center justify-center", className)}>
            <Dumbbell className={cn("w-8 h-8 text-zinc-400", iconClassName)} />
        </div>
    );
};
