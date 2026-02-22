import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Dumbbell, Calendar, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { ActiveWorkoutOverlay } from './ActiveWorkoutOverlay';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout, signInWithGoogle } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: 'Workouts', icon: Dumbbell, path: '/' },
        { label: 'History', icon: Calendar, path: '/history' },
        { label: 'Manage', icon: Settings, path: '/manage' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-slate-950 dark:text-gray-100 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">JUUK</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {user ? (
                            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                                <LogOut className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button size="sm" onClick={signInWithGoogle}>
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
                {children}
            </main>

            {/* Bottom Nav (Mobile Only) */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 dark:bg-slate-950 dark:border-gray-800 z-50 md:hidden pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive
                                        ? "text-blue-600 dark:text-blue-500"
                                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
            <ActiveWorkoutOverlay />
        </div>
    );
};
