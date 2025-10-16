import type { MemeData } from './types';

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36);
  return hashStr.padEnd(8, '0').slice(0, 8);
}

export async function saveMeme(memeData: MemeData): Promise<string> {
  const key = `meme_${simpleHash(memeData.text + memeData.timestamp)}`;
  await chrome.storage.local.set({ [key]: memeData });
  return key;
}

export async function getMeme(key: string): Promise<MemeData | null> {
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

export async function getAllMemes(): Promise<MemeData[]> {
  const items = await chrome.storage.local.get(null);
  const memes: MemeData[] = [];
  
  for (const [key, value] of Object.entries(items)) {
    if (key.startsWith('meme_')) {
      memes.push(value as MemeData);
    }
  }
  
  return memes.sort((a, b) => b.timestamp - a.timestamp);
}

export async function removeMeme(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

export async function updateMeme(key: string, updates: Partial<MemeData>): Promise<void> {
  const meme = await getMeme(key);
  if (meme) {
    await chrome.storage.local.set({ [key]: { ...meme, ...updates } });
  }
}
