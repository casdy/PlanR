/**
 * @file src/components/PhotoViewerModal.tsx
 * @description Modal for viewing, editing notes, and sharing physique progress photos.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Share2, Calendar, Edit3, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/Button';
import { ProgressService, type ProgressPhoto } from '../services/progressService';
import { useLanguage } from '../hooks/useLanguage';

interface PhotoViewerModalProps {
    photo: ProgressPhoto;
    onClose: () => void;
    onUpdate: () => void;
    onDelete?: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ 
    photo, 
    onClose, 
    onUpdate,
    onDelete
}) => {
    const { t } = useLanguage();
    const [notes, setNotes] = useState(photo.notes || '');
    const [bodyPart, setBodyPart] = useState(photo.body_part || 'Overall');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await ProgressService.updateProgressPhoto(photo.id, {
                notes,
                body_part: bodyPart
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            console.error("Failed to update photo details:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `PlanR Progress - ${bodyPart}`,
                    text: notes || 'Check out my progress on PlanR!',
                    url: photo.photo_url
                });
            } catch (err) {
                console.error("Sharing failed:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(photo.photo_url);
            alert(t('link_copied') || 'Link copied to clipboard!');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden touch-none"
        >
            <div className="relative w-full h-full max-w-5xl flex flex-col md:flex-row bg-zinc-900 overflow-hidden md:rounded-[2.5rem] shadow-2xl border border-white/5">
                
                {/* Image Section */}
                <div className="relative flex-1 bg-black flex items-center justify-center group">
                    <img 
                        src={photo.photo_url} 
                        alt="Progress" 
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Back Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 left-6 w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-all z-50"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center text-primary">
                                <Calendar className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-0.5">Capture Date</p>
                                <p className="text-sm font-bold text-white">
                                    {format(new Date(photo.created_at), 'EEEE, MMMM do, yyyy')}
                                </p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="w-full md:w-[400px] bg-zinc-900 p-8 flex flex-col border-t md:border-t-0 md:border-l border-white/5">
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Target Focus</p>
                                <button 
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-[10px] font-black text-primary hover:text-primary/80 tracking-widest uppercase transition-colors"
                                >
                                    {isEditing ? t('cancel') : <div className="flex items-center gap-1"><Edit3 className="w-3 h-3" /> {t('edit')}</div>}
                                </button>
                            </div>
                            
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={bodyPart}
                                    onChange={(e) => setBodyPart(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-all"
                                    placeholder="e.g. Abs, Back, Overall"
                                />
                            ) : (
                                <h2 className="text-3xl font-black text-white tracking-tighter">{bodyPart}</h2>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Transformation Notes</p>
                            
                            {isEditing ? (
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none"
                                    placeholder="How are you feeling? Note any changes in definition or scale weight..."
                                />
                            ) : (
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    {notes ? (
                                        <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">
                                            "{notes}"
                                        </p>
                                    ) : (
                                        <p className="text-sm text-zinc-600 italic">No notes added yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 space-y-3">
                        {isEditing ? (
                            <Button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black tracking-widest uppercase shadow-xl shadow-primary/20"
                            >
                                {isSaving ? t('saving') : <><Save className="w-4 h-4 mr-2" /> {t('save_details')}</>}
                            </Button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    onClick={handleShare}
                                    variant="secondary"
                                    className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 border-white/5 text-white font-black tracking-widest uppercase"
                                >
                                    <Share2 className="w-4 h-4 mr-2" /> {t('share')}
                                </Button>
                                {onDelete && (
                                    <Button 
                                        onClick={() => {
                                            if (confirm(t('confirm_delete'))) {
                                                onDelete();
                                            }
                                        }}
                                        variant="outline"
                                        className="h-14 rounded-2xl bg-transparent border-red-500/20 text-red-500 hover:bg-red-500/10 font-black tracking-widest uppercase"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
                                    </Button>
                                )}
                            </div>
                        )}
                        
                        {saveSuccess && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-xs"
                            >
                                <Check className="w-3 h-3" /> Successfully saved
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
