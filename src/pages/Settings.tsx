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
import { User, Bell, Shield, Moon, LogOut, ChevronRight, Download, RefreshCcw, Activity, Play, Sun, Vibrate, Sparkles, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useAppPermissions } from '../hooks/useAppPermissions';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { PopoverTooltip } from '../components/ui/Tooltip';
import { Capacitor } from '@capacitor/core';
import { sync } from '@capacitor/live-updates';

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
    const { user, logout, resetApp, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [lastSync, setLastSync] = React.useState<string | null>(localStorage.getItem('planr_last_calendar_sync'));
    
    const { 
        dailyMotivationEnabled, setDailyMotivationEnabled,
        recoveryCheckInEnabled, setRecoveryCheckInEnabled,
        weeklyMeasurementReminderEnabled, setWeeklyMeasurementReminderEnabled,
        workoutReminderTime, setWorkoutReminderTime,
        seriousMode, setSeriousMode,
        primaryFitnessGoal, setPrimaryFitnessGoal,
        soundsEnabled, setSoundsEnabled,
        autoAdvance, setAutoAdvance,
        restTimer, setRestTimer,
        reduceMotion, setReduceMotion,
        hapticFeedback, setHapticFeedback,
    } = useSettingsStore();

    const [isCheckingUpdates, setIsCheckingUpdates] = React.useState(false);
    const [appVersion, setAppVersion] = React.useState('1.0.0');

    React.useEffect(() => {
        // In a real app, you might use @capacitor/app to get the native version
        setAppVersion('1.0.1+52');
    }, []);

    const handleCheckUpdate = async () => {
        if (!Capacitor.isNativePlatform()) {
            alert("Live Updates are only available in the native mobile app.");
            return;
        }
        try {
            setIsCheckingUpdates(true);
            const result = await sync();
            if (result.snapshot) {
                alert("A new update has been downloaded and will be applied on the next launch!");
            } else {
                alert("Your app is up to date.");
            }
        } catch (err) {
            console.error("Live Update Error:", err);
            alert("Check failed: " + (err as Error).message);
        } finally {
            setIsCheckingUpdates(false);
        }
    };

    const { requestNotificationPermission, requestCalendarPermission } = useAppPermissions();

    // Trigger notification rescheduling whenever preferences change
    React.useEffect(() => {
        const schedule = async () => {
            const { scheduleWeeklyNotifications } = await import('../engine/notificationEngine');
            await scheduleWeeklyNotifications({
                dailyMotivationEnabled,
                recoveryCheckInEnabled,
                weeklyMeasurementReminderEnabled,
                workoutReminderTime,
                seriousMode
            }, primaryFitnessGoal);
        };
        schedule();
    }, [dailyMotivationEnabled, recoveryCheckInEnabled, weeklyMeasurementReminderEnabled, workoutReminderTime, seriousMode, primaryFitnessGoal]);

    // Toggles
    const toggleSetting = (setter: (enabled: boolean) => void, currentValue: boolean) => {
        setter(!currentValue);
    };

    const cycleRestTimer = () => {
        const options = ['30s', '60s', '90s', '120s'];
        const currentIndex = options.indexOf(restTimer);
        const nextIndex = (currentIndex + 1) % options.length;
        const nextValue = options[nextIndex];
        
        setRestTimer(nextValue);
    };

    const handleExport = () => {
        try {
            const data: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    try {
                        const val = localStorage.getItem(key);
                        data[key] = val ? JSON.parse(val) : null;
                    } catch {
                        data[key] = localStorage.getItem(key);
                    }
                }
            }
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.body.appendChild(document.createElement('a'));
            link.href = url;
            link.download = `planr-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert("Data exported successfully! Check your downloads.");
        } catch (err) {
            alert("Export failed: " + (err as Error).message);
        }
    };

    const sections: SettingsSection[] = [
        {
            title: t('account'),
            items: [
                { 
                    icon: User, 
                    label: t('profile_information'), 
                    value: authLoading ? undefined : (user?.name || (user?.isGuest ? t('guest_user') : t('athlete'))) 
                },
            ]
        },
        {
            title: t('notifications_calendar'),
            items: [
                { 
                    icon: Bell, 
                    label: t('daily_motivation'), 
                    value: dailyMotivationEnabled ? t('on') : t('off'),
                    action: async () => {
                        if (!dailyMotivationEnabled) {
                            const granted = await requestNotificationPermission();
                            if (!granted) return;
                        }
                        setDailyMotivationEnabled(!dailyMotivationEnabled);
                    },
                    isToggle: true,
                    active: dailyMotivationEnabled
                },
                { 
                    icon: Activity, 
                    label: t('recovery_checkins'), 
                    value: recoveryCheckInEnabled ? t('on') : t('off'),
                    action: () => setRecoveryCheckInEnabled(!recoveryCheckInEnabled),
                    isToggle: true,
                    active: recoveryCheckInEnabled,
                    // Note: We'll add the tooltip in the rendering loop below for list items if needed, 
                    // but for now let's just use it where we can.
                },
                { 
                    icon: Sparkles, 
                    label: t('weekly_measurements'), 
                    value: weeklyMeasurementReminderEnabled ? t('on') : t('off'),
                    action: () => setWeeklyMeasurementReminderEnabled(!weeklyMeasurementReminderEnabled),
                    isToggle: true,
                    active: weeklyMeasurementReminderEnabled
                },
                {
                    icon: Clock,
                    label: t('workout_reminder_time'),
                    value: workoutReminderTime,
                    action: () => {
                        const newTime = prompt("Enter reminder time (e.g., 17:30):", workoutReminderTime);
                        if (newTime) setWorkoutReminderTime(newTime);
                    }
                },
                {
                    icon: Sparkles,
                    label: "Serious Mode",
                    value: seriousMode ? "High Intensity" : "Balanced",
                    action: () => setSeriousMode(!seriousMode),
                    isToggle: true,
                    active: seriousMode
                },
                { 
                    icon: Shield, 
                    label: "Primary Goal", 
                    value: primaryFitnessGoal === 'fat_loss' ? 'Fat Loss' : 'Muscle Gain',
                    action: () => setPrimaryFitnessGoal(primaryFitnessGoal === 'fat_loss' ? 'muscle_gain' : 'fat_loss')
                },
                { 
                    icon: CalendarIcon, 
                    label: t('sync_to_calendar'), 
                    value: isSyncing ? "Syncing..." : (lastSync ? `Last Sync: ${lastSync}` : undefined),
                    action: async () => {
                        const granted = await requestCalendarPermission();
                        if (granted) {
                            try {
                                setIsSyncing(true);
                                const { syncWorkoutSplitToCalendar } = await import('../engine/calendarEngine');
                                const { LocalService } = await import('../services/localService');
                                const { activeProgramId } = useWorkoutStore.getState();
                                
                                let split = [
                                    { title: 'Morning Mobility', dayIndex: 1 },
                                    { title: 'Strength Training', dayIndex: 3 },
                                    { title: 'Active Recovery', dayIndex: 6 },
                                ];

                                if (activeProgramId) {
                                    const program = LocalService.getProgramById(activeProgramId);
                                    if (program && program.schedule) {
                                        split = program.schedule.map((day: any, idx: number) => ({
                                            title: day.title,
                                            dayIndex: idx + 1 
                                        }));
                                    }
                                }

                                await syncWorkoutSplitToCalendar(split);
                                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                setLastSync(now);
                                localStorage.setItem('planr_last_calendar_sync', now);
                                alert("Workouts synced to native calendar!");
                            } catch (err) {
                                alert("Failed to sync: " + (err as Error).message);
                            } finally {
                                setIsSyncing(false);
                            }
                        } else {
                            if (Capacitor.isNativePlatform()) {
                                alert("Calendar permission denied.");
                            } else {
                                alert("Calendar sync is only available on native mobile devices.");
                            }
                        }
                    }
                }
            ]
        },
        {
            title: t('workout_preferences'),
            items: [
                { 
                    icon: Play, 
                    label: t('auto_advance'), 
                    value: autoAdvance ? t('on') : t('off'),
                    action: () => toggleSetting(setAutoAdvance, autoAdvance),
                    isToggle: true,
                    active: autoAdvance
                },
                { 
                    icon: Activity, 
                    label: t('default_rest_timer'), 
                    value: restTimer,
                    action: cycleRestTimer
                },
                { 
                    icon: Bell, 
                    label: t('workout_sounds'), 
                    value: soundsEnabled ? t('on') : t('off'),
                    action: () => toggleSetting(setSoundsEnabled, soundsEnabled),
                    isToggle: true,
                    active: soundsEnabled
                }
            ]
        },
        {
            title: t('app_settings'),
            items: [
                { 
                    icon: theme === 'dark' ? Moon : Sun, 
                    label: t('dark_mode'), 
                    value: theme === 'dark' ? t('on') : t('off'),
                    action: toggleTheme,
                    isToggle: true,
                    active: theme === 'dark'
                },
                { 
                    icon: Vibrate, 
                    label: t('haptic_feedback'), 
                    value: hapticFeedback ? t('on') : t('off'),
                    action: () => toggleSetting(setHapticFeedback, hapticFeedback),
                    isToggle: true,
                    active: hapticFeedback
                },
                { 
                    icon: Shield, 
                    label: t('reduce_motion'), 
                    value: reduceMotion ? t('on') : t('off'),
                    action: () => toggleSetting(setReduceMotion, reduceMotion),
                    isToggle: true,
                    active: reduceMotion
                },
            ]
        },
        {
            title: t('data_management'),
            items: [
                { 
                    icon: Download, 
                    label: t('export_data'),
                    action: handleExport
                },
                {
                    icon: RefreshCcw,
                    label: "Check for Updates",
                    value: isCheckingUpdates ? "Checking..." : "Tap to sync",
                    action: handleCheckUpdate
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 pb-36">
            <header>
                <h1 className="text-4xl font-black tracking-tighter">{t('settings')}</h1>
                <p className="text-muted-foreground font-medium">{t('settings_subtitle')}</p>
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
                                            <div className="text-left flex-1">
                                                <div className="flex items-center gap-1">
                                                    <p className="font-bold">{item.label}</p>
                                                    {item.label === "Serious Mode" && (
                                                        <PopoverTooltip title="Serious Mode">
                                                            When enabled, the AI engine prioritizes high-intensity progressive overload and stricter recovery monitoring.
                                                        </PopoverTooltip>
                                                    )}
                                                    {item.label === t('recovery_checkins') && (
                                                        <PopoverTooltip title={t('recovery_checkins')}>
                                                            Automated reminders to log your physical state so the engine can adapt your volume safely.
                                                        </PopoverTooltip>
                                                    )}
                                                </div>
                                                {item.value === undefined && (item.label === t('profile_information')) ? (
                                                    <Skeleton className="h-3 w-32 mt-1" />
                                                ) : item.value && (
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
                             {t('sign_out')}
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
                             {t('reset_app_data')}
                         </button>
                     </CardContent>
                 </Card>

                 <div className="mt-8 text-center space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                         PlanR App Edition
                     </p>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                         v{appVersion} · {user?.isGuest ? 'Guest Access' : 'Pro Athlete'}
                     </p>
                 </div>
            </div>
        </div>
    );
};
