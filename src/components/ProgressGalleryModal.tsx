/**
 * @file src/components/ProgressGalleryModal.tsx
 * @description Modal displaying a grid of all physique progress photos.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid, Layout, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { ProgressService, type ProgressPhoto } from '../services/progressService';
import { useAuth } from '../hooks/useAuth';
import { PhotoViewerModal } from './PhotoViewerModal';

interface ProgressGalleryModalProps {
    onClose: () => void;
}

export const ProgressGalleryModal: React.FC<ProgressGalleryModalProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

    const loadPhotos = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await ProgressService.getProgressPhotos(user.id);
            setPhotos(data);
        } catch (err) {
            console.error("Failed to load gallery:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPhotos();
    }, [user]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex flex-col"
        >
            {/* Header */}
            <div className="p-6 pt-12 flex items-center justify-between border-b border-white/5 bg-black/40">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                        <Grid className="w-6 h-6 text-primary" />
                        Physique Vault
                    </h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                        {photos.length} Total Progress Captures
                    </p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    </div>
                ) : photos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <Layout className="w-16 h-16 mb-4" />
                        <p className="font-bold">The Vault is Empty</p>
                        <p className="text-xs max-w-[200px] mt-2">Start tracking your transformation to see your progress here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {photos.map((photo, idx) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-white/5 ring-primary/40 hover:ring-2 transition-all shadow-xl"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <img 
                                    src={photo.photo_url} 
                                    alt="Progress" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-[10px] font-black text-white truncate">{photo.body_part || 'Overall'}</p>
                                    <p className="text-[8px] font-bold text-white/60">{format(new Date(photo.created_at), 'MMM do, yyyy')}</p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/60">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Viewer Portal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <PhotoViewerModal
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onUpdate={loadPhotos}
                        onDelete={async () => {
                            await ProgressService.deleteProgressPhoto(selectedPhoto.id);
                            setSelectedPhoto(null);
                            loadPhotos();
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
