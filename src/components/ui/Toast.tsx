import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-destructive shrink-0" />,
    info: <Info className="w-5 h-5 text-primary shrink-0" />,
};

const borders = {
    success: 'border-emerald-500/30',
    error: 'border-destructive/30',
    info: 'border-primary/30',
};

export const Toast = () => {
    const { toasts, dismissToast } = useToastStore();

    return createPortal(
        <div className="fixed bottom-28 inset-x-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-card/90 backdrop-blur-xl border shadow-2xl shadow-black/20 max-w-sm w-full ${borders[toast.type]}`}
                    >
                        {icons[toast.type]}
                        <p className="text-sm font-bold flex-1">{toast.message}</p>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>,
        document.body
    );
};
