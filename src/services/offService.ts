const OFF_BASE_URL = '/api/off'; 
const PROXY_CDN = '/api/cdn-proxy?url=';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

import { optimizationEngine } from '../engine/optimizationEngine';

const wrapImage = (url?: string) => {
  if (!url) return undefined;
  // If it's already proxied or a relative path, skip
  if (url.startsWith('/api/')) return url;

  // Normalize URL for checking
  const lowerUrl = url.toLowerCase();

  // Use specialized proxies for Open Food Facts domains
  if (lowerUrl.includes('images.openfoodfacts.org') || lowerUrl.includes('images.openfoodfacts.net')) {
    // Handle both http and https versions from the source
    return url.replace(/^https?:\/\/images\.openfoodfacts\.(org|net)/i, '/api/off-images');
  }
  
  if (lowerUrl.includes('static.openfoodfacts.org') || lowerUrl.includes('static.openfoodfacts.net')) {
    return url.replace(/^https?:\/\/static\.openfoodfacts\.(org|net)/i, '/api/off-static');
  }

  // Fallback to generic CDN proxy
  return `${PROXY_CDN}${encodeURIComponent(url)}`;
};

export interface Nutriments {
  energy_kcal?: number;
  proteins?: number;
  carbohydrates?: number;
  fat?: number;
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

const SEARCH_FIELDS = 'product_name,nutriments,image_small_url,image_url,nutriscore_grade,nova_group,ecoscore_grade,brands,quantity,categories,serving_size,code,ingredients_text,allergens,additives_tags';

const inFlightRequests = new Map<string, Promise<FoodProduct[]>>();

export const offService = {
  /**
   * Search for food products by name.
   */
  async searchFoodByName(query: string): Promise<FoodProduct[]> {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    
    // 1. Check Central Optimization Cache
    const cached = optimizationEngine.offSearchCache.get(lowerQuery);
    if (cached) {
      return cached;
    }

    // 2. Check In-Flight Requests (Dedupe)
    if (inFlightRequests.has(lowerQuery)) {
      return inFlightRequests.get(lowerQuery)!;
    }

    // 3. Perform Request
    const promise = (async () => {
      try {
        // Using the more mature v1 cgi search endpoint which has much better text relevance
        // and natural language matching than v2's strict popularity sort
        const response = await fetch(`${OFF_BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=${SEARCH_FIELDS}&page_size=36`, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to search food: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();
        const products = data.products || [];

        // Client-side Relevance Boosting
        const boostedProducts = products.sort((a, b) => {
          const nameA = (a.product_name || '').toLowerCase();
          const nameB = (b.product_name || '').toLowerCase();

          // 1. Exact Match gets top priority
          if (nameA === lowerQuery && nameB !== lowerQuery) return -1;
          if (nameB === lowerQuery && nameA !== lowerQuery) return 1;

          // 2. Starts With gets second priority
          const startsWithA = nameA.startsWith(lowerQuery);
          const startsWithB = nameB.startsWith(lowerQuery);
          if (startsWithA && !startsWithB) return -1;
          if (startsWithB && !startsWithA) return 1;

          return 0;
        });

        const unifiedProducts = boostedProducts.map(p => ({
          ...p,
          image_url: wrapImage(p.image_url),
          image_small_url: wrapImage(p.image_small_url)
        }));

        optimizationEngine.offSearchCache.set(lowerQuery, unifiedProducts);
        return unifiedProducts;
      } catch (error) {
        console.error('Error fetching food by name:', error);
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
   */
  async getFoodByBarcode(barcode: string): Promise<FoodProduct | null> {
    if (!barcode) return null;

    try {
      const response = await fetch(`${OFF_BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}?fields=${SEARCH_FIELDS}`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product by barcode: ${response.statusText}`);
      }

      const data: BarcodeResponse = await response.json();
      
      if (data.status === 1 && data.product) {
        return {
          ...data.product,
          image_url: wrapImage(data.product.image_url),
          image_small_url: wrapImage(data.product.image_small_url)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching food by barcode:', error);
      throw error;
    }
  },

  /**
   * Deterministic "Intelligent" Alternative Finder (No AI/API keys)
   * Queries Open Food Facts for products in the same category but with Nutri-Score A or B.
   */
  async getHealthierAlternatives(categoryString: string): Promise<FoodProduct[]> {
    if (!categoryString) return [];
    
    // Most specific category is usually the last one in the comma-separated list
    const categories = categoryString.split(',').map(c => c.trim()).filter(Boolean);
    const targetCategory = categories.pop();
    if (!targetCategory) return [];

    try {
      // Query OFF natively for the specific category and filter by top-tier nutrition grades (a or b)
      const url = `${OFF_BASE_URL}/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(targetCategory)}&tagtype_1=nutrition_grades&tag_contains_1=contains&tag_1=A&sort_by=unique_scans_n&page_size=5&json=1&fields=${SEARCH_FIELDS}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) return [];

      const data: SearchResponse = await response.json();
      const products = data.products || [];

      return products.map(p => ({
        ...p,
        image_url: wrapImage(p.image_url),
        image_small_url: wrapImage(p.image_small_url)
      }));
    } catch (error) {
      console.error('Error fetching healthier alternatives:', error);
      return [];
    }
  },

  /**
   * Use Gemini 1.5 Flash Vision to analyze a base64 image of food/barcode.
   */
  async analyzeImage(base64Image: string): Promise<FoodProduct | null> {
    if (!base64Image) return null;

    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`Vision API failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map Gemini Vision result to FoodProduct
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
      console.error('Error in analyzeImage:', error);
      throw error;
    }
  }
};
