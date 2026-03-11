import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap } from 'lucide-react';

interface WebBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  isProcessing: boolean; // True when we are fetching product data
}

export const WebBarcodeScanner: React.FC<WebBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  isProcessing
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'fullscreen-qr-scanner';
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Stop scanner utility
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // 2 = SCANNING
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn("Failed to stop scanner cleanly.", e);
      }
      scannerRef.current = null;
    }
  }, []);

  // Initialize Scanner when opened
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setIsReady(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      // Small delay to allow portal animation & DOM mount
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      try {
        // Formats optimized for groceries/food products
        const formatsToSupport = [
          8, // EAN_13
          7, // EAN_8
          14, // UPC_A
          15, // UPC_E
          3, // CODE_39
          5, // CODE_128
        ];

        const scanner = new Html5Qrcode(scannerDivId, { formatsToSupport, verbose: false });
        scannerRef.current = scanner;

        const config = {
          fps: 25,
          // Massive scanning area for full screen
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(viewfinderWidth * 0.8, 400);
            const height = Math.min(viewfinderHeight * 0.4, 250);
            return { width, height };
          },
          aspectRatio: window.innerHeight / window.innerWidth, // Full screen portrait
          videoConstraints: {
            facingMode: 'environment',
            focusMode: 'continuous',
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 480, ideal: 1080, max: 1080 },
          }
        };

        const onScan = (decodedText: string) => {
           if (isProcessing) return; // Prevent rapid-fire multi-scans
           // Provide haptic feedback if available (mobile)
           if (navigator.vibrate) navigator.vibrate(50);
           onScanSuccess(decodedText);
        };

        try {
          // Top-tier HD Config
          await scanner.start({ facingMode: "environment" }, config, onScan, () => {});
          if (isMounted) setIsReady(true);
        } catch (initialErr) {
          console.warn("Retrying camera with fallback constraints due to hardware limits.", initialErr);
          // Fallback Config (Older devices)
          if (isMounted) {
             await scanner.start(
               { facingMode: "environment" },
               { fps: 10, qrbox: { width: 250, height: 150 } },
               onScan,
               () => {}
             );
             setIsReady(true);
          }
        }
      } catch (err) {
        console.error("Critical camera startup error:", err);
        if (isMounted) {
          setError('Camera permission denied or hardware unavailable. Please check browser settings.');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, onScanSuccess, stopScanner, isProcessing]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[200] bg-black pointer-events-auto flex flex-col"
      >
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30 backdrop-blur-md">
              <Camera className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-white font-black uppercase tracking-widest text-xs shadow-black drop-shadow-md">
              Barcode Scanner
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing State Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
            <RefreshCw className="w-12 h-12 text-teal-400 animate-spin mb-4" />
            <h3 className="text-white font-black text-xl tracking-tight">Verifying Product</h3>
            <p className="text-teal-400 text-sm font-medium animate-pulse uppercase tracking-widest mt-2">Checking Database...</p>
          </div>
        )}

        {/* Camera Viewport */}
        <div className="flex-1 relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950">
           {error ? (
              <div className="p-8 text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-black text-lg mb-2">Camera Unavailable</h3>
                <p className="text-zinc-400 text-sm">{error}</p>
              </div>
           ) : (
             <div className="w-full h-full relative">
               <div id={scannerDivId} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
               
               {/* Targeting UI (Only show when ready and not processing) */}
               {isReady && !isProcessing && (
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Darkened edges */}
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
                    
                    {/* Bounding Box corners */}
                    <div className="relative w-64 h-40">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl" />
                      
                      {/* Scanning Laser */}
                      <motion.div 
                        initial={{ top: '10%' }}
                        animate={{ top: '90%' }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: "linear" }}
                        className="absolute left-4 right-4 h-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,1)]"
                      />
                    </div>

                    <div className="absolute bottom-24 flex flex-col items-center">
                       <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-2 mb-2">
                         <Zap className="w-3 h-3 text-teal-400 fill-teal-400" />
                         <span className="text-[10px] text-white font-black uppercase tracking-widest">Optimized for UPC/EAN</span>
                       </div>
                       <p className="text-sm font-bold text-white shadow-black drop-shadow-md text-center max-w-[200px]">
                         Position barcode within the frame
                       </p>
                    </div>
                 </div>
               )}
             </div>
           )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
