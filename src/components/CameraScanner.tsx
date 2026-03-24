import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNutrition, type NutritionResult } from '../hooks/useNutrition';
import { useMeals } from '../hooks/useMeals';
import { useScanner } from '../hooks/useScanner';
import { RefreshCw, Camera as CameraIcon, X, Check, Upload, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CameraScannerProps = {
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Unified Smart Scanner — one camera for both barcode and AI vision.
 *
 * Flow:
 * 1. Camera opens with continuous ZXing barcode scanning in the background.
 * 2. If a barcode is detected → lookup Open Food Facts.
 *    - If OFF finds it → show result.
 *    - If OFF fails → automatically capture frame and send to AI Vision.
 * 3. User can also manually tap the shutter to send any frame to AI Vision.
 */
export const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<NutritionResult | null>(null);
  const [status, setStatus] = useState<'scanning' | 'analyzing' | 'result' | 'error'>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { lookupBarcode, recognizeFood } = useNutrition();
  const { addMeal, loading: mealLoading } = useMeals();

  // Handle a detected barcode: OFF lookup → AI fallback
  const handleBarcodeDetected = useCallback(async (code: string) => {
    if (status !== 'scanning') return;
    setStatus('analyzing');

    try {
      const data = await lookupBarcode(code);
      if (data) {
        setResult(data);
        setStatus('result');
        return;
      }
    } catch {
      // OFF failed — fall through to vision
    }

    // Fallback: capture current frame and send to AI
    const blob = await captureFrameFromVideo();
    if (blob) {
      await analyzeWithVision(blob);
    } else {
      setErrorMsg('Could not capture frame for AI fallback.');
      setStatus('error');
    }
  }, [status, lookupBarcode]);

  const { start, stop, captureImage } = useScanner({
    videoRef,
    onBarcodeDetected: handleBarcodeDetected,
    scanInterval: 1500,
  });

  // Start camera when component mounts
  useEffect(() => {
    start().catch(err => {
      setCameraError(err.message || 'Camera access denied');
    });
    return () => stop();
  }, [start, stop]);

  // Capture current frame as a Blob
  const captureFrameFromVideo = useCallback(async (): Promise<Blob | null> => {
    return captureImage();
  }, [captureImage]);

  // Send a blob to the AI vision endpoint
  const analyzeWithVision = useCallback(async (blob: Blob) => {
    setStatus('analyzing');
    try {
      const data = await recognizeFood(blob);
      setResult(data);
      setStatus('result');
    } catch (err: any) {
      setErrorMsg(err.message || 'Vision analysis failed');
      setStatus('error');
    }
  }, [recognizeFood]);

  // Manual shutter: always sends to AI vision
  const handleShutter = useCallback(async () => {
    if (status !== 'scanning') return;
    const blob = await captureFrameFromVideo();
    if (blob) {
      await analyzeWithVision(blob);
    }
  }, [status, captureFrameFromVideo, analyzeWithVision]);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await analyzeWithVision(file);
  };

  // Confirm & log the food
  const handleConfirm = async () => {
    if (!result) return;
    const success = await addMeal({
      food_name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    });
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleRetake = () => {
    setResult(null);
    setErrorMsg('');
    setStatus('scanning');
    start().catch(() => {});
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-10 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-black text-white tracking-widest uppercase">
            Smart Scanner
          </span>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {cameraError ? (
          <div className="bg-red-500/90 text-white p-4 rounded-xl backdrop-blur-md z-10 mx-6 text-center shadow-2xl border border-red-500/20">
            <p className="font-bold">Camera Failed</p>
            <p className="text-sm opacity-90 mt-1">{cameraError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
        )}

        {/* Viewfinder Overlay */}
        {status === 'scanning' && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-64 h-64 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-500 rounded-tl-xl opacity-90" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-500 rounded-tr-xl opacity-90" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-500 rounded-bl-xl opacity-90" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-500 rounded-br-xl opacity-90" />
              {/* Barcode scan line */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-0.5 bg-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Analyzing Overlay */}
        <AnimatePresence>
          {status === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20"
            >
              <RefreshCw className="w-10 h-10 animate-spin text-teal-500 mb-4" />
              <p className="font-bold tracking-widest uppercase text-sm">Analyzing…</p>
              <p className="text-xs text-white/50 mt-1">AI Vision Engine Active</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 p-8"
            >
              <p className="text-red-400 font-bold text-lg mb-2">Analysis Failed</p>
              <p className="text-sm text-white/60 text-center mb-6">{errorMsg}</p>
              <button
                onClick={handleRetake}
                className="px-8 py-3 rounded-full bg-white/10 text-white font-bold uppercase text-sm tracking-widest hover:bg-white/20 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Overlay */}
        <AnimatePresence>
          {status === 'result' && result && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-white dark:bg-zinc-950 rounded-t-[40px] p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.3)] pb-24 z-30"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 truncate">{result.name}</h3>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { val: result.calories, unit: 'kcal', color: 'text-emerald-500' },
                  { val: `${result.protein}g`, unit: 'Protein', color: 'text-blue-500' },
                  { val: `${result.carbs}g`, unit: 'Carbs', color: 'text-amber-500' },
                  { val: `${result.fat}g`, unit: 'Fat', color: 'text-rose-500' },
                ].map((m) => (
                  <div key={m.unit} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex flex-col items-center">
                    <span className={`text-lg font-black ${m.color}`}>{m.val}</span>
                    <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">{m.unit}</span>
                  </div>
                ))}
              </div>

              {result.ingredients && result.ingredients.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ingredients</p>
                  <p className="text-sm text-slate-700 dark:text-zinc-300">{result.ingredients.join(', ')}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-4 rounded-full font-black uppercase text-sm bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={mealLoading}
                  className="flex-1 py-4 rounded-full font-black uppercase text-sm bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  {mealLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Log Food</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      {status === 'scanning' && !cameraError && (
        <div className="p-8 pb-12 z-20 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full flex flex-col items-center">
          <p className="text-white/80 font-medium text-xs mb-6 text-center tracking-wide">
            Point at a barcode or tap to identify food with AI
          </p>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <div className="flex items-center justify-center w-full max-w-sm relative px-6">
            <div className="w-12 h-12 flex-shrink-0" />

            <div className="flex-1 flex justify-center">
              <button
                onClick={handleShutter}
                aria-label="Capture photo for AI analysis"
                className="w-[72px] h-[72px] rounded-full border-[3px] border-white/90 p-1 flex items-center justify-center transition-all hover:scale-[1.03] active:scale-95 shadow-2xl"
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <CameraIcon fill="black" className="w-7 h-7 text-black stroke-[1.5]" />
                </div>
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload photo"
              className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/20 shadow-lg"
            >
              <Upload className="w-5 h-5 opacity-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
