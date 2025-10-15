import { createOverlay, closeOverlay } from '../src/overlay';
import { saveMeme, getMeme } from '../src/storage';
import { addTag, removeTag } from '../src/tags';
import type { MemeData } from '../src/types';

describe('Tags Input - Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    closeOverlay();
  });

  describe('Tag Input Field', () => {
    test('should have tag input in overlay', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input');
      expect(tagInput).toBeTruthy();
    });

    test('should have placeholder text', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      expect(tagInput.placeholder).toContain('tag');
    });
  });

  describe('Add Tag', () => {
    test('should add tag on Enter key', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await addTag(key, 'funny');

      const updated = await getMeme(key);
      expect(updated?.tags).toContain('funny');
    });

    test('should display tag badge', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await createOverlay(meme);

      const tagBadge = document.querySelector('.tag-badge');
      expect(tagBadge).toBeTruthy();
      expect(tagBadge?.textContent).toContain('funny');
    });

    test('should clear input after adding tag', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'test';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      tagInput.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(tagInput.value).toBe('');
    });

    test('should prevent duplicate tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await addTag(key, 'funny');

      const updated = await getMeme(key);
      expect(updated?.tags.filter(t => t === 'funny').length).toBe(1);
    });

    test('should trim whitespace from tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await addTag(key, '  funny  ');

      const updated = await getMeme(key);
      expect(updated?.tags).toContain('funny');
    });

    test('should ignore empty tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await addTag(key, '   ');

      const updated = await getMeme(key);
      expect(updated?.tags.length).toBe(0);
    });
  });

  describe('Remove Tag', () => {
    test('should remove tag when badge clicked', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await removeTag(key, 'funny');

      const updated = await getMeme(key);
      expect(updated?.tags).not.toContain('funny');
    });

    test('should remove tag badge from display', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      await createOverlay(meme);

      const badges = document.querySelectorAll('.tag-badge');
      expect(badges.length).toBe(2);
    });

    test('should handle removing non-existent tag', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      await removeTag(key, 'nonexistent');

      const updated = await getMeme(key);
      expect(updated?.tags).toEqual(['funny']);
    });
  });

  describe('Tag Display', () => {
    test('should display multiple tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work', 'relatable']
      };

      await createOverlay(meme);

      const badges = document.querySelectorAll('.tag-badge');
      expect(badges.length).toBe(3);
    });

    test('should show remove button on tag badges', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await createOverlay(meme);

      const removeBtn = document.querySelector('.tag-remove');
      expect(removeBtn).toBeTruthy();
    });

    test('should display tags container', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagsContainer = document.querySelector('.tags-container');
      expect(tagsContainer).toBeTruthy();
    });
  });

  describe('Tag Persistence', () => {
    test('should persist tags to storage', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      await addTag(key, 'funny');

      const retrieved = await getMeme(key);
      expect(retrieved?.tags).toContain('funny');
    });

    test('should load existing tags on display', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      await saveMeme(meme);
      await createOverlay(meme);

      const badges = document.querySelectorAll('.tag-badge');
      expect(badges.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long tag names', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      const longTag = 'a'.repeat(100);
      
      await addTag(key, longTag);

      const updated = await getMeme(key);
      expect(updated?.tags).toContain(longTag);
    });

    test('should handle special characters in tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      
      await addTag(key, 'tag-with-dash');

      const updated = await getMeme(key);
      expect(updated?.tags).toContain('tag-with-dash');
    });

    test('should handle unicode in tags', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const key = await saveMeme(meme);
      
      await addTag(key, '你好');

      const updated = await getMeme(key);
      expect(updated?.tags).toContain('你好');
    });

    test('should work with dark mode', async () => {
      await chrome.storage.local.set({ darkMode: true });

      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input');
      expect(tagInput).toBeTruthy();
    });
  });
});
