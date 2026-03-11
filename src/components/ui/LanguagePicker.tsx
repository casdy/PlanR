/**
 * @file src/components/ui/LanguagePicker.tsx
 * @description Language switcher button with a globe icon and dropdown.
 */
import { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import type { LangCode } from '../../i18n/translations';
import { LANGUAGES } from '../../i18n/translations';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export const LanguagePicker = () => {
  const { lang, setLang, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => setIsOpen(!isOpen);

  const selectLanguage = (code: LangCode) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleOpen}
        className={cn(
          "rounded-2xl bg-secondary/50 flex items-center gap-2 px-3 h-10 transition-all duration-300",
          isOpen ? "bg-secondary ring-2 ring-primary/20" : ""
        )}
      >
        <Languages className="w-4 h-4 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest hidden xs:inline-block">
          {lang}
        </span>
        <ChevronDown className={cn("w-3 h-3 opacity-40 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "absolute top-full z-[100] mt-2 w-48 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2",
              isRTL ? "left-0" : "right-0"
            )}
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Language</p>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {(Object.entries(LANGUAGES) as [LangCode, string][]).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => selectLanguage(code)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all duration-200 hover:bg-white/5",
                    lang === code ? "text-primary bg-primary/5" : "text-foreground/80"
                  )}
                >
                  <span className={cn(code === 'ar' ? 'font-arabic' : '')}>{name}</span>
                  {lang === code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
