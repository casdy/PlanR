import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { QuotaTracker } from './QuotaTracker';

interface SmartScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeScan: (barcode: string, screenshot?: string) => void;
  onImageCapture: (base64Image: string) => void;
}

export const SmartScanner: React.FC<SmartScannerProps> = ({
  isOpen,
  onClose,
  onBarcodeScan,
  onImageCapture
}) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize ZXing Reader with specific hints once
  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, // Common on many generic products
      BarcodeFormat.CODE_39
    ]);
    
    readerRef.current = new BrowserMultiFormatReader(hints);
    
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  // Start ZXing Scanner Loop when Webcam Video Mounts
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const checkVideoAndScan = setInterval(() => {
      if (webcamRef.current && readerRef.current) {
        const video = webcamRef.current.video;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          clearInterval(checkVideoAndScan); // Stop checking, start scanning
          
          if (active) {
            readerRef.current.decodeFromVideoElementContinuously(
              video,
              (result, _err) => {
                if (result && active) {
                  const screenshot = webcamRef.current?.getScreenshot() || undefined;
                  onBarcodeScan(result.getText(), screenshot);
                  active = false;
                  readerRef.current?.reset(); // Stop the loop internally
                }
              }
            ).catch(e => console.warn('Scanner error:', e));
          }
        }
      }
    }, 250);

    return () => { 
       active = false; 
       clearInterval(checkVideoAndScan);
       if (readerRef.current) {
         readerRef.current.reset();
       }
    };
  }, [isOpen, onBarcodeScan]);

  const handleCapturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
           const compressed = await compressImage(imageSrc, 800, 0.7);
           onImageCapture(compressed);
        } catch(e) {
           onImageCapture(imageSrc);
        }
      }
    }
  }, [onImageCapture]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
           const compressed = await compressImage(reader.result, 800, 0.7);
           onImageCapture(compressed);
        } catch(e) {
           onImageCapture(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header controls */}
      <div className="w-full flex items-center justify-between p-6 pt-12 z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0">
        <button
          onClick={onClose}
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors shadow-xl"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
           <QuotaTracker />
           <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hidden sm:flex">
              <Camera className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-white tracking-widest uppercase">
                 Smart Scanner
              </span>
           </div>
        </div>
      </div>

      {/* Viewfinder frame */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {error ? (
          <div className="bg-red-500/90 text-white p-4 rounded-xl backdrop-blur-md z-10 mx-6 text-center shadow-2xl border border-red-500/20">
            <p className="font-bold">Camera Initialization Failed</p>
            <p className="text-sm opacity-90 mt-1">{error}</p>
          </div>
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            className="absolute inset-0 w-full h-full object-cover"
            videoConstraints={{
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: "environment"
            }}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            onUserMediaError={(err) => setError(typeof err === 'string' ? err : err.message || 'Browser blocking camera. Use HTTPS.')}
            style={{ 
              filter: 'contrast(1.1)', 
              imageRendering: 'crisp-edges'
            }}
          />
        )}
        
        {/* Optical Scanner target UI */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-[70%] max-w-sm aspect-square relative drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl opacity-90" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl opacity-90" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl opacity-90" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl opacity-90" />
            
            <div className="absolute inset-0 bg-teal-500/5 backdrop-blur-[1px] rounded-xl" />
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 pb-12 z-20 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full flex flex-col items-center">
        <p className="text-white/95 font-semibold text-sm mb-8 text-center drop-shadow-md tracking-wide">
           Align barcode or nutrition label within frame
        </p>

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div className="flex items-center justify-center w-full max-w-sm relative px-6">
          {/* Invisible spacer to perfectly center the main button */}
          <div className="w-12 h-12 flex-shrink-0"></div>
          
          <div className="flex-1 flex justify-center">
            {/* Capture Button */}
            <button 
              onClick={handleCapturePhoto}
              aria-label="Take photo"
              className="w-[72px] h-[72px] rounded-full border-[3px] border-white/90 p-1 flex flex-col items-center justify-center transition-all hover:scale-[1.03] active:scale-95 shadow-2xl"
            >
              <div className="w-full h-full bg-white rounded-full transition-all hover:bg-gray-100 flex items-center justify-center">
                <Camera fill="black" className="w-7 h-7 text-black stroke-[1.5]" />
              </div>
            </button>
          </div>
          
          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload photo"
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/20 shadow-lg"
          >
            <ImageIcon className="w-5 h-5 opacity-90" />
          </button>
        </div>
      </div>
    </div>
  );
};
