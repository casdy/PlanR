import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
    /**
     * Request notification permissions from the user.
     */
    async requestPermissions() {
        if (typeof window === 'undefined') return;
        
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display === 'denied') {
                return; // Don't keep asking if already denied
            }
            if (status.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (err) {
            // Only log if it's a real crash, not just a block/ignore
            console.warn('[NotificationService] Status check failed:', err);
        }
    },

    /**
     * Schedules the 7-day motivation plan.
     * Fires at 11:00 AM and 08:00 PM for each day.
     */
    async scheduleCoachingNotifications(plan: any[]) {
        try {
            // 1. Clear existing coaching notifications
            const pending = await LocalNotifications.getPending();
            const coachingIds = pending.notifications
                .filter(n => n.id >= 1000 && n.id < 2000)
                .map(n => n.id);
            
            if (coachingIds.length > 0) {
                await LocalNotifications.cancel({ notifications: coachingIds.map(id => ({ id })) });
            }

            // 2. Schedule new ones
            const notifications: any[] = [];
            const now = new Date();

            plan.forEach((dayPlan, index) => {
                const dayOffset = index; // 0 for today, 1 for tomorrow, etc.
                
                // 11:00 AM Prompt
                const date11am = new Date();
                date11am.setDate(now.getDate() + dayOffset);
                date11am.setHours(11, 0, 0, 0);

                if (date11am > now) {
                    notifications.push({
                        id: 1000 + index,
                        title: "Coach AI • Morning Motivation",
                        body: dayPlan.motivation_message,
                        schedule: { at: date11am },
                        smallIcon: 'ic_stat_name', // Customize if you have one
                        actionTypeId: 'OPEN_APP'
                    });
                }

                // 08:00 PM Prompt
                const date8pm = new Date();
                date8pm.setDate(now.getDate() + dayOffset);
                date8pm.setHours(20, 0, 0, 0);

                if (date8pm > now) {
                    notifications.push({
                        id: 1100 + index,
                        title: "Coach AI • Evening Check-in",
                        body: dayPlan.motivation_message,
                        schedule: { at: date8pm },
                        actionTypeId: 'OPEN_APP'
                    });
                }
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`[NotificationService] Scheduled ${notifications.length} coaching messages.`);
            }
        } catch (err) {
            console.error('[NotificationService] Scheduling failed:', err);
        }
    },

    /**
     * Fires an immediate notification with praise.
     */
    async showImmediatePraise(message: string) {
        try {
            await LocalNotifications.schedule({
                notifications: [{
                    id: 9999,
                    title: "Workout Smashed! 🏆",
                    body: message,
                    schedule: { at: new Date(Date.now() + 1000) } // 1s delay
                }]
            });
        } catch (err) {
            console.error('[NotificationService] Praise failed:', err);
        }
    },

    /**
     * Clears today's scheduled motivation prompts if the user has already opened the app.
     */
    async clearTodaysPrompts() {
        try {
            const pending = await LocalNotifications.getPending();
            
            const toCancel = pending.notifications.filter(n => {
                if (n.id >= 1000 && n.id < 2000) {
                   // We'd need to check the exact date if Capacitor allowed, 
                   // but clearing 1000 and 1100 (Day 0) is safe.
                   return n.id === 1000 || n.id === 1100;
                }
                return false;
            });

            if (toCancel.length > 0) {
                await LocalNotifications.cancel({ notifications: toCancel.map(n => ({ id: n.id })) });
            }
        } catch (err) {
            console.warn('[NotificationService] Clear failed:', err);
        }
    }
};
