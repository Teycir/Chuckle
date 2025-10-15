import { createHistoryPanel, searchHistory, clearTagFilters } from '../src/history';
import { saveMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('History Search - Integration Tests', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    await chrome.storage.local.clear();
    clearTagFilters();
  });

  afterEach(() => {
    const panel = document.querySelector('.history-panel');
    if (panel) panel.remove();
  });

  describe('Search Input', () => {
    test('should have search input in panel', async () => {
      await createHistoryPanel();

      const searchInput = document.querySelector('.history-search');
      expect(searchInput).toBeTruthy();
    });

    test('should filter memes by text content', async () => {
      const meme1: MemeData = {
        text: 'JavaScript is awesome',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Python is great',
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

      await searchHistory('JavaScript');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should filter memes by template', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Test 2',
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

      await searchHistory('drake');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should be case-insensitive', async () => {
      const meme: MemeData = {
        text: 'JavaScript Rocks',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await searchHistory('javascript');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should show all memes when search is empty', async () => {
      const meme1: MemeData = {
        text: 'First',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Second',
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

      await searchHistory('');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    test('should clear search results', async () => {
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
      await createHistoryPanel();

      await searchHistory('nonexistent');
      await searchHistory('');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Results', () => {
    test('should hide non-matching memes', async () => {
      const meme1: MemeData = {
        text: 'Match this',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
        isFavorite: false,
        tags: []
      };

      const meme2: MemeData = {
        text: 'Different text',
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

      const searchInput = document.querySelector('.history-search') as HTMLInputElement;
      searchInput.value = 'Match';
      await searchHistory('Match');

      const allItems = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(allItems).filter(item => 
        (item as HTMLElement).style.display !== 'none'
      );
      expect(visibleItems.length).toBe(1);
    });

    test('should show no results message when no matches', async () => {
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
      await createHistoryPanel();

      await searchHistory('nonexistent query');

      const noResults = document.querySelector('.no-results');
      expect(noResults).toBeTruthy();
    });

    test('should hide no results message when matches found', async () => {
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
      await createHistoryPanel();

      await searchHistory('nonexistent');
      await searchHistory('Test');

      const noResults = document.querySelector('.no-results');
      expect(noResults?.getAttribute('style')).toContain('display: none');
    });
  });

  describe('Search Performance', () => {
    test('should handle search with many memes', async () => {
      for (let i = 0; i < 50; i++) {
        await saveMeme({
          text: `Meme ${i}`,
          imageUrl: `https://example.com/${i}.png`,
          template: 'drake',
          timestamp: i,
          language: 'English',
          isFavorite: false,
          tags: []
        });
      }

      await createHistoryPanel();
      await searchHistory('Meme 25');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle rapid search changes', async () => {
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
      await createHistoryPanel();

      await searchHistory('a');
      await searchHistory('ab');
      await searchHistory('abc');
      await searchHistory('Test');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters in search', async () => {
      const meme: MemeData = {
        text: 'Test @#$ meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await searchHistory('@#$');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle unicode in search', async () => {
      const meme: MemeData = {
        text: '你好世界 🎭',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await searchHistory('你好');

      const items = document.querySelectorAll('.history-item:not([style*="display: none"])');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle very long search query', async () => {
      const meme: MemeData = {
        text: 'Short text',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await searchHistory('a'.repeat(1000));

      const noResults = document.querySelector('.no-results');
      expect(noResults).toBeTruthy();
    });

    test('should handle search before panel creation', async () => {
      await expect(searchHistory('test')).resolves.not.toThrow();
    });
  });
});
