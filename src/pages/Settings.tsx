/**
 * @file src/pages/Settings.tsx
 * @description User settings page.
 *
 * Sections:
 *  - Profile — displays the logged-in user's name and email.
 *  - Workout Preferences — rest durations, weight units, auto-advance toggles.
 *  - App Settings — dark mode toggle, notifications, haptics.
 *  - Data Management — export data, reset app.
 *  - Danger Zone — Log Out and full data reset buttons.
 *
 * Settings are persisted to localStorage via `planr-settings` key.
 */
import * as React from 'react';
import { User, Bell, Shield, Moon, LogOut, ChevronRight, Download, RefreshCcw, Activity, Play, Sun, Vibrate, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';

type SettingsItemType = {
    icon: React.ElementType;
    label: string;
    value?: string;
    action?: () => void;
    isToggle?: boolean;
    active?: boolean;
};

type SettingsSection = {
    title: string;
    items: SettingsItemType[];
};

export const SettingsPage = () => {
    const { user, logout, resetApp } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    // State Hooks for various settings
    const [soundsEnabled, setSoundsEnabled] = React.useState(() => localStorage.getItem('planr-sounds') !== 'false');
    const [autoAdvance, setAutoAdvance] = React.useState(() => localStorage.getItem('planr-auto-advance') !== 'false');
    const [restTimer, setRestTimer] = React.useState(() => localStorage.getItem('planr-rest-timer') || '60s');
    const [reduceMotion, setReduceMotion] = React.useState(() => localStorage.getItem('planr-reduce-motion') === 'true');
    const [hapticFeedback, setHapticFeedback] = React.useState(() => localStorage.getItem('planr-haptics') !== 'false');
    const [voiceNav, setVoiceNav] = React.useState(() => localStorage.getItem('planr-voice-nav') === 'true');

    // Toggles
    const toggleSetting = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter(prev => {
            const next = !prev;
            localStorage.setItem(key, String(next));
            return next;
        });
    };

    const cycleRestTimer = () => {
        const options = ['30s', '60s', '90s', '120s'];
        const currentIndex = options.indexOf(restTimer);
        const nextIndex = (currentIndex + 1) % options.length;
        const nextValue = options[nextIndex];
        
        setRestTimer(nextValue);
        localStorage.setItem('planr-rest-timer', nextValue);
    };

    // Export Data Mock
    const handleExport = () => {
        // In a real app, this would generate a JSON/CSV of workout history
        alert("Workout data export initiated. Check your downloads folder shortly.");
    };

    const sections: SettingsSection[] = [
        {
            title: 'Account',
            items: [
                { icon: User, label: 'Profile Information', value: user?.name || (user?.isGuest ? 'Guest User' : 'Athlete') },
                { icon: Bell, label: 'Notifications', value: 'Enabled', action: () => alert("Notification settings (Coming Soon)") },
            ]
        },
        {
            title: 'Workout Preferences',
            items: [
                { 
                    icon: Play, 
                    label: 'Auto-Advance Exercises', 
                    value: autoAdvance ? 'On' : 'Off',
                    action: () => toggleSetting('planr-auto-advance', setAutoAdvance),
                    isToggle: true,
                    active: autoAdvance
                },
                { 
                    icon: Activity, 
                    label: 'Default Rest Timer', 
                    value: restTimer,
                    action: cycleRestTimer
                },
                { 
                    icon: Bell, 
                    label: 'Workout Sounds', 
                    value: soundsEnabled ? 'On' : 'Off',
                    action: () => toggleSetting('planr-sounds', setSoundsEnabled),
                    isToggle: true,
                    active: soundsEnabled
                },
                { 
                    icon: Sparkles, 
                    label: 'Voice Navigation (Groq)', 
                    value: voiceNav ? 'On' : 'Off',
                    action: () => toggleSetting('planr-voice-nav', setVoiceNav),
                    isToggle: true,
                    active: voiceNav
                }
            ]
        },
        {
            title: 'App Settings',
            items: [
                { 
                    icon: theme === 'dark' ? Moon : Sun, 
                    label: 'Dark Mode', 
                    value: theme === 'dark' ? 'On' : 'Off',
                    action: toggleTheme,
                    isToggle: true,
                    active: theme === 'dark'
                },
                { 
                    icon: Vibrate, 
                    label: 'Haptic Feedback', 
                    value: hapticFeedback ? 'On' : 'Off',
                    action: () => toggleSetting('planr-haptics', setHapticFeedback),
                    isToggle: true,
                    active: hapticFeedback
                },
                { 
                    icon: Shield, 
                    label: 'Reduce Motion', 
                    value: reduceMotion ? 'On' : 'Off',
                    action: () => toggleSetting('planr-reduce-motion', setReduceMotion),
                    isToggle: true,
                    active: reduceMotion
                },
            ]
        },
        {
            title: 'Data Management',
            items: [
                { 
                    icon: Download, 
                    label: 'Export Workout Data',
                    action: handleExport
                },
            ]
        }
    ];

    return (
        <div className="space-y-8 pb-36">
            <header>
                <h1 className="text-4xl font-black tracking-tighter">Settings</h1>
                <p className="text-muted-foreground font-medium">Manage your app experience & data</p>
            </header>

            <div className="space-y-8">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">
                            {section.title}
                        </h3>
                        <Card className="glass border-white/10 dark:border-white/5 rounded-[2rem] overflow-hidden">
                            <CardContent className="p-0">
                                {section.items.map((item, idx) => (
                                    <button
                                        key={item.label}
                                        onClick={item.action}
                                        className={`w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors ${
                                            idx !== section.items.length - 1 ? 'border-b border-white/5' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold">{item.label}</p>
                                                {item.value && (
                                                    <p className="text-xs text-muted-foreground font-medium">
                                                        {item.value}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Dynamic Right Side Icon/Toggle */}
                                        {item.isToggle ? (
                                            <div className={cn(
                                                "w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300",
                                                item.active ? "bg-primary" : "bg-white/10"
                                            )}>
                                                <div className={cn(
                                                    "bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300",
                                                    item.active ? "transform translate-x-6" : ""
                                                )} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-muted-foreground">
                                                {item.value && !item.action && <span className="text-sm font-semibold mr-2">{item.value}</span>}
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ))}

                <Card className="glass border-destructive/20 rounded-[2rem] overflow-hidden bg-destructive/5 mt-12">
                     <CardContent className="p-0">
                         <button 
                             onClick={logout}
                             className="w-full flex items-center justify-center p-5 hover:bg-destructive/10 transition-colors text-destructive font-bold gap-2 border-b border-destructive/10"
                         >
                             <LogOut className="w-5 h-5" />
                             Sign Out
                         </button>
                         <button 
                             onClick={() => {
                                 if (confirm('DANGER AREA: Are you sure you want to WIPE ALL APP DATA? This will delete all users and history and cannot be undone.')) {
                                     resetApp();
                                 }
                             }}
                             className="w-full flex items-center justify-center p-5 hover:bg-destructive/10 transition-colors text-destructive/50 hover:text-destructive font-black uppercase text-xs tracking-widest gap-2"
                         >
                             <RefreshCcw className="w-4 h-4" />
                             Reset App Data
                         </button>
                     </CardContent>
                </Card>
            </div>
        </div>
    );
};
