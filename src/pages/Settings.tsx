import * as React from 'react';
import { User, Bell, Shield, Moon, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const SettingsPage = () => {
    const { user, logout, resetApp } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [soundsEnabled, setSoundsEnabled] = React.useState(() => {
        return localStorage.getItem('planr-sounds') !== 'false';
    });

    const toggleSounds = () => {
        setSoundsEnabled(prev => {
            const next = !prev;
            localStorage.setItem('planr-sounds', String(next));
            return next;
        });
    };

    const sections = [
        {
            title: 'Account',
            items: [
                { icon: User, label: 'Profile Information', value: user?.name || 'Athlete' },
                { icon: Bell, label: 'Notifications', value: 'Enabled' },
            ]
        },
        {
            title: 'App Settings',
            items: [
                { 
                    icon: Moon, 
                    label: 'Dark Mode', 
                    value: theme === 'dark' ? 'On' : 'Off',
                    action: toggleTheme
                },
                { 
                    icon: Bell, 
                    label: 'Workout Sounds', 
                    value: soundsEnabled ? 'On' : 'Off',
                    action: toggleSounds
                },
                { icon: Shield, label: 'Privacy & Security', value: '' },
            ]
        }
    ];

    return (
        <div className="space-y-8 pb-24">
            <header>
                <h1 className="text-4xl font-black tracking-tighter">Settings</h1>
                <p className="text-muted-foreground font-medium">Manage your account and preferences</p>
            </header>

            <div className="space-y-6">
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
                                                {item.value && <p className="text-xs text-muted-foreground font-medium">{item.value}</p>}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                ))}

                <Button 
                    variant="ghost" 
                    onClick={logout}
                    className="w-full h-16 rounded-[2rem] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>

                <div className="pt-4">
                    <button 
                        onClick={() => {
                            if (confirm('Are you sure you want to WIP ALL APP DATA? This will delete all users and history.')) {
                                resetApp();
                            }
                        }}
                        className="w-full text-xs font-black uppercase tracking-widest text-muted-foreground/30 hover:text-destructive transition-colors"
                    >
                        Reset App Data (Debug Only)
                    </button>
                </div>
            </div>
        </div>
    );
};
