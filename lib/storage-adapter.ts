/**
 * Generic storage adapter interface - can be used in any project
 * Provides abstraction over different storage backends
 */

/**
 * Generic storage adapter interface
 */
export interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  getAll(): Promise<Record<string, any>>;
  remove(key: string): Promise<void>;
}

/**
 * Chrome Extension storage adapter implementation
 */
export class ChromeStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<any> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async set(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async getAll(): Promise<Record<string, any>> {
    return chrome.storage.local.get(null);
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }
}
