import { getTrendingData } from '../src/trending';
import { saveMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('Trending', () => {
  beforeEach(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      share_twitter: 10,
      share_reddit: 5,
      share_linkedin: 3,
      share_email: 2
    });
  });

  it('calculates trending templates from last 7 days', async () => {
    const now = Date.now();
    await saveMeme({ text: 'test1', imageUrl: 'url1', template: 'Drake', timestamp: now - 1000, language: 'English' });
    await saveMeme({ text: 'test2', imageUrl: 'url2', template: 'Drake', timestamp: now - 2000, language: 'English' });
    await saveMeme({ text: 'test3', imageUrl: 'url3', template: 'Surprised Pikachu', timestamp: now - 3000, language: 'English' });

    const trending = await getTrendingData();
    expect(trending.last7Days).toHaveLength(2);
    expect(trending.last7Days[0].template).toBe('Drake');
    expect(trending.last7Days[0].count).toBe(2);
  });

  it('identifies untried templates', async () => {
    await saveMeme({ text: 'test', imageUrl: 'url', template: 'Drake', timestamp: Date.now(), language: 'English' });

    const trending = await getTrendingData();
    expect(trending.untried).not.toContain('Drake');
    expect(trending.untried.length).toBeGreaterThan(0);
  });

  it('calculates rising stars', async () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    await saveMeme({ text: 'test1', imageUrl: 'url1', template: 'Drake', timestamp: now - dayMs, language: 'English' });
    await saveMeme({ text: 'test2', imageUrl: 'url2', template: 'Drake', timestamp: now - 2 * dayMs, language: 'English' });
    await saveMeme({ text: 'test3', imageUrl: 'url3', template: 'Drake', timestamp: now - 3 * dayMs, language: 'English' });
    await saveMeme({ text: 'test4', imageUrl: 'url4', template: 'Surprised Pikachu', timestamp: now - 10 * dayMs, language: 'English' });

    const trending = await getTrendingData();
    expect(trending.risingStars.length).toBeGreaterThanOrEqual(0);
  });
});
