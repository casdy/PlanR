import { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';
import type { PermissionState } from '@capacitor/core';

export interface AppPermissions {
  notifications: PermissionState;
  calendar: PermissionState;
}

export const useAppPermissions = () => {
  const [permissions, setPermissions] = useState<AppPermissions>({
    notifications: 'prompt',
    calendar: 'prompt',
  });

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      setPermissions({ notifications: 'granted', calendar: 'granted' });
      return;
    }
    try {
      const nStatus = await LocalNotifications.checkPermissions();
      const cStatus = await CapacitorCalendar.checkPermission({ scope: 'readCalendar' as any });
      
      setPermissions({
        notifications: nStatus.display,
        calendar: cStatus.result, 
      });
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  const requestNotificationPermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const status = await LocalNotifications.requestPermissions();
      setPermissions(prev => ({ ...prev, notifications: status.display }));
      return status.display === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  const requestCalendarPermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const status = await CapacitorCalendar.requestPermission({ scope: 'readCalendar' as any });
      setPermissions(prev => ({ ...prev, calendar: status.result }));
      return status.result === 'granted';
    } catch (err) {
      console.error('Error requesting calendar permission:', err);
      return false;
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    checkPermissions,
    requestNotificationPermission,
    requestCalendarPermission,
  };
};
