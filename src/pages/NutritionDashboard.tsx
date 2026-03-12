/**
 * @file src/pages/NutritionDashboard.tsx
 * @description The main Nutrition page for PlanR.
 *
 * Features:
 * - A 1.5s Framer Motion splash screen on mount using a teal/mint green accent palette.
 * - A top-anchored NutritionSearchBar for food search and barcode scanning.
 * - Renders search results as selectable food cards.
 * - On selection, shows macro details and a "Log this" button to save to Supabase.
 * - Displays a live Daily Totals panel pulled from the nutritionEngine.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Plus, CheckCircle2, Flame, Dumbbell, Wheat, Droplets, RefreshCw } from 'lucide-react';
import { NutritionSearchBar } from '../components/NutritionSearchBar';
import { NutritionOnboarding } from '../components/NutritionOnboarding';
import { ActivityCheckIn } from '../components/ActivityCheckIn';
import type { FoodProduct } from '../services/offService';
import { logNutrition, getDailyNutritionTotals } from '../engine/nutritionEngine';
import { getNutritionPlan, KG_TO_LBS } from '../engine/calorieEngine';
import type { DailyNutritionTotals } from '../engine/nutritionEngine';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractMacros(product: FoodProduct) {
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

// ─── Sub-components ──────────────────────────────────────────────────────────

const MacroPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}> = ({ icon, label, value, unit, color }) => (
  <div className={cn('flex flex-col items-center gap-1 p-3 rounded-2xl bg-zinc-100 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/50', color)}>
    <div className="text-current opacity-80">{icon}</div>
    <span className="text-lg font-black text-slate-900 dark:text-white">{value}</span>
    <span className="text-[10px] text-zinc-500 dark:text-slate-400 uppercase tracking-widest font-semibold">{unit}</span>
    <span className="text-[10px] text-zinc-400 dark:text-slate-500">{label}</span>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export function NutritionDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyNutritionTotals | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [logStatus, setLogStatus] = useState<'idle' | 'logging' | 'success' | 'error'>('idle');
  const [loadingTotals, setLoadingTotals] = useState(false);

  const fetchDailyTotals = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTotals(true);
    const totals = await getDailyNutritionTotals(user.id);
    setDailyTotals(totals);
    setLoadingTotals(false);
  }, [user?.id]);

  const fetchNutritionPlan = useCallback(async () => {
    if (!user?.id) return;
    const plan = await getNutritionPlan(user.id);
    if (!plan) {
      setShowOnboarding(true);
    } else {
      setNutritionPlan(plan);
      setShowOnboarding(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDailyTotals();
    fetchNutritionPlan();
  }, [fetchDailyTotals, fetchNutritionPlan]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchNutritionPlan();
  };

  const handleResults = (products: FoodProduct[]) => {
    setSearchResults(products);
    setSelectedProduct(null);
    setLogStatus('idle');
  };

  const handleSingleResult = (product: FoodProduct) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setLogStatus('idle');
  };

  const handleSelectProduct = (product: FoodProduct) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setLogStatus('idle');
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
      await fetchDailyTotals();
      setTimeout(() => {
        setSelectedProduct(null);
        setLogStatus('idle');
      }, 2000);
    } else {
      setLogStatus('error');
    }
  };

  const selectedMacros = selectedProduct ? extractMacros(selectedProduct) : null;

  return (
    <>
      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{t('nutrition')}</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 font-medium">{t('track_daily_macros')}</p>
          </div>
        </div>

        {/* Dynamic Budget & Progress */}
        {nutritionPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Calorie Budget Card */}
            <div className="relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-slate-800/80 dark:to-slate-900/80 border border-zinc-200 dark:border-teal-500/20 shadow-xl dark:shadow-2xl dark:shadow-teal-950/20">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Flame className="w-24 h-24 text-teal-600 dark:text-teal-400" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em]">
                  Today's Calorie Budget
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                    {nutritionPlan.targetCalories}
                  </span>
                  <span className="text-sm font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">
                    kcal
                  </span>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-slate-700/50 to-transparent my-4" />
                
                <div className="grid grid-cols-3 w-full gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{nutritionPlan.protein}g</span>
                    <span className="text-[9px] text-zinc-500 dark:text-slate-500 uppercase font-black">Protein</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{nutritionPlan.carbs}g</span>
                    <span className="text-[9px] text-zinc-500 dark:text-slate-500 uppercase font-black">Carbs</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{nutritionPlan.fat}g</span>
                    <span className="text-[9px] text-zinc-500 dark:text-slate-500 uppercase font-black">Fat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weight Progress */}
            <div className="px-1 space-y-3">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest">Goal Progress</h3>
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {(Math.abs(nutritionPlan.biometrics.weight_kg - nutritionPlan.biometrics.goal_weight_kg) * KG_TO_LBS).toFixed(1)}lbs to go
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-widest">
                  <span>{(nutritionPlan.biometrics.weight_kg * KG_TO_LBS).toFixed(1)}lbs</span>
                  <span>{(nutritionPlan.biometrics.goal_weight_kg * KG_TO_LBS).toFixed(1)}lbs</span>
                </div>
                <div className="h-3 bg-zinc-100 dark:bg-slate-800 rounded-full overflow-hidden border border-zinc-200 dark:border-slate-700/50 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Math.abs(nutritionPlan.biometrics.weight_kg - nutritionPlan.biometrics.goal_weight_kg) / 10) * 100)}%` }} // Simplified progress for demo
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_15px_rgba(20,184,166,0.4)] dark:shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                  />
                </div>
              </div>
            </div>

            {/* Daily Check-In */}
            <ActivityCheckIn onLogged={fetchNutritionPlan} />
          </motion.div>
        )}

        {/* Search Bar */}
        {!showOnboarding && (
          <NutritionSearchBar
            onResult={handleSingleResult}
            onResults={handleResults}
          />
        )}

        {/* Search Results List */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-widest px-1">
                {t('search_results', { n: searchResults.length })}
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar rounded-2xl">
                {searchResults.map((product, i) => {
                  const macros = extractMacros(product);
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left p-4 rounded-2xl bg-zinc-50 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-700/50 hover:border-teal-500/40 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all duration-200 group"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                        {product.product_name || t('unknown_product')}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">
                        {macros.calories} kcal · {macros.protein}g protein · {macros.carbs}g carbs · {macros.fat}g fat
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Product Detail Card */}
        <AnimatePresence>
          {selectedProduct && selectedMacros && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-3xl bg-zinc-50 dark:bg-slate-800/60 border border-zinc-200 dark:border-teal-500/20 p-5 space-y-4 shadow-xl dark:shadow-teal-900/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug flex-1">
                    {selectedProduct.product_name || t('unknown_product')}
                  </h3>
                  <span className="shrink-0 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                    {t('per_100g')}
                  </span>
                </div>

              {/* Macro pills */}
              <div className="grid grid-cols-4 gap-2">
                <MacroPill
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label={t('calories')}
                  value={selectedMacros.calories}
                  unit="kcal"
                  color="border-orange-500/20"
                />
                <MacroPill
                  icon={<Dumbbell className="w-4 h-4 text-teal-400" />}
                  label={t('protein')}
                  value={selectedMacros.protein}
                  unit="g"
                  color="border-teal-500/20"
                />
                <MacroPill
                  icon={<Wheat className="w-4 h-4 text-amber-400" />}
                  label={t('carbs')}
                  value={selectedMacros.carbs}
                  unit="g"
                  color="border-amber-500/20"
                />
                <MacroPill
                  icon={<Droplets className="w-4 h-4 text-blue-400" />}
                  label={t('fat')}
                  value={selectedMacros.fat}
                  unit="g"
                  color="border-blue-500/20"
                />
              </div>

              {/* Log button */}
              {user ? (
                <button
                  onClick={handleLog}
                  disabled={logStatus === 'logging' || logStatus === 'success'}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all duration-300',
                    logStatus === 'success'
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : logStatus === 'error'
                      ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                      : 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/25 active:scale-[0.98]'
                  )}
                >
                  {logStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> {t('logged')}
                    </>
                  ) : logStatus === 'logging' ? (
                    t('saving')
                  ) : logStatus === 'error' ? (
                    t('failed_try_again')
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> {t('log_this_food')}
                    </>
                  )}
                </button>
              ) : (
                <p className="text-xs text-slate-400 text-center">{t('sign_in_to_log')}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily Totals Panel */}
        {user && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                {t('todays_totals')}
              </h3>
              <button
                onClick={fetchDailyTotals}
                disabled={loadingTotals}
                className="p-1.5 rounded-xl text-zinc-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/10 transition-all"
                aria-label="Refresh daily totals"
              >
                <RefreshCw className={cn('w-4 h-4', loadingTotals && 'animate-spin')} />
              </button>
            </div>

            {dailyTotals ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-4 gap-2"
              >
                <MacroPill
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label={t('calories')}
                  value={dailyTotals.calories}
                  unit="kcal"
                  color="border-orange-500/20"
                />
                <MacroPill
                  icon={<Dumbbell className="w-4 h-4 text-teal-400" />}
                  label={t('protein')}
                  value={dailyTotals.protein}
                  unit="g"
                  color="border-teal-500/20"
                />
                <MacroPill
                  icon={<Wheat className="w-4 h-4 text-amber-400" />}
                  label={t('carbs')}
                  value={dailyTotals.carbs}
                  unit="g"
                  color="border-amber-500/20"
                />
                <MacroPill
                  icon={<Droplets className="w-4 h-4 text-blue-400" />}
                  label={t('fat')}
                  value={dailyTotals.fat}
                  unit="g"
                  color="border-blue-500/20"
                />
              </motion.div>
            ) : (
              <div className="h-20 rounded-2xl bg-slate-800/40 animate-pulse" />
            )}

            {dailyTotals && (
              <p className="text-xs text-slate-500 text-center">
                {dailyTotals.logCount} {dailyTotals.logCount === 1 ? t('entry_logged_today') : t('entries_logged_today')}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Onboarding Modal */}
      <NutritionOnboarding 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </>
  );
}
