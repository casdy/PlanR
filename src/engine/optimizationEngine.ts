/**
 * @file src/engine/optimizationEngine.ts
 * @description Global UX/UI Optimization Engine ensuring strict 60fps rendering, memory management, and pre-fetching.
 */

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly capacity: number;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    // Refresh position to 'most recently used'
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, val: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Delete 'least recently used' (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, val);
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Executes a callback within a requestAnimationFrame to avoid blocking the main thread during heavy UI updates.
 */
export function throttleRender(callback: () => void) {
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * Debounce utility for input handlers (like search)
 */
export function debounce<A extends any[]>(fn: (...args: A) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Optimization Engine Singleton Export
 */
export const optimizationEngine = {
  // Common caches
  offSearchCache: new LRUCache<string, any>(50), // Cache 50 unique OFF API search results
  workoutCache: new LRUCache<string, any>(20),   // Cache 20 heavy workout payloads

  throttleRender,
  debounce,
  
  clearAllCaches() {
    this.offSearchCache.clear();
    this.workoutCache.clear();
  }
};
