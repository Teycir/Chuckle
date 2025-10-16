import type { MemeData } from './types';
import { getAllMemes } from './storage';

export interface TrendingData {
  last7Days: Array<{ template: string; count: number }>;
  mostShared: Array<{ template: string; shares: number }>;
  risingStars: Array<{ template: string; trend: string }>;
  untried: string[];
}

const ALL_TEMPLATES = [
  'Drake', 'Distracted Boyfriend', 'Two Buttons', 'Expanding Brain',
  'Change My Mind', 'Is This a Pigeon?', 'Woman Yelling at Cat',
  'Bernie Sanders', 'Surprised Pikachu', 'This Is Fine',
  'Galaxy Brain', 'Monkey Puppet', 'Batman Slapping Robin',
  'Roll Safe', 'Ancient Aliens', 'Disaster Girl',
  'Success Kid', 'Hide the Pain Harold', 'One Does Not Simply',
  'Mocking SpongeBob'
];

export async function getTrendingData(): Promise<TrendingData> {
  const memes = await getAllMemes();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekAgo = now - (7 * dayMs);
  const twoWeeksAgo = now - (14 * dayMs);

  const recentMemes = memes.filter(m => m.timestamp > weekAgo);
  const olderMemes = memes.filter(m => m.timestamp > twoWeeksAgo && m.timestamp <= weekAgo);

  const recentCounts: Record<string, number> = {};
  recentMemes.forEach(m => {
    recentCounts[m.template] = (recentCounts[m.template] || 0) + 1;
  });

  const last7Days = Object.entries(recentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([template, count]) => ({ template, count }));

  const { share_twitter = 0, share_reddit = 0, share_linkedin = 0, share_email = 0 } = 
    await chrome.storage.local.get(['share_twitter', 'share_reddit', 'share_linkedin', 'share_email']);
  
  const totalShares = share_twitter + share_reddit + share_linkedin + share_email;
  const mostShared = last7Days.map(({ template, count }) => ({
    template,
    shares: Math.round((count / recentMemes.length) * totalShares)
  })).slice(0, 3);

  const olderCounts: Record<string, number> = {};
  olderMemes.forEach(m => {
    olderCounts[m.template] = (olderCounts[m.template] || 0) + 1;
  });

  const risingStars = Object.entries(recentCounts)
    .map(([template, recentCount]) => {
      const olderCount = olderCounts[template] || 0;
      const growth = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 100;
      return { template, growth };
    })
    .filter(({ growth }) => growth > 50)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 3)
    .map(({ template, growth }) => ({
      template,
      trend: growth > 100 ? '🔥' : '📈'
    }));

  const usedTemplates = new Set(memes.map(m => m.template));
  const untried = ALL_TEMPLATES.filter(t => !usedTemplates.has(t)).slice(0, 5);

  return { last7Days, mostShared, risingStars, untried };
}
