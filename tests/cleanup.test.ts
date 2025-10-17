import { performCleanup, shouldCleanup } from '../src/cleanup';
import type { MemeData } from '../src/types';

describe('Cleanup', () => {
  let mockStorage: { [key: string]: any };

  beforeEach(() => {
    mockStorage = {};
    
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys) => {
            if (keys === null) {
              return Promise.resolve(mockStorage);
            }
            if (typeof keys === 'string') {
              return Promise.resolve({ [keys]: mockStorage[keys] });
            }
            return Promise.resolve({});
          }),
          set: jest.fn((items) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
          remove: jest.fn((keys) => {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach(key => delete mockStorage[key]);
            return Promise.resolve();
          }),
          getBytesInUse: jest.fn((keys?: any) => {
            if (keys) {
              const keyArray = Array.isArray(keys) ? keys : [keys];
              let size = 0;
              keyArray.forEach(key => {
                if (mockStorage[key]) {
                  size += JSON.stringify(mockStorage[key]).length;
                }
              });
              return Promise.resolve(size);
            }
            return Promise.resolve(JSON.stringify(mockStorage).length);
          })
        }
      }
    } as any;
  });

  describe('performCleanup', () => {
    it('removes memes older than 90 days', async () => {
      const now = Date.now();
      const oldMeme: MemeData = {
        text: 'old',
        imageUrl: 'url1',
        template: 'drake',
        timestamp: now - 91 * 24 * 60 * 60 * 1000,
        language: 'English'
      };
      const newMeme: MemeData = {
        text: 'new',
        imageUrl: 'url2',
        template: 'drake',
        timestamp: now,
        language: 'English'
      };

      mockStorage['meme_1'] = oldMeme;
      mockStorage['meme_2'] = newMeme;

      const result = await performCleanup();

      expect(result.removed).toBe(1);
      expect(mockStorage['meme_1']).toBeUndefined();
      expect(mockStorage['meme_2']).toBeDefined();
    });

    it('removes oldest memes when storage exceeds 80%', async () => {
      const now = Date.now();
      
      for (let i = 0; i < 5; i++) {
        mockStorage[`meme_${i}`] = {
          text: `meme ${i}`,
          imageUrl: `url${i}`,
          template: 'drake',
          timestamp: now - i * 1000,
          language: 'English'
        };
      }

      // Mock high storage usage
      (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(8.5 * 1024 * 1024);

      const result = await performCleanup();

      expect(result.removed).toBeGreaterThan(0);
    });

    it('returns zero when no cleanup needed', async () => {
      const now = Date.now();
      mockStorage['meme_1'] = {
        text: 'recent',
        imageUrl: 'url',
        template: 'drake',
        timestamp: now,
        language: 'English'
      };

      const result = await performCleanup();

      expect(result.removed).toBe(0);
      expect(result.freedBytes).toBe(0);
    });
  });

  describe('shouldCleanup', () => {
    it('returns true when storage exceeds 80%', async () => {
      (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(8.5 * 1024 * 1024);
      expect(await shouldCleanup()).toBe(true);
    });

    it('returns false when storage is below 80%', async () => {
      (chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(5 * 1024 * 1024);
      expect(await shouldCleanup()).toBe(false);
    });
  });
});
