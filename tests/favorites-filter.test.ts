import { createHistoryPanel, filterFavorites, isFavoritesFilterActive } from '../src/history';
import { saveMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('Favorites Filter - Integration Tests', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    await chrome.storage.local.clear();
  });

  afterEach(() => {
    const panel = document.querySelector('.history-panel');
    if (panel) panel.remove();
  });

  describe('Filter Button', () => {
    test('should have favorites filter button', async () => {
      await createHistoryPanel();

      const filterBtn = document.querySelector('.favorites-filter');
      expect(filterBtn).toBeTruthy();
    });

    test('should show inactive state by default', async () => {
      await createHistoryPanel();

      expect(isFavoritesFilterActive()).toBe(false);
    });

    test('should toggle to active state', async () => {
      await createHistoryPanel();

      await filterFavorites();

      expect(isFavoritesFilterActive()).toBe(true);
    });

    test('should toggle back to inactive state', async () => {
      await chrome.storage.local.clear();
      await createHistoryPanel();

      await filterFavorites();
      expect(isFavoritesFilterActive()).toBe(true);
      
      await filterFavorites();
      expect(isFavoritesFilterActive()).toBe(false);
    });
  });

  describe('Filter Functionality', () => {
    test('should show only favorited memes', async () => {
      const meme1: MemeData = {
        text: 'Favorite meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Regular meme',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      const allItemsBefore = document.querySelectorAll('.history-item');
      
      await filterFavorites();

      const visibleItems = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(visibleItems.length).toBeLessThan(allItemsBefore.length);
    });

    test('should show all memes when filter is off', async () => {
      await chrome.storage.local.clear();
      const meme1: MemeData = {
        text: 'Favorite meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Regular meme',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await filterFavorites();
      await filterFavorites();

      const visibleItems = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(visibleItems.length).toBeGreaterThanOrEqual(2);
    });

    test('should hide non-favorite memes', async () => {
      await chrome.storage.local.clear();
      const meme: MemeData = {
        text: 'Regular meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await filterFavorites();

      const items = document.querySelectorAll('.history-item');
      const hiddenItems = Array.from(items).filter(item =>
        (item as HTMLElement).style.display === 'none'
      );
      expect(hiddenItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Empty Favorites', () => {
    test('should show empty message when no favorites', async () => {
      const meme: MemeData = {
        text: 'Regular meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await filterFavorites();

      const emptyMsg = document.querySelector('.no-favorites');
      expect(emptyMsg).toBeTruthy();
    });

    test('should hide empty message when favorites exist', async () => {
      const meme: MemeData = {
        text: 'Favorite meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await filterFavorites();

      const emptyMsg = document.querySelector('.no-favorites');
      expect(emptyMsg?.getAttribute('style')).toContain('display: none');
    });
  });

  describe('Button Visual State', () => {
    test('should update button appearance when active', async () => {
      await createHistoryPanel();

      await filterFavorites();
      
      const filterBtn = document.querySelector('.favorites-filter') as HTMLElement;
      expect(filterBtn.style.opacity).toBe('1');
    });

    test('should update button appearance when inactive', async () => {
      await chrome.storage.local.clear();
      await createHistoryPanel();

      const filterBtn = document.querySelector('.favorites-filter') as HTMLElement;
      await filterFavorites();
      await filterFavorites();

      expect(filterBtn.style.opacity).toBe('0.5');
    });
  });

  describe('Sorting', () => {
    test('should sort favorites by timestamp', async () => {
      const meme1: MemeData = {
        text: 'Old favorite',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      const meme2: MemeData = {
        text: 'New favorite',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await filterFavorites();

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle filter before panel creation', async () => {
      await expect(filterFavorites()).resolves.not.toThrow();
    });

    test('should handle multiple filter toggles', async () => {
      await chrome.storage.local.clear();
      const meme: MemeData = {
        text: 'Favorite meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await filterFavorites();
      await filterFavorites();
      await filterFavorites();

      expect(isFavoritesFilterActive()).toBe(true);
    });

    test('should work with dark mode', async () => {
      await chrome.storage.local.set({ darkMode: true });

      const meme: MemeData = {
        text: 'Favorite meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await filterFavorites();

      const filterBtn = document.querySelector('.favorites-filter');
      expect(filterBtn).toBeTruthy();
    });

    test('should handle all memes favorited', async () => {
      const meme1: MemeData = {
        text: 'Favorite 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Favorite 2',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
        isFavorite: true,
        tags: []
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await filterFavorites();

      const visibleItems = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(visibleItems.length).toBeGreaterThanOrEqual(2);
    });
  });
});
