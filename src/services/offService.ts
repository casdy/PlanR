/**
 * @file src/services/offService.ts
 * @description Open Food Facts service for food search and barcode lookup.
 *
 * API Reference: https://openfoodfacts.github.io/openfoodfacts-server/api/
 *
 * Rate limits (per OFF docs):
 *   - Product lookup:  100 req/min  (GET /api/v2/product/{barcode})
 *   - Search:           10 req/min  (GET /cgi/search.pl)
 *   - Facets:            2 req/min
 *
 * Requests are routed through:
 *   - Dev:  Vite proxy   /api/off → https://world.openfoodfacts.org
 *   - Prod: Vercel rewrite /api/off → https://world.openfoodfacts.org
 *
 * This avoids CORS issues since OFF does not send Access-Control-Allow-Origin
 * for browser-originated requests.
 */

import { optimizationEngine } from '../engine/optimizationEngine';

// ─── Constants ───────────────────────────────────────────────────────────────
// Proxy path — routed to OFF by Vite dev proxy or Vercel rewrite
const OFF_BASE = '/api/off';

const SEARCH_FIELDS = [
  'product_name', 'nutriments', 'image_small_url', 'image_url',
  'nutriscore_grade', 'nova_group', 'ecoscore_grade', 'brands',
  'quantity', 'categories', 'serving_size', 'code',
  'ingredients_text', 'allergens', 'additives_tags'
].join(',');

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Nutriments {
  energy_kcal?: number;
  'energy-kcal_100g'?: number;
  'energy-kcal_serving'?: number;
  proteins?: number;
  proteins_100g?: number;
  carbohydrates?: number;
  carbohydrates_100g?: number;
  fat?: number;
  fat_100g?: number;
}

export interface FoodProduct {
  product_name: string;
  nutriments: Nutriments;
  image_url?: string;
  image_small_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  serving_size?: string;
  code?: string;
  ingredients_text?: string;
  allergens?: string;
  additives_tags?: string[];
  isAiGenerated?: boolean;
}

export interface SearchResponse {
  products: FoodProduct[];
  count: number;
  page: number;
}

export interface BarcodeResponse {
  product?: FoodProduct;
  status: number;
  status_verbose: string;
}

// ─── Deduplication ───────────────────────────────────────────────────────────
const inFlightRequests = new Map<string, Promise<FoodProduct[]>>();

// ─── Service ─────────────────────────────────────────────────────────────────
export const offService = {
  /**
   * Search for food products by name.
   * OFF search rate limit: 10 req/min — caller should debounce ≥ 600ms.
   */
  async searchFoodByName(query: string): Promise<FoodProduct[]> {
    if (!query) return [];

    const lowerQuery = query.toLowerCase().trim();

    // 1. Check in-memory cache
    const cached = optimizationEngine.offSearchCache.get(lowerQuery);
    if (cached) return cached;

    // 2. Deduplicate in-flight requests
    if (inFlightRequests.has(lowerQuery)) {
      return inFlightRequests.get(lowerQuery)!;
    }

    // 3. Fetch from OFF via proxy
    const promise = (async () => {
      try {
        const params = new URLSearchParams({
          search_terms: query,
          search_simple: '1',
          action: 'process',
          json: '1',
          fields: SEARCH_FIELDS,
          page_size: '24',
        });

        const response = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`);

        if (!response.ok) {
          throw new Error(`OFF search failed: ${response.status}`);
        }

        const data: SearchResponse = await response.json();
        const products = (data.products || []).filter(p => p.product_name);

        // Client-side relevance boost
        products.sort((a, b) => {
          const nameA = (a.product_name || '').toLowerCase();
          const nameB = (b.product_name || '').toLowerCase();

          if (nameA === lowerQuery && nameB !== lowerQuery) return -1;
          if (nameB === lowerQuery && nameA !== lowerQuery) return 1;

          const startsA = nameA.startsWith(lowerQuery);
          const startsB = nameB.startsWith(lowerQuery);
          if (startsA && !startsB) return -1;
          if (startsB && !startsA) return 1;

          return 0;
        });

        optimizationEngine.offSearchCache.set(lowerQuery, products);
        return products;
      } catch (error) {
        console.error('[OFF] Search error:', error);
        throw error;
      } finally {
        inFlightRequests.delete(lowerQuery);
      }
    })();

    inFlightRequests.set(lowerQuery, promise);
    return promise;
  },

  /**
   * Get a food product by its barcode.
   * OFF product rate limit: 100 req/min.
   */
  async getFoodByBarcode(barcode: string): Promise<FoodProduct | null> {
    if (!barcode) return null;

    try {
      const response = await fetch(
        `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}?fields=${SEARCH_FIELDS}`
      );

      if (!response.ok) return null;

      const data: BarcodeResponse = await response.json();

      if (data.status === 1 && data.product) {
        return data.product;
      }

      return null;
    } catch (error) {
      console.error('[OFF] Barcode lookup error:', error);
      return null;
    }
  },

  /**
   * Find healthier alternatives in the same category (Nutri-Score A/B).
   */
  async getHealthierAlternatives(categoryString: string): Promise<FoodProduct[]> {
    if (!categoryString) return [];

    const categories = categoryString.split(',').map(c => c.trim()).filter(Boolean);
    const targetCategory = categories.pop();
    if (!targetCategory) return [];

    try {
      const params = new URLSearchParams({
        action: 'process',
        tagtype_0: 'categories',
        tag_contains_0: 'contains',
        tag_0: targetCategory,
        tagtype_1: 'nutrition_grades',
        tag_contains_1: 'contains',
        tag_1: 'A',
        sort_by: 'unique_scans_n',
        page_size: '5',
        json: '1',
        fields: SEARCH_FIELDS,
      });

      const response = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`);

      if (!response.ok) return [];

      const data: SearchResponse = await response.json();
      return (data.products || []).filter(p => p.product_name);
    } catch (error) {
      console.error('[OFF] Alternatives error:', error);
      return [];
    }
  },

  /**
   * Use AI Vision to analyze a base64 image of food/barcode.
   */
  async analyzeImage(base64Image: string): Promise<FoodProduct | null> {
    if (!base64Image) return null;

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`Vision API failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        product_name: data.productName || 'AI Analyzed Food',
        nutriments: {
          energy_kcal: data.calories,
          proteins: data.protein,
          carbohydrates: data.carbs,
          fat: data.fats
        },
        ingredients_text: data.ingredients?.join(', ') || '',
        brands: 'AI Identification',
        isAiGenerated: true,
      };
    } catch (error) {
      console.error('[Vision] Error:', error);
      throw error;
    }
  }
};
