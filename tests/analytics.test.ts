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
      meme_1: { text: 'Test 1', imageUrl: 'url1', template: 'Drake', timestamp: Date.now(), language: 'English' },
      meme_2: { text: 'Test 2', imageUrl: 'url2', template: 'Drake', timestamp: Date.now(), language: 'English' },
      meme_3: { text: 'Test 3', imageUrl: 'url3', template: 'Surprised Pikachu', timestamp: Date.now(), language: 'English' },
      share_twitter: 10,
      share_reddit: 5,
      share_email: 3
    };
    
    global.chrome.storage.local.get = jest.fn().mockResolvedValue(mockData);
    
    const stats = await getAnalytics();
    
    expect(stats.totalMemes).toBe(3);
    expect(stats.topTemplates[0]).toEqual({ name: 'Drake', count: 2 });
    expect(stats.shareStats.twitter).toBe(10);
    expect(stats.shareStats.email).toBe(3);
  });

  test('handles empty data', async () => {
    const stats = await getAnalytics();
    
    expect(stats.totalMemes).toBe(0);
    expect(stats.topTemplates).toEqual([]);
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
