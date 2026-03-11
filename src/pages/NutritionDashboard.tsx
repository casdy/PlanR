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
import type { FoodProduct } from '../services/offService';
import { logNutrition, getDailyNutritionTotals } from '../engine/nutritionEngine';
import type { DailyNutritionTotals } from '../engine/nutritionEngine';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractMacros(product: FoodProduct) {
  const n = product.nutriments;
  return {
    calories: Math.round(n.energy_kcal ?? 0),
    protein: parseFloat((n.proteins ?? 0).toFixed(1)),
    carbs: parseFloat((n.carbohydrates ?? 0).toFixed(1)),
    fat: parseFloat((n.fat ?? 0).toFixed(1)),
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
  <div className={cn('flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-800/60 border', color)}>
    <div className="text-current opacity-80">{icon}</div>
    <span className="text-lg font-black text-white">{value}</span>
    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{unit}</span>
    <span className="text-[10px] text-slate-500">{label}</span>
  </div>
);

const SplashOverlay: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-teal-500/40">
          <Leaf className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            PLAN<span className="text-teal-400">R</span>
          </h1>
          <p className="text-sm font-semibold text-teal-400 tracking-widest uppercase mt-1">
            {t('nutrition_engine')}
          </p>
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '8rem' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="h-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
        />
      </motion.div>
    </motion.div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export function NutritionDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [showSplash, setShowSplash] = useState(true);
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyNutritionTotals | null>(null);
  const [logStatus, setLogStatus] = useState<'idle' | 'logging' | 'success' | 'error'>('idle');
  const [loadingTotals, setLoadingTotals] = useState(false);

  const fetchDailyTotals = useCallback(async () => {
    if (!user?.id) return;
    setLoadingTotals(true);
    const totals = await getDailyNutritionTotals(user.id);
    setDailyTotals(totals);
    setLoadingTotals(false);
  }, [user?.id]);

  useEffect(() => {
    fetchDailyTotals();
  }, [fetchDailyTotals]);

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
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && <SplashOverlay onDone={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* Main content fades in after splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">{t('nutrition')}</h2>
            <p className="text-xs text-slate-400 font-medium">{t('track_daily_macros')}</p>
          </div>
        </div>

        {/* Search Bar */}
        <NutritionSearchBar
          onResult={handleSingleResult}
          onResults={handleResults}
        />

        {/* Search Results List */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest px-1">
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
                      className="w-full text-left p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-teal-500/40 hover:bg-slate-800 transition-all duration-200 group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">
                        {product.product_name || t('unknown_product')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
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
              className="rounded-3xl bg-slate-800/60 border border-teal-500/20 p-5 space-y-4 shadow-xl shadow-teal-900/20"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white leading-snug flex-1">
                  {selectedProduct.product_name || t('unknown_product')}
                </h3>
                <span className="shrink-0 text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
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
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                {t('todays_totals')}
              </h3>
              <button
                onClick={fetchDailyTotals}
                disabled={loadingTotals}
                className="p-1.5 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all"
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
    </>
  );
}
