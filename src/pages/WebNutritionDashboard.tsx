import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Target } from 'lucide-react';
import { WebRingChart } from '../components/nutrition/WebRingChart';
import { WebProgressBar } from '../components/nutrition/WebProgressBar';
import { useNutritionTheme } from '../components/nutrition/WebTheme';
import type { NutritionTargets } from '../types/nutrition';
import { NutritionSearchBar, type UnifiedFoodProduct } from '../components/NutritionSearchBar';
import { NutritionOnboarding } from '../components/NutritionOnboarding';
import { ActivityCheckIn } from '../components/ActivityCheckIn';
import { CameraScanner } from '../components/CameraScanner';
import { logNutrition, getDailyNutritionTotals } from '../engine/nutritionEngine';
import { getNutritionPlan, KG_TO_LBS } from '../engine/calorieEngine';
import type { DailyNutritionTotals } from '../engine/nutritionEngine';
import { generateMorningBriefing } from '../services/insightsService';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { offService } from '../services/offService';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';
import { PopoverTooltip } from '../components/ui/Tooltip';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper to map OFF products to internal types
function extractMacros(product: UnifiedFoodProduct) {
  const n: any = product.nutriments || {};
  // Handle various OFF nutriment naming conventions
  const calories = n.energy_kcal ?? n['energy-kcal_100g'] ?? n['energy-kcal_serving'] ?? 0;
  const protein = n.proteins ?? n.proteins_100g ?? n.proteins_serving ?? 0;
  const carbs = n.carbohydrates ?? n.carbohydrates_100g ?? n.carbohydrates_serving ?? 0;
  const fat = n.fat ?? n.fat_100g ?? n.fat_serving ?? 0;

  return {
    calories: Math.round(calories),
    protein: parseFloat(protein.toFixed(1)),
    carbs: parseFloat(carbs.toFixed(1)),
    fat: parseFloat(fat.toFixed(1)),
  };
}

// Score Badge Component
const ScoreBadge: React.FC<{ type: 'nutri' | 'nova' | 'eco'; value: string | number | undefined }> = ({ type, value }) => {
  if (!value) return null;

  const colors: Record<string, string> = {
    a: 'bg-emerald-600', b: 'bg-emerald-500', c: 'bg-yellow-500', d: 'bg-orange-500', e: 'bg-red-500',
    1: 'bg-emerald-500', 2: 'bg-yellow-500', 3: 'bg-orange-500', 4: 'bg-red-500',
  };

  const labels = { nutri: 'Nutri-Score', nova: 'NOVA', eco: 'Eco-Score' };
  const tooltips = {
    nutri: 'The Nutri-Score indicates the overall nutritional quality of a product from A (best) to E (worst).',
    nova: 'The NOVA group classifies food processing: 1 (unprocessed) to 4 (ultra-processed).',
    eco: 'The Eco-Score measures the environmental impact of a product from A (lowest) to E (highest).'
  };

  const val = String(value).toLowerCase();
  const bgColor = colors[val] || 'bg-zinc-200 dark:bg-zinc-700';

  return (
    <div className="flex flex-col items-center gap-1 group/badge relative">
      <div className="flex items-center gap-1">
        <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 dark:text-zinc-400">{labels[type]}</span>
        <PopoverTooltip title={labels[type]}>
          {tooltips[type]}
        </PopoverTooltip>
      </div>
      <div className={cn("px-2 py-0.5 rounded font-black text-xs uppercase text-white shadow-sm", bgColor)}>
        {val}
      </div>
    </div>
  );
};

const NUTRITION_TARGETS_MOCK: NutritionTargets = { calories: 2500, protein: 180, carbs: 250, fat: 70 };

// Premium Nutrition-Specific Splash
const NutritionSplash: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
           initial={{ opacity: 1 }}
           exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
           transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
           className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] animate-pulse" />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-teal-500/20 mb-8"
          >
            <div className="text-4xl">🥦</div>
          </motion.div>

          <div className="text-center">
             <h1 className="text-4xl font-black tracking-tighter mb-1">
               Fuel<span className="text-teal-500 italic">R</span>
             </h1>
             <p className="text-white/40 text-[8px] font-black tracking-[0.4em] uppercase">
               Synchronising Nutrition...
             </p>
          </div>

          <div className="mt-12 flex gap-3">
             {['🥕', '🥦', '🥬'].map((v, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="text-xl"
                >
                  {v}
                </motion.span>
             ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { Skeleton } from '../components/ui/Skeleton';

export const WebNutritionDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useNutritionTheme();
  const { t } = useLanguage();

  const [searchResults, setSearchResults] = useState<UnifiedFoodProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<UnifiedFoodProduct | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyNutritionTotals | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [logStatus, setLogStatus] = useState<'idle' | 'logging' | 'success' | 'error'>('idle');
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [morningBriefing, setMorningBriefing] = useState<string | null>(null);
  const [briefingTitleKey, setBriefingTitleKey] = useState<string>('morning_briefing');
  const [dismissedBriefing, setDismissedBriefing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Healthier Alternatives State
  const [alternatives, setAlternatives] = useState<UnifiedFoodProduct[]>([]);
  const [isFetchingAlternatives, setIsFetchingAlternatives] = useState(false);

  // Sync daily totals and nutrition plan from Supabase
  const fetchNutritionData = useCallback(async () => {
    if (!user?.id || !isUUID(user.id)) {
      setLoadingTotals(false);
      return;
    }
    setLoadingTotals(true);
    
    try {
      const [totals, plan] = await Promise.all([
        getDailyNutritionTotals(user.id),
        getNutritionPlan(user.id)
      ]);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yTotals = await getDailyNutritionTotals(user.id, yesterday);
      
      const hour = new Date().getHours();
      let greetingKey = 'briefing_greeting_morning';
      let titleKey = 'morning_briefing';

      if (hour >= 12 && hour < 17) {
        greetingKey = 'briefing_greeting_afternoon';
        titleKey = 'afternoon_briefing';
      } else if (hour >= 17 || hour < 5) {
        greetingKey = 'briefing_greeting_evening';
        titleKey = 'evening_briefing';
      }

      const briefing = generateMorningBriefing(yTotals, NUTRITION_TARGETS_MOCK, t, greetingKey);
      
      setDailyTotals(totals);
      setMorningBriefing(briefing);
      setBriefingTitleKey(titleKey);

      if (!plan) {
        setShowOnboarding(true);
      } else {
        setNutritionPlan(plan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTotals(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  useEffect(() => {
    if (!loadingTotals) {
      // If guest, exit splash much faster (1s total)
      // If registered, keep longer for data sync (3s total for nutrition)
      const isGuest = user?.isGuest || !user;
      const exitDelay = isGuest ? 400 : 2500;
      const removeDelay = isGuest ? 800 : 3000;

      const exitTimer = setTimeout(() => {
          setIsExiting(true);
      }, exitDelay);
      
      const removeTimer = setTimeout(() => {
          setShowSplash(false);
      }, removeDelay);
      
      return () => {
          clearTimeout(exitTimer);
          clearTimeout(removeTimer);
      };
    }
  }, [loadingTotals, user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchNutritionData();
  };

  const handleSearchResults = useCallback((products: UnifiedFoodProduct[]) => {
    setSearchResults(products);
    setSelectedProduct(null);
    setLogStatus('idle');
    setHasSearched(true);
  }, []);

  const handleSingleResult = useCallback(async (product: UnifiedFoodProduct) => {
    setSelectedProduct(product);
    setLogStatus('idle');
    setAlternatives([]);

    // Intelligent Deterministic Suggestion (No AI API)
    // If product has a poor nutriscore and a known category, find a better one
    const score = product.nutriscore_grade?.toLowerCase();
    if ((score === 'c' || score === 'd' || score === 'e' || !score) && product.categories) {
      setIsFetchingAlternatives(true);
      try {
        const alts = await offService.getHealthierAlternatives(product.categories);
        // Filter out the exact same product if it snuck in
        setAlternatives(alts.filter((a: UnifiedFoodProduct) => a.product_name !== product.product_name).slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch alternatives", err);
      } finally {
        setIsFetchingAlternatives(false);
      }
    }
  }, []);

  const closeSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
    setHasSearched(false);
    setSelectedProduct(null);
    setAlternatives([]);
  };

  const handleLog = async () => {
    if (!user?.id || !selectedProduct) return;
    setLogStatus('logging');
    const macros = extractMacros(selectedProduct);
    const result = await logNutrition(user.id, {
      food_name: selectedProduct.product_name,
      ...macros,
    });

    if (result.success) {
      setLogStatus('success');
      await fetchNutritionData();
      setTimeout(() => {
        setSelectedProduct(null);
        setLogStatus('idle');
      }, 2000);
    } else {
      setLogStatus('error');
    }
  };

  // Simplified score logic for web
  const rawScore = dailyTotals && nutritionPlan ? (dailyTotals.calories / nutritionPlan.targetCalories) * 100 : 0;
  const nutritionScore = isNaN(rawScore) ? "0.0" : Math.min(rawScore, 100).toFixed(1);

  const remainingWeightRaw = nutritionPlan ? (Math.abs(nutritionPlan.biometrics.weight_kg - nutritionPlan.biometrics.goal_weight_kg) * KG_TO_LBS) : 0;
  const remainingWeight = isNaN(remainingWeightRaw) ? "0.0" : remainingWeightRaw.toFixed(1);

  console.log('[dashboard] stats:', { nutritionScore, remainingWeight });

  return (
    <>
      <NutritionSplash show={showSplash && !isExiting} />

      <AnimatePresence mode="wait">
        {(!showSplash || isExiting) && (
        <motion.div 
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-white p-6 pb-24 max-w-md mx-auto font-sans relative selection:bg-teal-500 selection:text-white"
        >
          {/* Top Search Bar & Camera Button */}
          {!showOnboarding && (
            <section className="mb-6 relative z-40 pt-2 opacity-90 hover:opacity-100 transition-opacity flex gap-2 w-full">
              <div className="flex-1">
                <NutritionSearchBar 
                  onResult={handleSingleResult} 
                  onResults={handleSearchResults} 
                  onSearching={setIsSearching}
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/40 transition-colors border border-zinc-200 dark:border-white/10"
                aria-label="Scan Food or Barcode"
              >
                <RefreshCw className="w-5 h-5 hidden" /> {/* For padding matching */}
                <span className="text-xl">📷</span>
              </button>
            </section>
          )}

          {/* Header */}
      <header className="relative z-10 mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('nutrition_score')}</h2>
            <PopoverTooltip title={t('nutrition_score')}>
              Your daily Nutrition Score reflects how well you are staying within your calorie and macro targets. A higher score indicates better adherence to your personalized plan.
            </PopoverTooltip>
          </div>
          <div className="flex items-baseline gap-2">
            {loadingTotals ? (
              <Skeleton className="h-14 w-24" />
            ) : (
              <>
                <span className="text-6xl font-black text-slate-900 dark:text-white">{nutritionScore}</span>
                <span className="text-zinc-500 dark:text-zinc-500 font-bold">/ 100</span>
              </>
            )}
          </div>
        </div>
        <button 
          onClick={fetchNutritionData}
          className={cn("p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-transform active:scale-90", loadingTotals && "animate-spin")}
        >
          <RefreshCw className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </button>
      </header>

      {/* Calorie Engine Hero */}
      {nutritionPlan && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-8 space-y-8"
        >
          <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.04] dark:opacity-[0.04] pointer-events-none">
              <Target className="w-32 h-32 text-teal-600 dark:text-teal-500" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-[0.4em]">
                  Daily Budget
                </span>
                <PopoverTooltip title="Daily Budget">
                  Your daily calorie budget is calculated based on your BMR, activity level, and weight goals.
                </PopoverTooltip>
              </div>
              <div className="flex items-baseline gap-2">
                {loadingTotals ? (
                  <Skeleton className="h-16 w-32" />
                ) : (
                  <>
                    <span className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
                      {nutritionPlan?.targetCalories}
                    </span>
                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
                      kcal
                    </span>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-3 w-full max-w-[240px] gap-4 mt-8 pt-8 border-t border-zinc-200 dark:border-white/5">
                <div className="flex flex-col">
                  {loadingTotals ? <Skeleton className="h-4 w-10 mb-1" /> : <span className="text-sm font-black text-slate-900 dark:text-white">{nutritionPlan.protein}g</span>}
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-tighter">Protein</span>
                </div>
                <div className="flex flex-col">
                  {loadingTotals ? <Skeleton className="h-4 w-10 mb-1" /> : <span className="text-sm font-black text-slate-900 dark:text-white">{nutritionPlan.carbs}g</span>}
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-tighter">Carbs</span>
                </div>
                <div className="flex flex-col">
                  {loadingTotals ? <Skeleton className="h-4 w-10 mb-1" /> : <span className="text-sm font-black text-slate-900 dark:text-white">{nutritionPlan.fat}g</span>}
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-tighter">Fat</span>
                </div>
              </div>
            </div>
          </div>

          <ActivityCheckIn onLogged={fetchNutritionData} />

              {/* Weight Progress */}
              <div className="px-2 space-y-4">
                  <div className="flex justify-between items-end">
                    <h3 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Goal Track</h3>
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-500 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 uppercase tracking-widest">
                      {remainingWeight}lbs Remaining
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
                      <span>{nutritionPlan ? (nutritionPlan.biometrics.weight_kg * KG_TO_LBS).toFixed(1) : '–'}lbs</span>
                      <span>{nutritionPlan ? (nutritionPlan.biometrics.goal_weight_kg * KG_TO_LBS).toFixed(1) : '–'}lbs</span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (Math.abs(nutritionPlan.biometrics.weight_kg - nutritionPlan.biometrics.goal_weight_kg) / 10) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-teal-600 to-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.3)] dark:shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                      />
                    </div>
                  </div>
                </div>
        </motion.div>
      )}

      {/* Morning Briefing Card */}
      <AnimatePresence>
        {morningBriefing && !dismissedBriefing && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 p-4 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-3xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start gap-3 relative z-10">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-1 block">{t(briefingTitleKey as any)}</span>
                <p className="text-sm font-medium text-teal-900 dark:text-teal-50 leading-relaxed">{morningBriefing}</p>
              </div>
              <button 
                onClick={() => setDismissedBriefing(true)}
                className="text-teal-600/50 dark:text-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 p-1"
                aria-label="Dismiss Briefing"
              >
                ×
              </button>
            </div>
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up Modal: Unified Search & Detail */}
      {createPortal(
        <AnimatePresence>
          {(searchResults.length > 0 || isSearching || (hasSearched && searchResults.length === 0) || selectedProduct) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col pointer-events-auto"
            >
              {/* Backdrop Blur Layer */}
              <div 
                className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl"
                onClick={closeSearch}
              />
              
              {/* Modal Content container */}
              <div className="relative z-10 w-full max-w-md mx-auto flex flex-col h-full pt-[140px] pb-6 px-6">
                 {/* Close Button Header */}
                  <div className="flex justify-end mb-4">
                     <button 
                       onClick={closeSearch}
                       className="text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-2 rounded-full backdrop-blur-md transition-colors"
                     >
                       <span className="sr-only">Close</span>
                       ×
                     </button>
                  </div>

                 <AnimatePresence mode="wait">
                   {selectedProduct ? (
                     <motion.div
                       key="detail"
                       initial={{ opacity: 0, scale: 0.95, y: 20 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: -20 }}
                       transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                       className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl dark:shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col flex-1 max-h-[85vh] overflow-hidden"
                     >
                        <div className="overflow-y-auto no-scrollbar p-8 relative h-full flex flex-col pt-12">
                          {/* Top Fade Mask */}
                          <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white via-white/80 dark:from-zinc-900 dark:via-zinc-900/80 to-transparent z-20 pointer-events-none" />

                          <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex-1 pr-4">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-500 mb-2 block">{t('product_detail')}</span>
                              <h4 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">{selectedProduct.product_name}</h4>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 truncate">{selectedProduct.brands} · {selectedProduct.quantity}</p>
                            </div>
                            <button 
                              onClick={() => setSelectedProduct(null)} 
                              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
                              aria-label="Back"
                            >
                              ←
                            </button>
                          </div>
                          
                          <div className="flex gap-8 mb-8 relative z-10">
                             {/* Product Image */}
                             <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-inner flex-shrink-0">
                                {selectedProduct.image_url ? (
                                  <img src={selectedProduct.image_url} alt={selectedProduct.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-900 font-black text-4xl italic uppercase">NO</div>
                                )}
                             </div>

                             {/* Meta Scores */}
                             <div className="flex flex-col justify-between py-1">
                                <ScoreBadge type="nutri" value={selectedProduct.nutriscore_grade} />
                                <ScoreBadge type="nova" value={selectedProduct.nova_group} />
                                <ScoreBadge type="eco" value={selectedProduct.ecoscore_grade} />
                             </div>
                          </div>

                          {/* Macro Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                            <div className="bg-zinc-50 dark:bg-zinc-950/80 p-5 rounded-3xl border border-zinc-200 dark:border-white/5 backdrop-blur-md">
                              <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-widest mb-2">{t('calories')}</div>
                              <div className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{extractMacros(selectedProduct).calories} <span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">kcal</span></div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-950/80 p-5 rounded-3xl border border-zinc-200 dark:border-white/5 backdrop-blur-md">
                              <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-widest mb-2">{t('protein')}</div>
                              <div className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{extractMacros(selectedProduct).protein}<span className="text-xs font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight ml-1">g</span></div>
                            </div>
                          </div>

                          {/* Non-AI Intelligent Alternatives */}
                          <AnimatePresence>
                            {(isFetchingAlternatives || alternatives.length > 0) && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 exit={{ opacity: 0, height: 0 }}
                                 className="mb-8 relative z-10"
                               >
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    {t('better_for_you_alternatives')}
                                    <PopoverTooltip title={t('better_for_you_alternatives')}>
                                      We analyze thousands of products to find healthier swaps within the same category that have better Nutri-Scores and lower processing levels.
                                    </PopoverTooltip>
                                  </div>
                                  
                                  {isFetchingAlternatives ? (
                                    <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 rounded-2xl flex items-center justify-center gap-3">
                                      <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('finding_healthier_matches')}</span>
                                    </div>
                                  ) : (
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                                      {alternatives.map((alt, i) => (
                                        <button 
                                          key={i}
                                          onClick={() => handleSingleResult(alt)}
                                          className="snap-start flex-shrink-0 w-48 bg-emerald-500/5 dark:bg-emerald-950/30 border border-emerald-500/10 dark:border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 dark:hover:bg-emerald-900/30 transition-all rounded-2xl p-3 text-left flex flex-col gap-2 relative overflow-hidden group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 flex-shrink-0">
                                              {alt.image_small_url ? (
                                                <img src={alt.image_small_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                              ) : <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-300 dark:text-zinc-700 italic font-black">NO IMG</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{alt.product_name}</div>
                                              <div className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{alt.brands || 'Unknown'}</div>
                                            </div>
                                          </div>
                                          <div className="mt-auto flex items-center justify-between">
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/10 rounded-md">
                                              Nutri-Score {alt.nutriscore_grade?.toUpperCase() || '?'}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{Math.round(extractMacros(alt).calories)} kcal</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                               </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Detailed Metadata Toggle (Fake but looks real) */}
                          <div className="space-y-4 mb-4 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 relative z-10 bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-2">
                              <span className="uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-black text-[9px]">{t('category')}</span>
                              <span className="text-right truncate max-w-[150px] text-slate-800 dark:text-zinc-300">{selectedProduct.categories?.split(',')[0]}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-white/5 pb-2">
                              <span className="uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-black text-[9px]">{t('serving')}</span>
                              <span className="text-slate-800 dark:text-zinc-300">{selectedProduct.serving_size || '100g'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-black text-[9px]">{t('barcode')}</span>
                              <span className="font-mono text-slate-800 dark:text-zinc-300">{selectedProduct.code || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Deep Dive: Ingredients & Allergens */}
                          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-3xl border border-zinc-200 dark:border-white/5 mb-8 relative z-10">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-500 rounded-full" />
                               {t('deep_dive_analysis')}
                            </h5>
                            
                            {selectedProduct.ingredients_text && (
                              <div className="mb-5">
                                <span className="text-xs font-bold text-slate-800 dark:text-white mb-1 block">{t('ingredients')}</span>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed hover:text-zinc-600 dark:hover:text-zinc-300">
                                  {selectedProduct.ingredients_text.length > 200 ? `${selectedProduct.ingredients_text.substring(0, 200)}...` : selectedProduct.ingredients_text}
                                </p>
                              </div>
                            )}

                            {selectedProduct.allergens && (
                              <div className="mb-5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1 block">{t('warnings_allergens')}</span>
                                <div className="flex flex-wrap gap-2">
                                  {selectedProduct.allergens.split(',').map((allergen, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-[10px] font-bold border border-red-500/20">
                                      {allergen.replace('en:', '').trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedProduct.additives_tags && selectedProduct.additives_tags.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 block">{t('additives')}</span>
                                <div className="flex flex-wrap gap-2">
                                  {selectedProduct.additives_tags.slice(0, 5).map((additive, i) => (
                                    <span key={i} className="px-2 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md text-[10px] font-bold border border-orange-500/20">
                                      {additive.replace('en:', '').trim()}
                                    </span>
                                  ))}
                                  {selectedProduct.additives_tags.length > 5 && (
                                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md text-[10px] font-bold">
                                      +{selectedProduct.additives_tags.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {(!selectedProduct.ingredients_text && !selectedProduct.allergens && (!selectedProduct.additives_tags || selectedProduct.additives_tags.length === 0)) && (
                               <p className="text-[11px] text-zinc-500 italic">{t('no_granular_data')}</p>
                            )}
                          </div>

                          {/* External Link */}
                          {selectedProduct.code && (
                            <a 
                              href={`https://world.openfoodfacts.org/product/${selectedProduct.code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8"
                            >
                              {t('view_full_data_open_food_facts')}
                            </a>
                          )}

                          <button
                             onClick={handleLog}
                             disabled={logStatus === 'logging' || logStatus === 'success'}
                             className={cn(
                               "w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all relative z-10 mt-auto shrink-0",
                               logStatus === 'success' ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                               logStatus === 'logging' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed" :
                               "bg-teal-600 dark:bg-teal-500 text-white active:scale-95 shadow-teal-500/20 hover:shadow-teal-500/30 ring-1 ring-white/20"
                             )}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {logStatus === 'logging' && <RefreshCw className="w-4 h-4 animate-spin" />}
                              {logStatus === 'success' ? t('product_logged') : logStatus === 'logging' ? t('logging') : t('confirm_log_entry')}
                            </div>
                          </button>
                        </div>
                     </motion.div>
                   ) : (
                     <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-2xl dark:shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col flex-1 max-h-[80vh]"
                      >
                        <div className="overflow-y-auto no-scrollbar p-2">
                          {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500 dark:text-zinc-400">
                              <RefreshCw className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-500" />
                              <span className="text-xs font-black uppercase tracking-widest">{t('searching_database')}</span>
                            </div>
                         ) : searchResults.length > 0 ? (
                            searchResults.map((p, i) => (
                              <button
                                key={i}
                                onClick={() => handleSingleResult(p)}
                                className="w-full text-left p-4 rounded-3xl hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50 flex items-center gap-5 group mb-2 last:mb-0"
                              >
                               {/* Thumbnail */}
                               <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/5 flex-shrink-0 relative shadow-inner">
                                 {p.image_small_url ? (
                                   <img src={p.image_small_url} alt={p.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-800 font-black text-xs text-center leading-none italic uppercase">NO<br/>IMG</div>
                                 )}
                                 {p.source === 'database' && (
                                   <div className="absolute inset-0 bg-teal-500/10 flex items-center justify-center">
                                      <span className="bg-teal-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_teal]" />
                                   </div>
                                 )}
                               </div>

                               <div className="flex-1 min-w-0 pr-2">
                                 <div className="font-bold text-base text-slate-900 dark:text-white truncate leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{p.product_name}</div>
                                 <div className="flex items-center gap-2 mt-1.5">
                                   <span className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-wider">{p.brands || 'Unknown Brand'}</span>
                                   <span className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                   <span className="text-[11px] text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md font-bold tracking-wider">{p.nutriments?.energy_kcal ? `${Math.round(p.nutriments.energy_kcal)} kcal` : 'N/A'}</span>
                                 </div>
                               </div>

                               {p.source === 'database' && (
                                 <span className="px-2 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-md text-[9px] font-black uppercase tracking-widest flex-shrink-0">
                                   History
                                 </span>
                               )}
                             </button>
                            ))
                         ) : hasSearched ? (
                            <div className="py-20 px-8 text-center flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mb-4 border border-zinc-200 dark:border-white/5">
                                 <span className="text-2xl">🔍</span>
                              </div>
                              <p className="text-slate-900 dark:text-zinc-300 text-sm font-black uppercase tracking-widest mb-2">{t('no_products_found')}</p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium max-w-[200px]">{t('try_different_keywords')}</p>
                            </div>
                         ) : null}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Onboarding Modal Overlay */}
      <NutritionOnboarding 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />

      {/* Camera Scanner Modal Overlay */}
      {showScanner && (
        <CameraScanner
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
             setShowScanner(false);
             fetchNutritionData();
          }}
        />
      )}

      {/* Ring Section */}
      <section className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-[40px] mb-8 flex flex-col items-center border border-zinc-100 dark:border-zinc-800">
        <WebRingChart 
          current={dailyTotals?.calories || 0} 
          target={nutritionPlan?.targetCalories || NUTRITION_TARGETS_MOCK.calories} 
        />
        <p className="mt-8 text-lg font-bold text-center leading-snug text-slate-900 dark:text-white">
          {dailyTotals && dailyTotals.calories > 0 
            ? t('your_journey_moving') 
            : t('lets_log_first_meal')}
        </p>
      </section>

      {/* Macro Stats Section */}
      <section className="bg-zinc-50 dark:bg-zinc-900/80 rounded-3xl p-6 mb-8 border border-zinc-100 dark:border-zinc-800">
        <WebProgressBar 
          label={t('protein')} 
          current={dailyTotals?.protein || 0} 
          target={nutritionPlan?.protein || NUTRITION_TARGETS_MOCK.protein} 
          color={theme.colors.protein} 
        />
        <WebProgressBar 
          label={t('carbs')} 
          current={dailyTotals?.carbs || 0} 
          target={nutritionPlan?.carbs || NUTRITION_TARGETS_MOCK.carbs} 
          color={theme.colors.carbs} 
        />
        <WebProgressBar 
          label={t('fat')} 
          current={dailyTotals?.fat || 0} 
          target={nutritionPlan?.fat || NUTRITION_TARGETS_MOCK.fat} 
          color={theme.colors.fat} 
        />
      </section>

      {dailyTotals && (
        <div className="text-center text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-[0.3em]">
          {dailyTotals.logCount} {t('entries_recorded_today')}
        </div>
      )}
    </motion.div>
        )}
      </AnimatePresence>
    </>
);
};
