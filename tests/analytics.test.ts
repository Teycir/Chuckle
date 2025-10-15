import { getAnalytics, exportData } from '../src/analytics';

describe('Analytics', () => {
  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(undefined)
        }
      }
    } as any;
  });

  test('calculates analytics correctly', async () => {
    const mockData = {
      meme_1: { text: 'Test 1', template: 'Drake', tags: ['funny', 'work'], isFavorite: true },
      meme_2: { text: 'Test 2', template: 'Drake', tags: ['funny'], isFavorite: false },
      meme_3: { text: 'Test 3', template: 'Stonks', tags: ['work'], isFavorite: true },
      share_twitter: 10,
      share_reddit: 5,
      share_facebook: 3
    };
    
    global.chrome.storage.local.get = jest.fn().mockResolvedValue(mockData);
    
    const stats = await getAnalytics();
    
    expect(stats.totalMemes).toBe(3);
    expect(stats.favoritesCount).toBe(2);
    expect(stats.favoritesPercent).toBe(67);
    expect(stats.topTemplates[0]).toEqual({ name: 'Drake', count: 2 });
    expect(stats.topTags[0]).toEqual({ name: 'funny', count: 2 });
    expect(stats.shareStats.twitter).toBe(10);
  });

  test('handles empty data', async () => {
    const stats = await getAnalytics();
    
    expect(stats.totalMemes).toBe(0);
    expect(stats.favoritesCount).toBe(0);
    expect(stats.favoritesPercent).toBe(0);
    expect(stats.topTemplates).toEqual([]);
    expect(stats.topTags).toEqual([]);
  });

  test('exports data as JSON', async () => {
    const mockData = {
      meme_1: { text: 'Test', template: 'Drake' },
      otherKey: 'ignored'
    };
    
    global.chrome.storage.local.get = jest.fn().mockResolvedValue(mockData);
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockClick = jest.fn();
    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        return { click: mockClick, href: '', download: '' } as any;
      }
      return document.createElement(tag);
    }) as any;
    
    await exportData();
    
    expect(mockClick).toHaveBeenCalled();
  });
});
