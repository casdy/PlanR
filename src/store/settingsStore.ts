import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance';

interface SettingsState {
  dailyMotivationEnabled: boolean;
  recoveryCheckInEnabled: boolean;
  weeklyMeasurementReminderEnabled: boolean;
  workoutReminderTime: string; // HH:mm
  seriousMode: boolean;
  primaryFitnessGoal: FitnessGoal;
  
  // Existing App Settings
  soundsEnabled: boolean;
  autoAdvance: boolean;
  restTimer: string;
  reduceMotion: boolean;
  hapticFeedback: boolean;
  
  setDailyMotivationEnabled: (enabled: boolean) => void;
  setRecoveryCheckInEnabled: (enabled: boolean) => void;
  setWeeklyMeasurementReminderEnabled: (enabled: boolean) => void;
  setWorkoutReminderTime: (time: string) => void;
  setSeriousMode: (enabled: boolean) => void;
  setPrimaryFitnessGoal: (goal: FitnessGoal) => void;

  setSoundsEnabled: (enabled: boolean) => void;
  setAutoAdvance: (enabled: boolean) => void;
  setRestTimer: (time: string) => void;
  setReduceMotion: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyMotivationEnabled: true,
      recoveryCheckInEnabled: true,
      weeklyMeasurementReminderEnabled: true,
      workoutReminderTime: '17:30',
      seriousMode: false,
      primaryFitnessGoal: 'maintenance',
      
      // Defaults
      soundsEnabled: true,
      autoAdvance: true,
      restTimer: '60s',
      reduceMotion: false,
      hapticFeedback: true,
      
      setDailyMotivationEnabled: (enabled) => set({ dailyMotivationEnabled: enabled }),
      setRecoveryCheckInEnabled: (enabled) => set({ recoveryCheckInEnabled: enabled }),
      setWeeklyMeasurementReminderEnabled: (enabled) => set({ weeklyMeasurementReminderEnabled: enabled }),
      setWorkoutReminderTime: (time) => set({ workoutReminderTime: time }),
      setSeriousMode: (enabled) => set({ seriousMode: enabled }),
      setPrimaryFitnessGoal: (goal) => set({ primaryFitnessGoal: goal }),

      setSoundsEnabled: (enabled) => set({ soundsEnabled: enabled }),
      setAutoAdvance: (enabled) => set({ autoAdvance: enabled }),
      setRestTimer: (time) => set({ restTimer: time }),
      setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
      setHapticFeedback: (enabled) => set({ hapticFeedback: enabled }),
    }),
    {
      name: 'planr-notification-settings',
    }
  )
);
