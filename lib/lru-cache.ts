/**
 * Generic LRU Cache - can be used in any project
 * Provides time-based expiration and size-limited caching
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Least Recently Used (LRU) Cache with TTL support
 * @template T - Type of values stored in cache
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  /**
   * Creates a new LRU Cache
   * @param maxSize - Maximum number of entries (default: 100)
   * @param ttlMs - Time to live in milliseconds (default: 3600000 = 1 hour)
   */
  constructor(maxSize: number = 100, ttlMs: number = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  /**
   * Gets a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  /**
   * Sets a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   */
  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  /**
   * Clears all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }
}
