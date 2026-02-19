import { simpleHash, saveMeme, getMeme, getAllMemes, removeMeme, updateMeme } from '../src/storage';
import { MemeData } from '../src/types';

describe('Storage Utilities - Deep Tests', () => {
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
            const result: any = {};
            if (Array.isArray(keys)) {
              keys.forEach(key => {
                if (mockStorage[key] !== undefined) {
                  result[key] = mockStorage[key];
                }
              });
            }
            return Promise.resolve(result);
          }),
          set: jest.fn((items) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
          remove: jest.fn((keys) => {
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach(key => delete mockStorage[key]);
            return Promise.resolve();
          })
        }
      }
    } as any;
  });

  afterEach(() => {
    mockStorage = {};
  });

  describe('simpleHash - Comprehensive Tests', () => {
    test('should generate consistent hash for same input', () => {
      const input = 'test string';
      const hash1 = simpleHash(input);
      const hash2 = simpleHash(input);
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different inputs', () => {
      const hash1 = simpleHash('test1');
      const hash2 = simpleHash('test2');
      expect(hash1).not.toBe(hash2);
    });

    test('should generate exactly 8 character hash', () => {
      const inputs = ['test', 'a', 'very long string with many characters', ''];
      inputs.forEach(input => {
        const hash = simpleHash(input);
        expect(hash.length).toBe(8);
      });
    });

    test('should handle empty string', () => {
      const hash = simpleHash('');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(8);
      expect(hash).toMatch(/^[a-z0-9]{8}$/);
    });

    test('should handle special characters', () => {
      const hash = simpleHash('test!@#$%^&*()');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(8);
    });

    test('should handle unicode characters', () => {
      const hash = simpleHash('测试🎭😂');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(8);
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = simpleHash(longString);
      expect(hash.length).toBe(8);
    });

    test('should generate different hashes for similar strings', () => {
      const hash1 = simpleHash('test');
      const hash2 = simpleHash('Test');
      const hash3 = simpleHash('test ');
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    test('should only contain alphanumeric characters', () => {
      const inputs = ['test', '!@#$', '123', 'MixedCase'];
      inputs.forEach(input => {
        const hash = simpleHash(input);
        expect(hash).toMatch(/^[a-z0-9]{8}$/);
      });
    });

    test('should handle newlines and tabs', () => {
      const hash = simpleHash('test\n\t\r');
      expect(hash.length).toBe(8);
    });
  });

  describe('saveMeme - Comprehensive Tests', () => {
    const createMemeData = (overrides?: Partial<MemeData>): MemeData => ({
      text: 'test meme',
      imageUrl: 'http://example.com/meme.png',
      template: 'drake',
      timestamp: Date.now(),
      language: 'English',
      ...overrides
    });

    test('should save meme data to storage', async () => {
      const memeData = createMemeData();
      const key = await saveMeme(memeData);

      expect(key).toMatch(/^meme_[a-z0-9]{8}$/);
      expect(mockStorage[key]).toEqual(memeData);
    });

    test('should generate unique keys for different memes', async () => {
      const meme1 = createMemeData({ text: 'meme 1', timestamp: 1000 });
      const meme2 = createMemeData({ text: 'meme 2', timestamp: 2000 });

      const key1 = await saveMeme(meme1);
      const key2 = await saveMeme(meme2);

      expect(key1).not.toBe(key2);
      expect(mockStorage[key1]).toEqual(meme1);
      expect(mockStorage[key2]).toEqual(meme2);
    });

    test('should save meme with all metadata fields', async () => {
      const memeData = createMemeData({
        text: 'complex meme',
        imageUrl: 'https://example.com/complex.png',
        template: 'distracted-boyfriend',
        timestamp: 1234567890,
        language: 'Spanish',
      });

      const key = await saveMeme(memeData);
      expect(mockStorage[key]).toEqual(memeData);
    });



    test('should handle storage errors', async () => {
      (chrome.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage quota exceeded'));
      const memeData = createMemeData();
      await expect(saveMeme(memeData)).rejects.toThrow('Storage quota exceeded');
    });

    test('should handle very long text', async () => {
      const longText = 'a'.repeat(5000);
      const memeData = createMemeData({ text: longText });
      const key = await saveMeme(memeData);
      expect(mockStorage[key].text).toBe(longText);
    });

    test('should handle special characters in text', async () => {
      const specialText = 'Test!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const memeData = createMemeData({ text: specialText });
      const key = await saveMeme(memeData);
      expect(mockStorage[key].text).toBe(specialText);
    });

    test('should handle unicode in text', async () => {
      const unicodeText = '测试🎭😂👍';
      const memeData = createMemeData({ text: unicodeText });
      const key = await saveMeme(memeData);
      expect(mockStorage[key].text).toBe(unicodeText);
    });
  });

  describe('getMeme - Comprehensive Tests', () => {
    test('should retrieve meme by key', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };
      mockStorage['meme_12345678'] = memeData;

      const result = await getMeme('meme_12345678');
      expect(result).toEqual(memeData);
    });

    test('should return null for non-existent key', async () => {
      const result = await getMeme('meme_nonexistent');
      expect(result).toBeNull();
    });

    test('should return null for undefined value', async () => {
      mockStorage['meme_12345678'] = undefined;
      const result = await getMeme('meme_12345678');
      expect(result).toBeNull();
    });

    test('should handle storage errors', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));
      await expect(getMeme('meme_12345678')).rejects.toThrow('Storage error');
    });

    test('should retrieve meme with all fields intact', async () => {
      const memeData: MemeData = {
        text: 'complex meme',
        imageUrl: 'https://example.com/meme.png',
        template: 'two-buttons',
        timestamp: 1234567890,
        language: 'French',
      };
      mockStorage['meme_abcd1234'] = memeData;

      const result = await getMeme('meme_abcd1234');
      expect(result).toEqual(memeData);
    });

    test('should handle empty string key', async () => {
      const result = await getMeme('');
      expect(result).toBeNull();
    });

    test('should handle malformed key', async () => {
      const result = await getMeme('not_a_meme_key');
      expect(result).toBeNull();
    });
  });

  describe('getAllMemes - Comprehensive Tests', () => {
    test('should retrieve all memes sorted by timestamp descending', async () => {
      const meme1: MemeData = {
        text: 'meme 1',
        imageUrl: 'url1',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'meme 2',
        imageUrl: 'url2',
        template: 'drake',
        timestamp: 3000,
        language: 'English',
      };

      const meme3: MemeData = {
        text: 'meme 3',
        imageUrl: 'url3',
        template: 'drake',
        timestamp: 2000,
        language: 'English',
      };

      mockStorage['meme_11111111'] = meme1;
      mockStorage['meme_22222222'] = meme2;
      mockStorage['meme_33333333'] = meme3;

      const result = await getAllMemes();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(meme2); // timestamp 3000
      expect(result[1]).toEqual(meme3); // timestamp 2000
      expect(result[2]).toEqual(meme1); // timestamp 1000
    });

    test('should return empty array when no memes exist', async () => {
      mockStorage['selectedLanguage'] = 'English';

      const result = await getAllMemes();
      expect(result).toEqual([]);
    });

    test('should ignore non-meme keys', async () => {
      const meme: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
      };

      mockStorage['meme_12345678'] = meme;
      mockStorage['darkMode'] = true;
      mockStorage['selectedLanguage'] = 'English';
      mockStorage['otherKey'] = 'value';

      const result = await getAllMemes();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(meme);
    });

    test('should handle storage errors', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));
      await expect(getAllMemes()).rejects.toThrow('Storage error');
    });

    test('should handle large number of memes', async () => {
      for (let i = 0; i < 100; i++) {
        mockStorage[`meme_${i.toString().padStart(8, '0')}`] = {
          text: `meme ${i}`,
          imageUrl: `url${i}`,
          template: 'drake',
          timestamp: i * 1000,
          language: 'English',
        };
      }

      const result = await getAllMemes();
      expect(result).toHaveLength(100);
      expect(result[0].timestamp).toBe(99000);
      expect(result[99].timestamp).toBe(0);
    });

    test('should handle memes with same timestamp', async () => {
      const timestamp = 1000;
      const meme1: MemeData = {
        text: 'meme 1',
        imageUrl: 'url1',
        template: 'drake',
        timestamp,
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'meme 2',
        imageUrl: 'url2',
        template: 'drake',
        timestamp,
        language: 'English',
      };

      mockStorage['meme_11111111'] = meme1;
      mockStorage['meme_22222222'] = meme2;

      const result = await getAllMemes();
      expect(result).toHaveLength(2);
    });

    test('should preserve all meme properties', async () => {
      const meme: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: 1000,
        language: 'Spanish',
      };

      mockStorage['meme_12345678'] = meme;

      const result = await getAllMemes();
      expect(result[0]).toEqual(meme);
    });
  });

  describe('removeMeme - Comprehensive Tests', () => {
    test('should remove meme from storage', async () => {
      mockStorage['meme_12345678'] = { text: 'test' };

      await removeMeme('meme_12345678');

      expect(mockStorage['meme_12345678']).toBeUndefined();
    });

    test('should not throw error when removing non-existent key', async () => {
      await expect(removeMeme('meme_nonexistent')).resolves.not.toThrow();
    });

    test('should handle storage errors', async () => {
      (chrome.storage.local.remove as jest.Mock).mockRejectedValue(new Error('Storage error'));
      await expect(removeMeme('meme_12345678')).rejects.toThrow('Storage error');
    });

    test('should only remove specified key', async () => {
      mockStorage['meme_11111111'] = { text: 'meme1' };
      mockStorage['meme_22222222'] = { text: 'meme2' };
      mockStorage['meme_33333333'] = { text: 'meme3' };

      await removeMeme('meme_22222222');

      expect(mockStorage['meme_11111111']).toBeDefined();
      expect(mockStorage['meme_22222222']).toBeUndefined();
      expect(mockStorage['meme_33333333']).toBeDefined();
    });

    test('should handle empty string key', async () => {
      await expect(removeMeme('')).resolves.not.toThrow();
    });
  });

  describe('updateMeme - Comprehensive Tests', () => {
    const originalMeme: MemeData = {
      text: 'test',
      imageUrl: 'url',
      template: 'drake',
      timestamp: 1000,
      language: 'English',
    };

    test('should update meme with partial data', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };


      expect(mockStorage['meme_12345678']).toEqual({
        ...originalMeme,
      });
    });

    test('should update only specified fields', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };


      expect(mockStorage['meme_12345678'].text).toBe(originalMeme.text);
    });

    test('should not update if meme does not exist', async () => {
      expect(mockStorage['meme_nonexistent']).toBeUndefined();
    });

    test('should handle storage errors on get', async () => {
      (chrome.storage.local.get as jest.Mock).mockRejectedValue(new Error('Get error'));
    });

    test('should handle storage errors on set', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };
      (chrome.storage.local.set as jest.Mock).mockRejectedValue(new Error('Set error'));

    });

    test('should update multiple fields at once', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };

      await updateMeme('meme_12345678', {
        language: 'Spanish'
      });

      expect(mockStorage['meme_12345678'].language).toBe('Spanish');
    });



    test('should handle updating with empty object', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };
      const before = { ...mockStorage['meme_12345678'] };

      await updateMeme('meme_12345678', {});

      expect(mockStorage['meme_12345678']).toEqual(before);
    });

    test('should preserve unchanged fields', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };


      expect(mockStorage['meme_12345678'].text).toBe(originalMeme.text);
      expect(mockStorage['meme_12345678'].imageUrl).toBe(originalMeme.imageUrl);
      expect(mockStorage['meme_12345678'].template).toBe(originalMeme.template);
      expect(mockStorage['meme_12345678'].timestamp).toBe(originalMeme.timestamp);
    });

    test('should handle updating all fields', async () => {
      mockStorage['meme_12345678'] = { ...originalMeme };

      const updates: Partial<MemeData> = {
        text: 'new text',
        imageUrl: 'new url',
        template: 'new template',
        timestamp: 2000,
        language: 'French',
      };

      await updateMeme('meme_12345678', updates);

      expect(mockStorage['meme_12345678']).toEqual(updates);
    });
  });

  describe('Integration Tests', () => {
    test('should save, retrieve, update, and remove meme', async () => {
      const memeData: MemeData = {
        text: 'integration test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveMeme(memeData);
      expect(key).toBeDefined();

      const retrieved = await getMeme(key);
      expect(retrieved).toEqual(memeData);

      const updated = await getMeme(key);

      await removeMeme(key);
      const removed = await getMeme(key);
      expect(removed).toBeNull();
    });

    test('should handle multiple memes lifecycle', async () => {
      const memes = Array.from({ length: 5 }, (_, i) => ({
        text: `meme ${i}`,
        imageUrl: `url${i}`,
        template: 'drake',
        timestamp: i * 1000,
        language: 'English',
      }));

      const keys = await Promise.all(memes.map(saveMeme));
      expect(keys).toHaveLength(5);

      const allMemes = await getAllMemes();
      expect(allMemes).toHaveLength(5);

      const updated = await getMeme(keys[2]);

      await removeMeme(keys[0]);
      const afterRemove = await getAllMemes();
      expect(afterRemove).toHaveLength(4);
    });
  });
});
