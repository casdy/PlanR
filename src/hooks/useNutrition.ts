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

export function useNutrition() {
  const { getBarcode, saveBarcode } = useCache();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupBarcode = useCallback(async (barcode: string): Promise<NutritionResult | null> => {
    setLoading(true);
    setError(null);

    try {
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

      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (!res.ok) return null;
      const data = await res.json();

      if (data.status !== 1) {
        // Product not found in OFF — return null so scanner can fall back to AI vision
        return null;
      }

      const nutriments = data.product.nutriments || {};
      const result = {
        barcode,
        name: data.product.product_name || 'Unknown Product',
        calories: Math.round(nutriments.energy_kcal ?? nutriments['energy-kcal_100g'] ?? 0),
        protein: parseFloat((nutriments.proteins ?? 0).toFixed(1)),
        carbs: parseFloat((nutriments.carbohydrates ?? 0).toFixed(1)),
        fat: parseFloat((nutriments.fat ?? 0).toFixed(1)),
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
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageBlob);
      const base64data = await base64Promise;

      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64data })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Vision API failed');
      }

      const rawText = await res.text();
      // the api may return markdown wrapped JSON
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      
      const data = JSON.parse(jsonStr.trim());

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
