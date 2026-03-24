// src/hooks/useNutrition.ts
import { useState, useCallback } from 'react';
import { useCache } from './useCache';

export type NutritionResult = {
  barcode?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  timestamp?: number;
};

// OFF proxy path — routed by Vite dev proxy or Vercel rewrite
const OFF_BASE = '/api/off';

export function useNutrition() {
  const { getBarcode, saveBarcode } = useCache();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupBarcode = useCallback(async (barcode: string): Promise<NutritionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Check local cache first
      const cached = await getBarcode(barcode);
      if (cached) {
        setLoading(false);
        return {
          barcode: cached.barcode,
          name: cached.name,
          calories: cached.calories,
          protein: cached.protein,
          carbs: cached.carbs,
          fat: cached.fat,
          timestamp: cached.timestamp
        };
      }

      // 2. Lookup via OFF proxy (avoids CORS)
      const res = await fetch(`${OFF_BASE}/api/v2/product/${barcode}?fields=product_name,nutriments`);
      if (!res.ok) return null;
      const data = await res.json();

      if (data.status !== 1 || !data.product) {
        return null;
      }

      const nutriments = data.product.nutriments || {};
      const result = {
        barcode,
        name: data.product.product_name || 'Unknown Product',
        calories: Math.round(
          nutriments.energy_kcal ??
          nutriments['energy-kcal'] ??
          nutriments['energy-kcal_100g'] ??
          0
        ),
        protein: parseFloat((nutriments.proteins ?? nutriments.proteins_100g ?? 0).toFixed(1)),
        carbs: parseFloat((nutriments.carbohydrates ?? nutriments.carbohydrates_100g ?? 0).toFixed(1)),
        fat: parseFloat((nutriments.fat ?? nutriments.fat_100g ?? 0).toFixed(1)),
        timestamp: Date.now(),
      };

      await saveBarcode(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getBarcode, saveBarcode]);

  const recognizeFood = useCallback(async (imageBlob: Blob): Promise<NutritionResult> => {
    setLoading(true);
    setError(null);

    try {
      // Convert blob to base64 data URL
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64data })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Vision API failed (${res.status})`);
      }

      // Backend already returns parsed JSON — no need to strip markdown wrappers
      const data = await res.json();

      return {
        name: data.productName || 'Recognized Food',
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fats || data.fat || 0,
        ingredients: data.ingredients || []
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Food recognition failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupBarcode, recognizeFood, loading, error };
}
