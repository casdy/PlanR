import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, RefreshCw, Zap, ChevronLeft, ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { StorageService } from '../services/storageService';
import { ProgressService } from '../services/progressService';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface ProgressCameraProps {
    sessionId?: string; // Optional: if provided, links to a workout session
    onComplete: (photoUrl: string) => void;
    onClose: () => void;
}

/**
 * Regular Camera for Progress Photos.
 * Can be used standalone or linked to a workout session.
 * Includes silhouette guide, countdown, and file upload fallback.
 */
export const ProgressCamera: React.FC<ProgressCameraProps> = ({ sessionId, onComplete, onClose }) => {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [showGuide, setShowGuide] = useState(true);
    const { t } = useLanguage();
    const { user } = useAuth();

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleStartCountdown = () => {
        setCountdown(3);
    };

    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            capture();
            setCountdown(null);
        }
    }, [countdown, capture]);

    const handleUpload = async () => {
        if (!imgSrc || !user) return;
        setIsUploading(true);
        try {
            // Convert base64 to blob
            const response = await fetch(imgSrc);
            const blob = await response.blob();
            
            const fileName = `progress_${sessionId || 'standalone'}_${user.id}_${Date.now()}`;
            const url = await StorageService.uploadPhysiquePhoto(blob, fileName);
            
            // Save to standalone progress table
            await ProgressService.saveProgressPhoto({
              user_id: user.id,
              photo_url: url,
              body_part: 'Overall', // Default
              notes: sessionId ? `Linked to workout session ${sessionId}` : 'Standalone progress update'
            });

            onComplete(url);
        } catch (err) {
            console.error("Upload failed:", err);
            // Fallback: inform user or use local
            onComplete(imgSrc);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setImgSrc(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*" 
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="text-white/60 hover:text-white flex items-center gap-2 font-bold transition-colors">
                    <ChevronLeft className="w-5 h-5" /> {t('back')}
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-md rounded-full border border-primary/30">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">
                        Progress Camera
                    </span>
                </div>
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showGuide ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/40'}`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Viewfinder */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {!imgSrc ? (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode }}
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Silhouette Overlay */}
                        {showGuide && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                              <svg viewBox="0 0 200 300" className="w-[80%] h-[80%] text-white/40 max-w-md">
                                  <path 
                                      fill="currentColor" 
                                      d="M100,20c-11,0-20,9-20,20s9,20,20,20s20-9,20-20S111,20,100,20z M140,80c-5-5-15-5-20,0l-10,10l-10-10c-5-5-15-5-20,0s-5,15,0,20l15,15v50c0,10,5,20,15,20h0c10,0,15-10,15-20v-50l15-15C145,95,145,85,140,80z"
                                  />
                                  <circle cx="100" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
                                  <rect x="80" y="65" width="40" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="2" />
                                  <path d="M75,80 Q50,70 40,100" fill="none" stroke="currentColor" strokeWidth="2" />
                                  <path d="M125,80 Q150,70 160,100" fill="none" stroke="currentColor" strokeWidth="2" />
                              </svg>
                          </div>
                        )}

                        {/* Scan Line Animation */}
                        <motion.div 
                            animate={{ y: [0, 300, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/4 left-10 right-10 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.8)] pointer-events-none"
                        />
                    </>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                    >
                        <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                    </motion.div>
                )}

                {/* Countdown Overlay */}
                <AnimatePresence>
                    {countdown !== null && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-50 bg-black/20"
                        >
                            <span className="text-[120px] font-black text-white italic drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                {countdown > 0 ? countdown : 'FLEX!'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-8">
                {!imgSrc ? (
                    <div className="flex items-center justify-center gap-10">
                        <button 
                            onClick={toggleFacingMode}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={handleStartCountdown}
                            className="w-20 h-20 rounded-full border-4 border-white/90 p-1 bg-transparent hover:scale-110 active:scale-95 transition-transform"
                        >
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                <Camera className="w-8 h-8 text-black" fill="black" />
                            </div>
                        </button>

                        <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
                        >
                             <ImageIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-sm grid grid-cols-2 gap-4">
                        <Button 
                            variant="secondary" 
                            className="h-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 border-white/10 uppercase font-black tracking-widest text-[10px]"
                            onClick={() => setImgSrc(null)}
                            disabled={isUploading}
                        >
                            <X className="w-4 h-4 mr-2" /> {t('retake')}
                        </Button>
                        <Button 
                            className="h-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 uppercase font-black tracking-widest text-[10px]"
                            onClick={handleUpload}
                            disabled={isUploading || !user}
                        >
                            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> {t('save_progress')}</>}
                        </Button>
                    </div>
                )}
                
                {!imgSrc && (
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        Capture your transformation
                    </p>
                )}
            </div>
        </div>
    );
};
