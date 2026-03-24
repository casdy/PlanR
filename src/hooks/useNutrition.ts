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

  /**
   * Compress any image blob to max 1024px (longest side) JPEG.
   * This ensures both camera captures AND uploaded files are small enough for the API.
   */
  const compressBlob = useCallback(async (blob: Blob): Promise<Blob> => {
    const MAX_DIM = 1024;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > MAX_DIM || h > MAX_DIM) {
          const scale = MAX_DIM / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('Compression failed'))),
          'image/jpeg',
          0.7,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for compression'));
      };
      img.src = objectUrl;
    });
  }, []);

  const recognizeFood = useCallback(async (imageBlob: Blob): Promise<NutritionResult> => {
    setLoading(true);
    setError(null);

    try {
      // Compress the image first to keep payload small
      const compressed = await compressBlob(imageBlob);

      // Convert blob to base64 data URL (will be "data:image/jpeg;base64,<data>")
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });

      console.log(`[Vision] Sending image: ${(base64DataUrl.length / 1024).toFixed(0)} KB base64`);

      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64DataUrl })
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
  }, [compressBlob]);

  return { lookupBarcode, recognizeFood, loading, error };
}
