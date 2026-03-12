import { LocalNotifications } from '@capacitor/local-notifications';
import { isAfter, isBefore, setHours, setMinutes, addDays, startOfDay } from 'date-fns';

export interface NotificationPreferences {
  dailyMotivationEnabled: boolean;
  recoveryCheckInEnabled: boolean;
  weeklyMeasurementReminderEnabled: boolean;
  workoutReminderTime: string; // HH:mm
  seriousMode: boolean;
}

const MOTIVATIONAL_QUOTES = {
  fat_loss: [
    "Burn the day off. Your 45-min session is waiting.",
    "Small steps lead to big changes. Let's hit that workout!",
    "Success starts with self-discipline. Time to sweat.",
  ],
  muscle_gain: [
    "Time to grow. Don't skip today's volume.",
    "Fuel the pump. Your strength session is calling.",
    "Consistency is the key to muscle growth. Let's lift!",
  ],
  strength: [
    "Heavy day ahead. Focus and conquer.",
    "Build the foundation. Your strength is earned today.",
    "Power through the plateau. Let's go!",
  ],
  maintenance: [
    "Keep the momentum. Stay active and stay healthy.",
    "Consistency over intensity. Get your movement in.",
    "Balance is key. Let's maintain your progress!",
  ]
};

export const scheduleWeeklyNotifications = async (
  prefs: NotificationPreferences,
  goal: keyof typeof MOTIVATIONAL_QUOTES = 'maintenance'
) => {
  try {
    // 1. Clear all existing notifications managed by PlanR
    await LocalNotifications.cancel({ notifications: [{ id: 100 }, { id: 200 }, { id: 300 }] }); // Batch identifiers or just cancel all
    // Actually, it's better to cancel specific ones or use a range.
    // For simplicity, we'll cancel all pending notifications and reschedule.
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
    }

    const notifications = [];

    // 2. Schedule Daily Motivation
    if (prefs.dailyMotivationEnabled) {
      const [hours, minutes] = prefs.workoutReminderTime.split(':').map(Number);
      const quotes = MOTIVATIONAL_QUOTES[goal];
      
      for (let i = 0; i < 7; i++) {
        const scheduleDate = addDays(startOfDay(new Date()), i);
        const notificationDate = setMinutes(setHours(scheduleDate, hours), minutes);

        // Don't schedule for the past today
        if (isBefore(notificationDate, new Date())) continue;

        notifications.push({
          title: "PlanR Motivation",
          body: quotes[i % quotes.length],
          id: 100 + i,
          schedule: { at: notificationDate },
          extra: { type: 'motivation', dayIndex: i }
        });
      }
    }

    // 3. Schedule Recovery Check-ins (Daily @ 8:00 PM)
    if (prefs.seriousMode && prefs.recoveryCheckInEnabled) {
      for (let i = 0; i < 7; i++) {
        const scheduleDate = addDays(startOfDay(new Date()), i);
        const notificationDate = setMinutes(setHours(scheduleDate, 20), 0);

        if (isBefore(notificationDate, new Date())) continue;

        notifications.push({
          title: "Recovery Check-in",
          body: "Time for your Recovery Check-in. How are you feeling today?",
          id: 200 + i,
          schedule: { at: notificationDate },
          extra: { type: 'recovery', dayIndex: i }
        });
      }
    }

    // 4. Schedule Weekly Measurements (Sunday @ 9:00 AM)
    if (prefs.weeklyMeasurementReminderEnabled) {
      const today = new Date();
      const nextSunday = addDays(startOfDay(today), (7 - today.getDay()) % 7);
      const notificationDate = setMinutes(setHours(nextSunday, 9), 0);

      if (isAfter(notificationDate, new Date())) {
        notifications.push({
          title: "Weekly Stats",
          body: "Data drives progress. Time to log your body stats and take your weekly progress photo.",
          id: 300,
          schedule: { at: notificationDate },
          extra: { type: 'measurements' }
        });
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`Scheduled ${notifications.length} notifications.`);
    }
  } catch (err) {
    console.error("Error scheduling notifications:", err);
  }
};

export const cancelWorkoutNotification = async (dayIndex: number) => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 100 + dayIndex }] });
  } catch (err) {
    console.error("Error canceling notification:", err);
  }
};
