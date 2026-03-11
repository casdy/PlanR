import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface SplashScreenProps {
    show: boolean;
    message?: string;
}

export const SplashScreen = ({ show, message }: SplashScreenProps) => {
    const [iconIndex, setIconIndex] = useState(0);
    const { t } = useLanguage();
    
    // Alternation icons: 0 = Gym (Dumbbell), 1 = Nutrition (Veggie Trio)
    const icons = [
        { 
            id: 'gym',
            component: <Dumbbell className="w-12 h-12 text-white" />, 
            color: 'from-primary to-accent', 
            glow: 'bg-primary/20 shadow-primary/40' 
        },
        { 
            id: 'nutrition',
            component: (
                <div className="relative w-full h-full flex items-center justify-center">
                    <motion.span className="text-4xl absolute -left-2 top-0" animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity }}>🥕</motion.span>
                    <motion.span className="text-5xl z-10" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>🥦</motion.span>
                    <motion.span className="text-4xl absolute -right-2 bottom-0" animate={{ rotate: [10, -10, 10] }} transition={{ duration: 2, repeat: Infinity }}>🥬</motion.span>
                </div>
            ), 
            color: 'from-emerald-500 to-teal-400', 
            glow: 'bg-emerald-500/20 shadow-emerald-500/40' 
        }
    ];

    useEffect(() => {
        if (show) {
            const timer = setInterval(() => {
                setIconIndex((prev) => (prev + 1) % icons.length);
            }, 2000); // Slower alternation for better readability
            return () => clearInterval(timer);
        }
    }, [show]);

    const veggieLoaders = ['🥕', '🥦', '🥬', '🥕', '🥦', '🥬'];

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
                >
                    {/* Ambient glow system */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Fun Animated Logo Mark */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, type: 'spring', damping: 20, stiffness: 200 }}
                        className="relative mb-8"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={iconIndex}
                                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 1.2, opacity: 0, rotate: 45 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                className="relative"
                            >
                                {/* Outer glow ring */}
                                <div className={`absolute inset-0 rounded-[2.5rem] ${icons[iconIndex].glow.split(' ')[0]} blur-2xl scale-125 animate-pulse`} />
                                <div className={`relative w-28 h-28 rounded-[2.2rem] bg-gradient-to-br ${icons[iconIndex].color} flex items-center justify-center shadow-2xl ${icons[iconIndex].glow.split(' ')[1]}`}>
                                    {icons[iconIndex].component}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* App name & Vision */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-6xl font-black tracking-tighter mb-1 select-none">
                            Plan<span className="text-primary italic">R</span>
                        </h1>
                        <p className="text-white/40 text-[10px] font-black tracking-[0.4em] uppercase">
                            {t('fitness_fuel_os')}
                        </p>
                    </motion.div>

                    {/* Loading status with VEGGIE progression */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="flex gap-4 items-center h-8">
                            {veggieLoaders.map((veggie, i) => (
                                <motion.div
                                    key={i}
                                    className="text-sm"
                                    animate={{
                                        y: [0, -10, 0],
                                        opacity: [0.3, 1, 0.3],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    {veggie}
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
                                {message || t('initialising')}
                            </p>
                            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                                {t('processing_biometric')}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
