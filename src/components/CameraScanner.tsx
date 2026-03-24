import React, { useRef, useState, useEffect } from 'react';
import { useScanner } from '../hooks/useScanner';
import { useNutrition, type NutritionResult } from '../hooks/useNutrition';
import { useMeals } from '../hooks/useMeals';
import { RefreshCw, Camera as CameraIcon, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CameraScannerProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'barcode' | 'food'>('barcode');
  const [result, setResult] = useState<NutritionResult | null>(null);

  const { lookupBarcode, recognizeFood, loading: nutritionLoading } = useNutrition();
  const { addMeal, loading: mealLoading } = useMeals();

  const handleBarcodeDetected = async (code: string) => {
    if (result || nutritionLoading || mode !== 'barcode') return;
    try {
      const data = await lookupBarcode(code);
      setResult(data);
      stop(); // Stop scanning once we find something
    } catch (err) {
      console.error(err);
    }
  };

  const { start, stop, captureImage } = useScanner({
    videoRef,
    onBarcodeDetected: handleBarcodeDetected,
    scanInterval: 1500,
  });

  useEffect(() => {
    // restart scanner if mode changes back to barcode and we have no result
    if (!result) {
      start();
    }
    return () => stop();
  }, [mode, result, start, stop]);

  const handleCaptureFood = async () => {
    if (nutritionLoading) return;
    try {
      const blob = await captureImage();
      if (!blob) return;
      stop();
      const data = await recognizeFood(blob);
      setResult(data);
    } catch (err) {
      console.error(err);
      start(); // Resume if failed
    }
  };

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
    start();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => { stop(); onClose(); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1">
          <button
            onClick={() => setMode('barcode')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === 'barcode' ? 'bg-white text-black' : 'text-white'}`}
          >
            Barcode
          </button>
          <button
            onClick={() => setMode('food')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${mode === 'food' ? 'bg-emerald-500 text-white' : 'text-white'}`}
          >
            AI Food
          </button>
        </div>
      </div>

      {/* Video View */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900 rounded-b-[40px]">
        {!result && (
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}
        
        {/* Viewfinder Overlay */}
        {!result && !nutritionLoading && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl z-10" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl z-10" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl z-10" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl z-10" />
                {mode === 'barcode' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[80%] h-0.5 bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {nutritionLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
            >
              <RefreshCw className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="font-bold tracking-widest uppercase text-sm">
                {mode === 'food' ? 'Analyzing Food...' : 'Looking up Barcode...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Overlay */}
        <AnimatePresence>
          {result && !nutritionLoading && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-white dark:bg-zinc-950 rounded-t-[40px] p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.3)] pb-24"
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 truncate">{result.name}</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.calories}</span>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">kcal</span>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{result.protein}g</span>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Protein</span>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{result.carbs}g</span>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Carbs</span>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{result.fat}g</span>
                  <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Fat</span>
                </div>
              </div>

              {result.ingredients && result.ingredients.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ingredients</p>
                  <p className="text-sm text-slate-700 dark:text-zinc-300">
                    {result.ingredients.join(', ')}
                  </p>
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
                   className="flex-1 py-4 rounded-full font-black uppercase text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                 >
                   {mealLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Log Food</>}
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!result && (
        <div className="bg-black p-8 pb-12 flex justify-center items-center">
          {mode === 'food' ? (
             <button 
               onClick={handleCaptureFood}
               disabled={nutritionLoading}
               className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center p-1 group"
             >
               <div className="w-full h-full bg-emerald-500 rounded-full group-active:scale-95 transition-transform flex items-center justify-center text-white">
                 <CameraIcon className="w-8 h-8" />
               </div>
             </button>
          ) : (
            <div className="text-center text-white/50 text-xs font-bold uppercase tracking-widest animate-pulse">
              Point at a barcode
            </div>
          )}
        </div>
      )}
    </div>
  );
};
