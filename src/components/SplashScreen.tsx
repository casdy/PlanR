/**
 * @file src/components/SplashScreen.tsx
 * @description Full-screen animated splash/loading overlay.
 *
 * Shown during initial app boot (controlled by `App.tsx`) and after auth
 * events like sign-in and sign-up. The `show` prop toggles visibility and
 * the component handles its own enter/exit animation via Framer Motion.
 */
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    show: boolean;
    message?: string;
}

export const SplashScreen = ({ show, message = 'Loading...' }: SplashScreenProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background overflow-hidden"
                >
                    {/* Ambient glow background */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>

                    {/* Logo mark */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1, type: 'spring', damping: 18, stiffness: 200 }}
                        className="relative mb-8"
                    >
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 blur-xl scale-110 animate-pulse" />
                        <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/40">
                            <svg
                                viewBox="0 0 48 48"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-12 h-12 text-white"
                            >
                                {/* Dumbbell icon */}
                                <rect x="4" y="21" width="8" height="6" rx="2" fill="currentColor" />
                                <rect x="36" y="21" width="8" height="6" rx="2" fill="currentColor" />
                                <rect x="10" y="17" width="6" height="14" rx="2" fill="currentColor" />
                                <rect x="32" y="17" width="6" height="14" rx="2" fill="currentColor" />
                                <rect x="16" y="22" width="16" height="4" rx="2" fill="currentColor" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* App name */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-5xl font-black tracking-tighter mb-1">
                            Plan<span className="text-primary italic">R</span>
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                            Your Fitness OS
                        </p>
                    </motion.div>

                    {/* Loading indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.45 }}
                        className="flex flex-col items-center gap-4"
                    >
                        {/* Animated bar loader */}
                        <div className="flex gap-1.5 items-end h-6">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-primary rounded-full"
                                    animate={{
                                        height: ['8px', '24px', '8px'],
                                        opacity: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 0.9,
                                        repeat: Infinity,
                                        delay: i * 0.12,
                                        ease: 'easeInOut',
                                    }}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
                            {message}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
