import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat, type BarcodesScannedEvent } from '@capacitor-mlkit/barcode-scanning';
import { Camera, X, Loader2 } from 'lucide-react';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';
import { useLanguage } from '../../hooks/useLanguage';

interface NutritionScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  isProcessing: boolean;
}

/**
 * Native Capacitor ML Kit Barcode Scanner.
 * Overlays a transparent React UI over the underlying native camera view.
 */
export const NutritionScanner: React.FC<NutritionScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  isProcessing,
}) => {
  const { hasPermission, requestPermissions } = useCameraPermissions();
  const { t } = useLanguage();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const startScanner = async () => {
      // Graceful fallback for web/desktop browser previews
      if (Capacitor.getPlatform() === 'web') {
        console.warn('Native ML Kit Scanner is not available on web. Please test on a physical Android or iOS device.');
        setInitError('Native Scanner Unavailable: High-performance ML Kit scanning requires a physical mobile device.');
        return;
      }

      try {
        // Ensure permissions are granted before starting the camera
        let granted = hasPermission;
        if (granted === null || granted === false) {
          granted = await requestPermissions();
        }

        if (!granted) {
          setInitError(t('camera_permission_denied') || 'Camera access denied.');
          return;
        }

        // Install the barcode listener
        await BarcodeScanner.addListener('barcodesScanned', (result: BarcodesScannedEvent) => {
          if (isSubscribed && result.barcodes.length > 0) {
             const barcode = result.barcodes[0];
             if (barcode.rawValue) {
               // Immediately stop scanning upon successful read
               stopScanner();
               onScanSuccess(barcode.rawValue);
             }
          }
        });

        // Make the webview background transparent to see the camera feed underneath
        document.body.style.backgroundColor = 'transparent';
        document.body.classList.add('barcode-scanner-active');

        // Start scanning, constrained to specific formats to maximize speed
        await BarcodeScanner.startScan({
          formats: [
            BarcodeFormat.Ean13,
            BarcodeFormat.Ean8,
            BarcodeFormat.UpcA
          ],
        });

      } catch (error) {
        console.error('Failed to start native ML Kit Scanner:', error);
        if (isSubscribed) setInitError(t('scanner_init_failed') || 'Failed to initialize scanner.');
      }
    };

    const stopScanner = async () => {
      if (Capacitor.getPlatform() === 'web') return;
      
      try {
        await BarcodeScanner.removeAllListeners();
        await BarcodeScanner.stopScan();
      } catch (e) {
        console.error('Failed to stop scanner cleanly', e);
      } finally {
        // Restore background
        document.body.style.backgroundColor = '';
        document.body.classList.remove('barcode-scanner-active');
      }
    };

    if (isOpen) {
      startScanner();
    }

    return () => {
      isSubscribed = false;
      if (isOpen) {
         stopScanner();
      }
    };
  }, [isOpen, hasPermission, requestPermissions, onScanSuccess, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between"
         style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}> 
         {/* Note: The physical camera is under the webview. We use a semi-transparent black overlay here in React to frame it. */}
      
      {/* Header controls */}
      <div className="w-full flex items-center justify-between p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
           <Camera className="w-4 h-4 text-teal-400" />
           <span className="text-sm font-medium text-white tracking-widest uppercase">
              {isProcessing ? t('processing_scan') : 'Scanner'}
           </span>
        </div>
      </div>

      {/* Viewfinder frame */}
      <div className="flex-1 flex items-center justify-center pointer-events-none p-8">
        {initError ? (
          <div className="bg-red-500/90 text-white p-4 rounded-xl backdrop-blur-md max-w-sm text-center shadow-2xl">
            <p className="font-bold">{t('error')}</p>
            <p className="text-sm opacity-90 mt-1">{initError}</p>
          </div>
        ) : (
          <div className="relative w-full max-w-xs aspect-square">
            {/* Guide borders */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl" />
            
            {/* Loading overlay during OFF API fetch */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                 <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-8 pb-12 text-center bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white/90 font-medium text-sm">
           {t('point_camera_barcode')}
        </p>
        <p className="text-teal-400/80 text-xs mt-2 uppercase tracking-wider font-bold">
           ML Kit Vision Engaged
        </p>
      </div>
    </div>
  );
};
