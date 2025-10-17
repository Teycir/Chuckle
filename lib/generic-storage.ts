/**
 * Generic storage manager - can be used in any project
 * Provides CRUD operations with prefix-based namespacing
 */

import type { StorageAdapter } from './storage-adapter';

/**
 * Generic storage manager with prefix-based namespacing
 * @template T - Type of data being stored
 */
export class GenericStorage<T> {
  constructor(
    private adapter: StorageAdapter,
    private prefix: string
  ) {}

  /**
   * Saves data with a generated key
   * @param data - Data to save
   * @param hashFn - Function to generate hash from data
   * @returns Generated key
   */
  async save(data: T, hashFn: (d: T) => string): Promise<string> {
    const key = `${this.prefix}_${hashFn(data)}`;
    await this.adapter.set(key, data);
    return key;
  }

  /**
   * Gets data by key
   * @param key - Storage key
   * @returns Data or null if not found
   */
  async get(key: string): Promise<T | null> {
    return this.adapter.get(key);
  }

  /**
   * Gets all data with the prefix
   * @returns Array of all data items
   */
  async getAll(): Promise<T[]> {
    const items = await this.adapter.getAll();
    return Object.entries(items)
      .filter(([k]) => k.startsWith(this.prefix))
      .map(([, v]) => v as T);
  }

  /**
   * Removes data by key
   * @param key - Storage key
   */
  async remove(key: string): Promise<void> {
    await this.adapter.remove(key);
  }

  /**
   * Updates data by key
   * @param key - Storage key
   * @param updates - Partial updates to apply
   */
  async update(key: string, updates: Partial<T>): Promise<void> {
    const data = await this.get(key);
    if (data) {
      await this.adapter.set(key, { ...data, ...updates });
    }
  }
}
