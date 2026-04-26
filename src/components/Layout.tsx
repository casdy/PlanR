/**
 * @file src/components/Layout.tsx
 * @description App shell — wraps all pages with the top header and bottom navigation bar.
 *
 * The header shows the PlanR logo, a dark/light mode toggle, and a user/guest badge.
 * The bottom nav provides tab-bar navigation between Dashboard, Programs, Calendar,
 * History, and Settings. The active tab is highlighted with a pill indicator.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Dumbbell, Settings as SettingsIcon, Home, Activity, Moon, Sun, Calendar, User, Ghost, Leaf, Camera } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { ActiveWorkoutOverlay } from './ActiveWorkoutOverlay';
import { WorkoutSummary } from './WorkoutSummary';
import { useTheme } from '../hooks/useTheme';
import { Toast } from './ui/Toast';
import { useLanguage } from '../hooks/useLanguage';
import { LanguagePicker } from './ui/LanguagePicker';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const location = useLocation();

    const navItems = [
        { label: t('nav_home'), icon: Home, path: '/' },
        { label: t('nav_calendar'), icon: Calendar, path: '/calendar' },
        { label: t('nav_nutrition'), icon: Leaf, path: '/nutrition' },
        { label: t('nav_activity'), icon: Activity, path: '/history' },
        { label: t('nav_profile'), icon: SettingsIcon, path: '/settings' },
    ];

    const isNutritionPage = location.pathname === '/nutrition';

    return (
        <div className={cn(
            "fixed inset-0 flex justify-center transition-colors duration-500",
            theme === 'dark' ? 'bg-zinc-950 dark' : 'bg-zinc-100'
        )}>
            <div className="relative w-full max-w-[430px] h-full bg-background text-foreground font-['Outfit'] flex flex-col shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
            {/* Header - Minimal and clean */}
            <header className="sticky top-0 z-50 glass border-b border-border/40 py-2">
                <div className="w-full max-w-[430px] mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-2xl glow-primary animate-float">
                                <Dumbbell className="w-5 h-5 text-primary-foreground" />
                            </div>
                            {location.pathname === '/nutrition' ? (
                                <div className="flex flex-col -space-y-1.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-foreground italic uppercase">Fuel<span className="not-italic text-teal-500">R</span></h1>
                                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-0.5 whitespace-nowrap">powered by PLANR</span>
                                </div>
                            ) : (
                                <h1 className="text-2xl font-black tracking-tighter text-foreground italic">PLAN<span className="not-italic text-primary">R</span></h1>
                            )}
                        </div>

                    <div className="flex items-center gap-2">
                        <LanguagePicker />

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
                                <Link to="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-white/5">
                                        {user.isGuest ? (
                                            <Ghost className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <User className="w-4 h-4 text-primary" />
                                        )}
                                        <span className="text-xs font-bold whitespace-nowrap hidden sm:inline-block">
                                            {user.isGuest ? t('guest_user') : (user.name || t('athlete'))}
                                        </span>
                                    </div>
                                </Link>
                            ) : (
                                <Link to="/login">
                                    <Button size="sm" className="rounded-2xl px-5">
                                        {t('sign_in')}
                                    </Button>
                                </Link>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content - Mobile spacing focus. Scrollable inner area */}
            <main id="main-scroll-area" className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-32 overflow-y-auto overflow-x-hidden no-scrollbar bg-background shadow-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.40, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>


            {/* Floating Bottom Nav - Optimized for one-hand mobile use */}
            {user && (
                <div className="fixed bottom-6 sm:bottom-8 inset-x-0 mx-auto w-full max-w-[430px] flex justify-center z-50 px-4">
                    <nav className="w-full glass rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl shadow-black/20 flex justify-between items-center h-[4.5rem] px-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center h-[90%] flex-1 transition-all duration-300 rounded-2xl",
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
                                                "w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-all duration-300",
                                                isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : ""
                                            )} 
                                            fill={isActive ? "currentColor" : "none"}
                                        />
                                        
                                        <span className={cn(
                                            "text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-opacity duration-300 text-center",
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
        </div>
    );
};

