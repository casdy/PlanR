import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { Button } from './ui/Button';
import { ONBOARDING_SLIDES } from '../constants/uiContent';
import { useUserStore } from '../store/userStore';

export const OnboardingFlow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const setHasSeenOnboarding = useUserStore((state) => state.setHasSeenOnboarding);

  const nextSlide = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      complete();
    }
  };

  const complete = () => setHasSeenOnboarding(true);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col overflow-hidden select-none">
      {/* Skip Button */}
      <button 
        onClick={complete}
        className="absolute top-12 right-6 z-10 text-slate-500 font-bold text-sm hover:text-white transition-colors flex items-center gap-1"
      >
        Skip <X className="w-4 h-4" />
      </button>

      {/* Slides Container */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Icon Circle */}
            <div className="relative mb-12">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-32 h-32 bg-slate-800 rounded-[40px] flex items-center justify-center border border-slate-700 shadow-2xl"
              >
                {React.createElement(ONBOARDING_SLIDES[currentSlide].icon, {
                  className: `w-14 h-14 ${ONBOARDING_SLIDES[currentSlide].primaryColor}`
                })}
              </motion.div>
              {/* Background Glow */}
              <div className={`absolute inset-0 blur-3xl opacity-20 ${ONBOARDING_SLIDES[currentSlide].primaryColor.replace('text', 'bg')}`} />
            </div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-white mb-4 tracking-tight"
            >
              {ONBOARDING_SLIDES[currentSlide].title}
            </motion.h2>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 text-lg leading-relaxed max-w-sm"
            >
              {ONBOARDING_SLIDES[currentSlide].subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Footer */}
      <div className="p-8 pb-12 flex flex-col items-center gap-8">
        {/* Indicators */}
        <div className="flex gap-2">
          {ONBOARDING_SLIDES.map((_, i) => (
            <div 
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <Button 
          onClick={nextSlide}
          className="w-full h-16 rounded-3xl text-lg font-black group"
        >
          {currentSlide === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Continue"}
          <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
