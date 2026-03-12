import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
    }),
    {
      name: 'planr-user-storage',
    }
  )
);
