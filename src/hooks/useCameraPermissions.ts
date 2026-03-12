import { useState, useCallback, useEffect } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export function useCameraPermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      const isGranted = camera === 'granted';
      setHasPermission(isGranted);
      return isGranted;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const requestPermissions = async () => {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      const isGranted = camera === 'granted';
      setHasPermission(isGranted);
      return isGranted;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setHasPermission(false);
      return false;
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    hasPermission,
    checkPermissions,
    requestPermissions,
  };
}
