import type { MemeData } from './types';
import { getAllMemes, simpleHash } from './storage';

export interface Collection {
  id: string;
  name: string;
  memeIds: string[];
  createdAt: number;
}

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await chrome.storage.local.get(['collections']);
  return collections || [];
}

export async function createCollection(name: string): Promise<Collection> {
  const collections = await getCollections();
  const collection: Collection = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    memeIds: [],
    createdAt: Date.now()
  };
  collections.push(collection);
  await chrome.storage.local.set({ collections });
  return collection;
}

export async function addMemeToCollection(collectionId: string, memeId: string): Promise<void> {
  const collections = await getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection && !collection.memeIds.includes(memeId)) {
    collection.memeIds.push(memeId);
    await chrome.storage.local.set({ collections });
  }
}

export async function removeMemeFromCollection(collectionId: string, memeId: string): Promise<void> {
  const collections = await getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.memeIds = collection.memeIds.filter(id => id !== memeId);
    await chrome.storage.local.set({ collections });
  }
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const collections = await getCollections();
  const filtered = collections.filter(c => c.id !== collectionId);
  await chrome.storage.local.set({ collections: filtered });
}

export async function renameCollection(collectionId: string, newName: string): Promise<void> {
  const collections = await getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.name = newName;
    await chrome.storage.local.set({ collections });
  }
}

export async function getCollectionMemes(collectionId: string): Promise<MemeData[]> {
  const collections = await getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return [];

  const allMemes = await getAllMemes();
  return collection.memeIds
    .map(id => allMemes.find(m => `meme_${simpleHash(m.text + m.timestamp)}` === id))
    .filter((m): m is MemeData => m !== undefined);
}
