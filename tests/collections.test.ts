import { createCollection, getCollections, addMemeToCollection, removeMemeFromCollection, deleteCollection, renameCollection } from '../src/collections';

describe('Collections', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
  });

  it('creates a collection', async () => {
    const col = await createCollection('Work Memes');
    expect(col.name).toBe('Work Memes');
    expect(col.memeIds).toEqual([]);
    const collections = await getCollections();
    expect(collections).toContainEqual(col);
  });

  it('adds meme to collection', async () => {
    await chrome.storage.local.set({ collections: [{ id: 'col1', name: 'Test', memeIds: [], createdAt: Date.now() }] });
    await addMemeToCollection('col1', 'meme1');
    const collections = await getCollections();
    expect(collections[0].memeIds).toContain('meme1');
  });

  it('removes meme from collection', async () => {
    await chrome.storage.local.set({ collections: [{ id: 'col1', name: 'Test', memeIds: ['meme1', 'meme2'], createdAt: Date.now() }] });
    await removeMemeFromCollection('col1', 'meme1');
    const collections = await getCollections();
    expect(collections[0].memeIds).toEqual(['meme2']);
  });

  it('deletes collection', async () => {
    await chrome.storage.local.set({
      collections: [
        { id: 'col1', name: 'Test1', memeIds: [], createdAt: Date.now() },
        { id: 'col2', name: 'Test2', memeIds: [], createdAt: Date.now() }
      ]
    });
    await deleteCollection('col1');
    const collections = await getCollections();
    expect(collections).toHaveLength(1);
    expect(collections[0].id).toBe('col2');
  });

  it('renames collection', async () => {
    await chrome.storage.local.set({ collections: [{ id: 'col1', name: 'Old', memeIds: [], createdAt: Date.now() }] });
    await renameCollection('col1', 'New');
    const collections = await getCollections();
    expect(collections[0].name).toBe('New');
  });
});
