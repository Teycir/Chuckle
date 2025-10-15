import { getMeme, updateMeme, getAllMemes } from './storage';

export async function addTag(memeKey: string, tag: string): Promise<void> {
  const trimmedTag = tag.trim();
  if (!trimmedTag) return;

  const meme = await getMeme(memeKey);
  if (!meme) {
    console.warn(`Cannot add tag: meme ${memeKey} not found`);
    return;
  }

  if (!meme.tags.includes(trimmedTag)) {
    meme.tags.push(trimmedTag);
    await updateMeme(memeKey, { tags: meme.tags });
  }
}

export async function removeTag(memeKey: string, tag: string): Promise<void> {
  const meme = await getMeme(memeKey);
  if (!meme) {
    console.warn(`Cannot remove tag: meme ${memeKey} not found`);
    return;
  }

  const updatedTags = meme.tags.filter(t => t !== tag);
  await updateMeme(memeKey, { tags: updatedTags });
}

export async function getAllTags(): Promise<string[]> {
  const memes = await getAllMemes();
  const tagCount = new Map<string, number>();
  
  memes.forEach(meme => {
    meme.tags.forEach(tag => tagCount.set(tag, (tagCount.get(tag) || 0) + 1));
  });
  
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

export function filterTags(tags: string[], query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return tags.filter(tag => 
    tag.toLowerCase().includes(lowerQuery)
  );
}
