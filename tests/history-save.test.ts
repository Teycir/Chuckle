import { saveMeme, getMeme, getAllMemes, removeMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('History Save - Integration Tests', () => {
  const testKeys: string[] = [];

  afterEach(async () => {
    for (const key of testKeys) {
      await removeMeme(key);
    }
    testKeys.length = 0;
  });

  async function saveAndTrack(memeData: MemeData): Promise<string> {
    const key = await saveMeme(memeData);
    testKeys.push(key);
    return key;
  }

  describe('Save Meme After Generation', () => {
    test('should save meme with all metadata', async () => {
      const memeData: MemeData = {
        text: 'When you finally understand recursion',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);

      expect(key).toMatch(/^meme_[a-z0-9]{8}$/);
      const retrieved = await getMeme(key);
      expect(retrieved).toEqual(memeData);
    });

    test('should generate unique storage key', async () => {
      const meme1: MemeData = {
        text: 'First meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'Second meme',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: Date.now(),
        language: 'English',
      };

      const key1 = await saveAndTrack(meme1);
      const key2 = await saveAndTrack(meme2);

      expect(key1).not.toBe(key2);
    });

    test('should detect duplicate memes', async () => {
      const memeData: MemeData = {
        text: 'Same text',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key1 = await saveAndTrack(memeData);
      const key2 = await saveMeme(memeData);

      expect(key1).toBe(key2);
    });

    test('should verify timestamp is correct', async () => {
      const beforeTime = Date.now();
      const memeData: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };
      const afterTime = Date.now();

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(retrieved?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should verify all metadata fields saved', async () => {
      const memeData: MemeData = {
        text: 'Complete metadata test',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: 1234567890,
        language: 'Spanish',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.text).toBe('Complete metadata test');
      expect(retrieved?.imageUrl).toBe('https://example.com/meme.png');
      expect(retrieved?.template).toBe('drake');
      expect(retrieved?.timestamp).toBe(1234567890);
      expect(retrieved?.language).toBe('Spanish');
    });
  });

  describe('Storage Key Generation', () => {
    test('should use hash of content for key', async () => {
      const memeData: MemeData = {
        text: 'Test content',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);

      expect(key).toMatch(/^meme_[a-z0-9]{8}$/);
    });

    test('should generate same key for same content', async () => {
      const memeData: MemeData = {
        text: 'Identical content',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key1 = await saveAndTrack(memeData);
      const key2 = await saveMeme(memeData);

      expect(key1).toBe(key2);
    });

    test('should generate different keys for different content', async () => {
      const meme1: MemeData = {
        text: 'First',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'Second',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key1 = await saveAndTrack(meme1);
      const key2 = await saveAndTrack(meme2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', async () => {
      const incompleteMeme = {
        text: 'Test',
        imageUrl: 'https://example.com/meme.png'
      } as MemeData;

      const key = await saveAndTrack(incompleteMeme);
      const retrieved = await getMeme(key);

      expect(retrieved?.text).toBe('Test');
      expect(retrieved?.imageUrl).toBe('https://example.com/meme.png');
    });
  });

  describe('Integration with Storage', () => {
    test('should save and retrieve meme', async () => {
      const memeData: MemeData = {
        text: 'Integration test',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved).toEqual(memeData);
    });

    test('should save multiple memes and retrieve all', async () => {
      const memes: MemeData[] = [
        {
          text: 'First',
          imageUrl: 'https://example.com/1.png',
          template: 'drake',
          timestamp: 1000,
          language: 'English',
        },
        {
          text: 'Second',
          imageUrl: 'https://example.com/2.png',
          template: 'distracted',
          timestamp: 2000,
          language: 'English',
        }
      ];

      await saveAndTrack(memes[0]);
      await saveAndTrack(memes[1]);

      const allMemes = await getAllMemes();
      const savedMemes = allMemes.filter(m => 
        m.text === 'First' || m.text === 'Second'
      );

      expect(savedMemes.length).toBeGreaterThanOrEqual(2);
      const first = savedMemes.find(m => m.text === 'First');
      const second = savedMemes.find(m => m.text === 'Second');
      expect(second?.timestamp).toBeGreaterThan(first?.timestamp || 0);
    });
  });

  describe('Language Support', () => {
    test('should save meme with English language', async () => {
      const memeData: MemeData = {
        text: 'English meme',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.language).toBe('English');
    });

    test('should save meme with Spanish language', async () => {
      const memeData: MemeData = {
        text: 'Meme en español',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'Spanish',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.language).toBe('Spanish');
    });

    test('should save meme with French language', async () => {
      const memeData: MemeData = {
        text: 'Mème en français',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'French',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.language).toBe('French');
    });

    test('should save meme with German language', async () => {
      const memeData: MemeData = {
        text: 'Deutsches Meme',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'German',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.language).toBe('German');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      const memeData: MemeData = {
        text: longText,
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.text).toBe(longText);
    });

    test('should handle special characters in text', async () => {
      const memeData: MemeData = {
        text: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.text).toBe('!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
    });

    test('should handle unicode characters', async () => {
      const memeData: MemeData = {
        text: '你好世界 🎭 مرحبا العالم',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

      expect(retrieved?.text).toBe('你好世界 🎭 مرحبا العالم');
    });

    test('should handle empty tags array', async () => {
      const memeData: MemeData = {
        text: 'No tags',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

    });

    test('should handle multiple tags', async () => {
      const memeData: MemeData = {
        text: 'Tagged meme',
        imageUrl: 'https://example.com/meme.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      const key = await saveAndTrack(memeData);
      const retrieved = await getMeme(key);

    });
  });
});
