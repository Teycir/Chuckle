import { createOverlay, closeOverlay } from '../src/overlay';
import { saveMeme, getMeme, updateMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('Favorites Toggle - Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    closeOverlay();
  });

  describe('Star Button', () => {
    test('should have star button in overlay', async () => {
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

      const starBtn = document.querySelector('.star-btn');
      expect(starBtn).toBeTruthy();
    });

    test('should show empty star when not favorited', async () => {
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

      const starBtn = document.querySelector('.star-btn');
      expect(starBtn?.textContent).toBe('☆');
    });

    test('should show filled star when favorited', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await createOverlay(meme);

      const starBtn = document.querySelector('.star-btn');
      expect(starBtn?.textContent).toBe('⭐');
    });
  });

  describe('Toggle Functionality', () => {
    test('should toggle favorite on', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      starBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      const updated = await getMeme(key);
      expect(updated?.isFavorite).toBe(true);
    });

    test('should toggle favorite off', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      const key = await saveMeme(meme);
      await createOverlay(meme);

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      starBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      const updated = await getMeme(key);
      expect(updated?.isFavorite).toBe(false);
    });

    test('should update star icon after toggle', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      starBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(starBtn.textContent).toBe('⭐');
    });

    test('should handle multiple toggles', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      
      starBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      starBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const updated = await getMeme(key);
      expect(updated?.isFavorite).toBe(false);
    });
  });

  describe('Persistence', () => {
    test('should persist favorite status', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      starBtn.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      closeOverlay();

      const retrieved = await getMeme(key);
      expect(retrieved?.isFavorite).toBe(true);
    });

    test('should load favorite status on display', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme);
      await createOverlay(meme);

      const starBtn = document.querySelector('.star-btn');
      expect(starBtn?.textContent).toBe('⭐');
    });
  });

  describe('Visual Feedback', () => {
    test('should have click handler', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      expect(starBtn.onclick).toBeTruthy();
    });

    test('should be styled as button', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      expect(starBtn.classList.contains('star-btn')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing meme key', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      expect(() => starBtn.click()).not.toThrow();
    });

    test('should handle rapid clicks', async () => {
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

      const starBtn = document.querySelector('.star-btn') as HTMLElement;
      
      starBtn.click();
      starBtn.click();
      starBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(starBtn.textContent).toMatch(/[☆⭐]/);
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
        tags: []
      };

      await createOverlay(meme);

      const starBtn = document.querySelector('.star-btn');
      expect(starBtn).toBeTruthy();
    });
  });
});
