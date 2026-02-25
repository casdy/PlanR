/**
 * @file src/components/Layout.tsx
 * @description App shell — wraps all pages with the top header and bottom navigation bar.
 *
 * The header shows the PlanR logo, a dark/light mode toggle, and a user/guest badge.
 * The bottom nav provides tab-bar navigation between Dashboard, Programs, Calendar,
 * History, and Settings. The active tab is highlighted with a pill indicator.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Dumbbell, Settings as SettingsIcon, Home, Activity, Moon, Sun, Calendar, User, Ghost } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { ActiveWorkoutOverlay } from './ActiveWorkoutOverlay';
import { WorkoutSummary } from './WorkoutSummary';
import { useTheme } from '../hooks/useTheme';
import { Toast } from './ui/Toast';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const navItems = [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Calendar', icon: Calendar, path: '/calendar' },
        { label: 'Programs', icon: Dumbbell, path: '/manage' },
        { label: 'Activity', icon: Activity, path: '/history' },
        { label: 'Profile', icon: SettingsIcon, path: '/settings' },
    ];

    return (
        <div className={cn(
            "min-h-screen bg-background text-foreground transition-all duration-700 flex flex-col font-['Outfit']",
            theme === 'dark' ? 'dark' : ''
        )}>
            {/* Header - Minimal and clean */}
            <header className="sticky top-0 z-50 glass border-b border-border/40 py-2">
                <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="bg-primary p-2 rounded-2xl glow-primary animate-float">
                            <Dumbbell className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground italic">PLAN<span className="text-primary not-italic">R</span></h1>
                    </motion.div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleTheme} 
                            className="rounded-2xl bg-secondary/50"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>

                        {!authLoading && (
                            user ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-white/5">
                                        {user.isGuest ? (
                                            <Ghost className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <User className="w-4 h-4 text-primary" />
                                        )}
                                        <span className="text-xs font-bold whitespace-nowrap hidden sm:inline-block">
                                            {user.isGuest ? 'Guest User' : (user.name || 'Athlete')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/login">
                                    <Button size="sm" className="rounded-2xl px-5">
                                        Sign In
                                    </Button>
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content - Mobile spacing focus */}
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Bottom Nav - Optimized for one-hand mobile use */}
            {user && (
                <div className="fixed bottom-8 inset-x-0 flex justify-center z-50 px-6">
                    <nav className="w-full max-w-md glass rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-black/20 flex justify-around items-center h-20 px-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center h-full px-4 transition-all duration-300 rounded-2xl",
                                        isActive ? "text-primary active:scale-95" : "text-muted-foreground hover:text-foreground active:scale-90"
                                    )}
                                >
                                    {/* Active Background Pill */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-bg"
                                            className="absolute inset-0 bg-primary/10 rounded-2xl"
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}

                                    <div className="relative z-10 flex flex-col items-center justify-center">
                                        <Icon 
                                            className={cn(
                                                "w-6 h-6 mb-1 transition-all duration-300",
                                                isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : ""
                                            )} 
                                            fill={isActive ? "currentColor" : "none"}
                                        />
                                        
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest transition-opacity duration-300",
                                            isActive ? "opacity-100" : "opacity-40"
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
            <ActiveWorkoutOverlay />
            <WorkoutSummary onRestart={() => window.location.href = '/'} />
            <Toast />
        </div>
    );
};
