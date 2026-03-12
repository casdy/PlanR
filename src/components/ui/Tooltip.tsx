import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PopoverTooltipProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
}

export const PopoverTooltip: React.FC<PopoverTooltipProps> = ({ 
  children, 
  title, 
  icon: Icon = HelpCircle,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(16, Math.min(window.innerWidth - 300, rect.left + window.scrollX - 140))
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn("inline-flex items-center ml-1.5", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="text-zinc-400 hover:text-primary transition-colors focus:outline-none"
      >
        <Icon className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ 
              position: 'absolute', 
              top: coords.top, 
              left: coords.left,
              zIndex: 1000
            }}
            className="w-[280px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 text-left pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2 border-b border-slate-700 pb-2">
                {title}
              </h4>
            )}
            <div className="text-xs text-slate-300 leading-relaxed font-medium">
              {children}
            </div>
            
            {/* Soft decorative glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none" />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
