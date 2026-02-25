/**
 * @file src/store/toastStore.ts
 * @description Zustand store for managing ephemeral toast notifications.
 *
 * Toasts are shown globally via the Toast UI component. Each toast auto-dismisses
 * after 3.5 seconds. Multiple toasts can be queued simultaneously.
 *
 * Usage:
 *   const { showToast } = useToastStore();
 *   showToast('Workout saved!', 'success');
 */
import { create } from 'zustand';

/** Visual category of a toast that determines its colour scheme. */
export type ToastType = 'success' | 'error' | 'info';

/** A single toast notification entry. */
interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    /** Adds a new toast to the queue. Defaults to `'success'` type. */
    showToast: (message: string, type?: ToastType) => void;
    /** Immediately removes a toast by its ID (before the auto-dismiss timer fires). */
    dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    showToast: (message, type = 'success') => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        // Auto-dismiss after 3.5s
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3500);
    },
    dismissToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
}));
