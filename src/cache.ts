import { LRUCache } from '../lib/lru-cache';

export const apiCache = new LRUCache<string>();
export const formattedCache = new LRUCache<string>(100, 3600000); // 1 hour TTL for formatted text
