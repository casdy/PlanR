// src/hooks/useScanner.ts
import { useEffect, useRef, useCallback } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { BrowserMultiFormatReader } from '@zxing/browser';

type UseScannerProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onBarcodeDetected?: (code: string) => void;
  scanInterval?: number;
};

export function useScanner({
  videoRef,
  onBarcodeDetected,
  scanInterval = 1000,
}: UseScannerProps) {
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef(0);

  const start = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      const reader = new BrowserMultiFormatReader();
      codeReaderRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      // Prefer back camera if available, fallback to first device
      const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
      const deviceId = backCamera ? backCamera.deviceId : devices[0]?.deviceId;

      if (!deviceId) throw new Error("No video input devices found");

      controlsRef.current = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (!result) return;
          
          const now = Date.now();
          if (now - lastScanRef.current < scanInterval) return;

          lastScanRef.current = now;
          onBarcodeDetected?.(result.getText());
        }
      );
    } catch (err) {
      console.error("Camera access error:", err);
      throw err;
    }
  }, [videoRef, onBarcodeDetected, scanInterval]);

  const stop = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const captureImage = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.resolve(null);

    // Resize to max 1024px on longest side to keep payload manageable for vision APIs
    const MAX_DIM = 1024;
    let w = video.videoWidth;
    let h = video.videoHeight;

    if (w > MAX_DIM || h > MAX_DIM) {
      const scale = MAX_DIM / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    ctx.drawImage(video, 0, 0, w, h);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
    });
  }, [videoRef]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, captureImage };
}
