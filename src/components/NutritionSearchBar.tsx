/**
 * @file src/components/NutritionSearchBar.tsx
 * @description Pill-shaped nutrition search bar with integrated barcode scanner.
 *
 * - Search only fires on Enter key or explicit button click (rate-limit safe).
 * - Camera icon toggles an inline html5-qrcode scanner below the bar.
 * - On a successful scan, calls getFoodByBarcode and returns the result.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { offService, type FoodProduct } from '../services/offService';
import { searchUserFoodHistory } from '../engine/nutritionEngine';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { NutritionScanner } from './nutrition/NutritionScanner';
import { useLanguage } from '../hooks/useLanguage';

// Unified type for display
export interface UnifiedFoodProduct extends FoodProduct {
  source?: 'database' | 'off';
}

interface NutritionSearchBarProps {
  onResult: (product: UnifiedFoodProduct) => void;
  onResults?: (products: UnifiedFoodProduct[]) => void;
  onSearching?: (isSearching: boolean) => void;
  className?: string;
}

export const NutritionSearchBar: React.FC<NutritionSearchBarProps> = ({
  onResult,
  onResults,
  onSearching,
  className,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UnifiedFoodProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const lastSearchQuery = useRef('');

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search debounce for SUGGESTIONS
  useEffect(() => {
    const trimmed = query.trim();
    
    // Clear suggestions if less than 2 chars
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      lastSearchQuery.current = '';
      return;
    }

    if (trimmed === lastSearchQuery.current) return;

    const timer = setTimeout(async () => {
      lastSearchQuery.current = trimmed;
      setIsFetchingSuggestions(true);
      setShowSuggestions(true);
      
      try {
        // Fast, shallow fetch for suggestions
        const offResults = await offService.searchFoodByName(trimmed);
        const top5 = offResults.slice(0, 5).map(p => ({ ...p, source: 'off' as const }));
        
        let dbResults: UnifiedFoodProduct[] = [];
        if (user?.id) {
          const history = await searchUserFoodHistory(user.id, trimmed);
          dbResults = history.slice(0, 2).map(item => ({
            product_name: item.food_name,
            nutriments: {
              energy_kcal: item.calories,
              proteins: item.protein,
              carbohydrates: item.carbs,
              fat: item.fat
            },
            source: 'database' as const
          }));
        }
        
        setSuggestions([...dbResults, ...top5].slice(0, 6));
      } catch (err) {
         // silently fail suggestions
         setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 200); // 200ms debounce for ultra-fast suggestions

    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    
    setShowSuggestions(false); // Hide suggestions on full search
    setIsLoading(true);
    if (onSearching) onSearching(true);
    setScanError(null);
    try {
      // 1. Search Local History
      let dbResults: UnifiedFoodProduct[] = [];
      if (user?.id) {
        const history = await searchUserFoodHistory(user.id, trimmedQuery);
        dbResults = history.map(item => ({
          product_name: item.food_name,
          nutriments: {
            energy_kcal: item.calories,
            proteins: item.protein,
            carbohydrates: item.carbs,
            fat: item.fat
          },
          source: 'database'
        }));
      }

      // 2. Search Global API
      const offResults = await offService.searchFoodByName(trimmedQuery);
      const unifiedOffResults: UnifiedFoodProduct[] = offResults.map(p => ({ 
        ...p, 
        source: 'off' 
      }));

      // 3. Combine (DB first)
      const combined = [...dbResults, ...unifiedOffResults];
      
      if (onResults) onResults(combined);
    } catch (err) {
      console.error('Search failed:', err);
      setScanError(t('search_failed'));
    } finally {
      setIsLoading(false);
      if (onSearching) onSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      setIsProcessingScan(true);
      setScanError(null);
      try {
        const product = await offService.getFoodByBarcode(decodedText);
        if (product) {
          setIsScanning(false);
          onResult(product);
        } else {
          setScanError(t('no_product_barcode', { code: decodedText }));
        }
      } catch {
         setScanError(t('failed_fetch_barcode'));
      } finally {
        setIsProcessingScan(false);
      }
    },
    [onResult]
  );

  return (
    <div className={cn('w-full space-y-3 relative z-50', className)} ref={searchContainerRef}>
      {/* Pill-shaped Search Input */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-4 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            const nextValue = e.target.value;
            setQuery(nextValue);
            setShowSuggestions(nextValue.trim().length >= 2);
            // We no longer trigger onResults([]) here to prevent the modal from flashing
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('search_food_placeholder')}
          className={cn(
            'w-full pl-12 pr-24 py-3.5 rounded-full',
            'bg-slate-800/80 border border-slate-700/60',
            'text-white placeholder-slate-500 text-sm font-medium',
            'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50',
            'transition-all duration-300'
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {/* Barcode scanner toggle */}
          <button
            type="button"
            onClick={() => setIsScanning(true)}
            aria-label="Scan barcode"
            className={cn(
              'p-2 rounded-full transition-all duration-300',
              isScanning
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                : 'bg-slate-700/70 text-slate-300 hover:bg-teal-500/20 hover:text-teal-400'
            )}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            aria-label="Search"
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all duration-300',
              'bg-teal-500 text-white shadow-md shadow-teal-500/25',
              'hover:bg-teal-400 active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {t('go')}
          </button>
        </div>
      </div>

      {/* Intelligent Autocomplete Dropdown */}
      <AnimatePresence>
        {showSuggestions && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-12 left-0 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[60]"
          >
            {isFetchingSuggestions ? (
              <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-semibold">{t('finding_matches')}</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-64 overflow-y-auto no-scrollbar">
                {suggestions.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                       setShowSuggestions(false);
                       setQuery(p.product_name || '');
                       onResult(p); // Select directly
                    }}
                    className="w-full text-left p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 flex items-center gap-3 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 flex items-center justify-center text-[8px] font-black text-slate-700 italic border border-white/5">
                      {p.image_small_url ? (
                        <img src={p.image_small_url} alt="" className="w-full h-full object-cover" />
                      ) : 'NO IMG'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:text-teal-400">{p.product_name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.brands || t('unknown')} · {p.nutriments?.energy_kcal ? `${Math.round(p.nutriments.energy_kcal)} kcal` : ''}</div>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={handleSearch}
                  className="w-full p-2 text-xs font-bold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 text-center uppercase tracking-wider transition-colors"
                >
                  {t('view_all_results', { query })} ↗
                </button>
              </div>
            ) : (
               <div className="p-4 text-center text-xs text-slate-500 font-medium">
                 {t('no_direct_matches')}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {scanError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500 dark:text-red-400 px-4 font-bold tracking-wide"
          >
            {scanError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Full-Screen Barcode Scanner Modal (Native ML Kit) */}
      <NutritionScanner
         isOpen={isScanning}
         onClose={() => setIsScanning(false)}
         onScanSuccess={handleScanSuccess}
         isProcessing={isProcessingScan}
      />
    </div>
  );
};
