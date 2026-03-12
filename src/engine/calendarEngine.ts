import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { addHours, startOfDay, addDays } from 'date-fns';

export interface WorkoutEvent {
  title: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, etc.
  startTime?: string; // HH:mm, default to 10:00 AM if not provided
}

export const syncWorkoutSplitToCalendar = async (workoutEvents: WorkoutEvent[]) => {
  if (!Capacitor.isNativePlatform()) {
    console.warn("Calendar sync skipped: Not on native platform.");
    return true;
  }
  
  try {
    const { result } = await CapacitorCalendar.checkPermission({ scope: 'readCalendar' as any });
    if (result !== 'granted') {
      const { result: newStatus } = await CapacitorCalendar.requestPermission({ scope: 'readCalendar' as any });
      if (newStatus !== 'granted') {
        throw new Error("Calendar permission not granted.");
      }
    }

    // Get the first day of the current week (Sunday)
    const today = new Date();
    const startOfCurrentWeek = addDays(startOfDay(today), -today.getDay());

    for (const event of workoutEvents) {
      const eventDate = addDays(startOfCurrentWeek, event.dayIndex);
      const [hours, minutes] = (event.startTime || '10:00').split(':').map(Number);
      
      const startDate = new Date(eventDate);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = addHours(startDate, 1);

      await CapacitorCalendar.createEvent({
        title: `PlanR: ${event.title}`,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        location: 'Gym',
      });
    }

    return true;
  } catch (err) {
    console.error("Error syncing to calendar:", err);
    throw err;
  }
};
