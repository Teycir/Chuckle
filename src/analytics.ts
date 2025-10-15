import type { MemeData } from './types';

export interface Analytics {
  totalMemes: number;
  topTemplates: Array<{ name: string; count: number }>;
  topTags: Array<{ name: string; count: number }>;
  favoritesCount: number;
  favoritesPercent: number;
  shareStats: { twitter: number; reddit: number; linkedin: number; email: number };
}

export async function getAnalytics(): Promise<Analytics> {
  const data = await chrome.storage.local.get(null);
  const memes = Object.entries(data)
    .filter(([k]) => k.startsWith('meme_'))
    .map(([, v]) => v as MemeData);

  const templates: Record<string, number> = {};
  const tags: Record<string, number> = {};
  let favCount = 0;

  memes.forEach(meme => {
    templates[meme.template] = (templates[meme.template] || 0) + 1;
    if (meme.isFavorite) favCount++;
    meme.tags?.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });

  const topTemplates = Object.entries(templates)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topTags = Object.entries(tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalMemes: memes.length,
    topTemplates,
    topTags,
    favoritesCount: favCount,
    favoritesPercent: memes.length ? Math.round((favCount / memes.length) * 100) : 0,
    shareStats: {
      twitter: (data.share_twitter as number) || 0,
      reddit: (data.share_reddit as number) || 0,
      linkedin: (data.share_linkedin as number) || 0,
      email: (data.share_email as number) || 0
    }
  };
}

export async function exportData(): Promise<void> {
  const data = await chrome.storage.local.get(null);
  const memes = Object.entries(data)
    .filter(([k]) => k.startsWith('meme_'))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const blob = new Blob([JSON.stringify(memes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chuckle-memes-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
