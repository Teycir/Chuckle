import type { MemeData } from './types';

const MAX_AGE_DAYS = 90;
const STORAGE_THRESHOLD = 0.8; // 80%
const QUOTA_BYTES = 10 * 1024 * 1024; // 10MB

export async function performCleanup(): Promise<{ removed: number; freedBytes: number }> {
  const items = await chrome.storage.local.get(null);
  const memes: Array<{ key: string; data: MemeData }> = [];
  
  for (const [key, value] of Object.entries(items)) {
    if (key.startsWith('meme_')) {
      memes.push({ key, data: value as MemeData });
    }
  }

  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const toRemove: string[] = [];

  // Age-based cleanup
  for (const { key, data } of memes) {
    if (now - data.timestamp > maxAge) {
      toRemove.push(key);
    }
  }

  // Quota-based cleanup
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  if (bytesInUse > QUOTA_BYTES * STORAGE_THRESHOLD) {
    const nonFavorites = memes
      .filter(m => !toRemove.includes(m.key))
      .sort((a, b) => a.data.timestamp - b.data.timestamp);

    let targetBytes = bytesInUse - (QUOTA_BYTES * 0.6); // Clean to 60%
    for (const { key } of nonFavorites) {
      if (targetBytes <= 0) break;
      const keySize = await chrome.storage.local.getBytesInUse(key);
      toRemove.push(key);
      targetBytes -= keySize;
    }
  }

  if (toRemove.length > 0) {
    const beforeBytes = await chrome.storage.local.getBytesInUse();
    await chrome.storage.local.remove(toRemove);
    const afterBytes = await chrome.storage.local.getBytesInUse();
    return { removed: toRemove.length, freedBytes: beforeBytes - afterBytes };
  }

  return { removed: 0, freedBytes: 0 };
}

export async function shouldCleanup(): Promise<boolean> {
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  return bytesInUse > QUOTA_BYTES * STORAGE_THRESHOLD;
}
