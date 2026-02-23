import { useState, useEffect } from 'react';

export interface WearableStats {
    heartRate: number;
    caloriesBurned: number;
    recoveryScore: number;
    syncStatus: 'synced' | 'syncing' | 'error';
}

export const useWearableSync = () => {
    const [stats, setStats] = useState<WearableStats | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const syncMetrics = async () => {
        setIsSyncing(true);
        // Simulated API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStats({
            heartRate: Math.floor(Math.random() * (160 - 120) + 120), // High during workout
            caloriesBurned: Math.floor(Math.random() * 500 + 200),
            recoveryScore: Math.floor(Math.random() * 100),
            syncStatus: 'synced'
        });
        setIsSyncing(false);
    };

    useEffect(() => {
        // Initial mock sync
        syncMetrics();
    }, []);

    return { stats, isSyncing, syncMetrics };
};
