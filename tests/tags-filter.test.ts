import { createHistoryPanel, toggleTagFilter, getActiveTagFilters, applyFilters, clearTagFilters } from '../src/history';
import { saveMeme } from '../src/storage';
import type { MemeData } from '../src/types';

describe('Tag Filtering', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    await chrome.storage.local.clear();
    clearTagFilters();
  });

  afterEach(() => {
    const panel = document.querySelector('.history-panel');
    if (panel) panel.remove();
  });

  describe('Tag Badge Display', () => {
    test('should display tag badges in history items', async () => {
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
      await createHistoryPanel();

      const tagBadges = document.querySelectorAll('.tag-filter-badge');
      expect(tagBadges.length).toBe(2);
    });

    test('should show correct tag text', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const tagBadge = document.querySelector('.tag-filter-badge');
      expect(tagBadge?.textContent).toBe('funny');
    });

    test('should display multiple tags per meme', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work', 'relatable']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const historyItem = document.querySelector('.history-item');
      const tagBadges = historyItem?.querySelectorAll('.tag-filter-badge');
      expect(tagBadges?.length).toBe(3);
    });
  });

  describe('Tag Filter Toggle', () => {
    test('should toggle tag filter on', async () => {
      await toggleTagFilter('funny');
      
      const activeTags = getActiveTagFilters();
      expect(activeTags).toContain('funny');
    });

    test('should toggle tag filter off', async () => {
      await toggleTagFilter('funny');
      await toggleTagFilter('funny');
      
      const activeTags = getActiveTagFilters();
      expect(activeTags).not.toContain('funny');
    });

    test('should support multiple active tags', async () => {
      await toggleTagFilter('funny');
      await toggleTagFilter('work');
      
      const activeTags = getActiveTagFilters();
      expect(activeTags).toContain('funny');
      expect(activeTags).toContain('work');
    });

    test('should update badge visual state when active', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const tagBadge = document.querySelector('.tag-filter-badge') as HTMLElement;
      tagBadge?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(tagBadge.style.border).toContain('1px solid');
    });
  });

  describe('Filter by Single Tag', () => {
    test('should show only memes with selected tag', async () => {
      const meme1: MemeData = {
        text: 'Funny meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const meme2: MemeData = {
        text: 'Work meme',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['work']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });

    test('should hide memes without selected tag', async () => {
      const meme1: MemeData = {
        text: 'Funny meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const meme2: MemeData = {
        text: 'Work meme',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['work']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');

      const items = document.querySelectorAll('.history-item');
      const hiddenItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display === 'none'
      );

      expect(hiddenItems.length).toBe(1);
    });
  });

  describe('Filter by Multiple Tags (AND logic)', () => {
    test('should show only memes with all selected tags', async () => {
      const meme1: MemeData = {
        text: 'Funny work meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      const meme2: MemeData = {
        text: 'Just funny',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const meme3: MemeData = {
        text: 'Just work',
        imageUrl: 'https://example.com/3.png',
        template: 'drake',
        timestamp: Date.now() + 2,
        language: 'English',
        isFavorite: false,
        tags: ['work']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await saveMeme(meme3);
      await createHistoryPanel();

      await toggleTagFilter('funny');
      await toggleTagFilter('work');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });

    test('should use AND logic for multiple tags', async () => {
      const meme1: MemeData = {
        text: 'All tags',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work', 'relatable']
      };

      const meme2: MemeData = {
        text: 'Two tags',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');
      await toggleTagFilter('work');
      await toggleTagFilter('relatable');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });
  });

  describe('Combine with Search Filter', () => {
    test('should combine tag filter with search', async () => {
      const meme1: MemeData = {
        text: 'Funny work meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const meme2: MemeData = {
        text: 'Funny home meme',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');

      const searchInput = document.querySelector('.history-search') as HTMLInputElement;
      searchInput.value = 'work';
      searchInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });

    test('should show no results when filters dont match', async () => {
      const meme: MemeData = {
        text: 'Funny meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await toggleTagFilter('work');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(0);
    });
  });

  describe('Combine with Favorites Filter', () => {
    test('should combine tag filter with favorites', async () => {
      const meme1: MemeData = {
        text: 'Favorite funny',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: ['funny']
      };

      const meme2: MemeData = {
        text: 'Not favorite funny',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');

      const filterBtn = document.querySelector('.favorites-filter') as HTMLElement;
      filterBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });
  });

  describe('Clear Tag Filters', () => {
    test('should show all memes when no tags selected', async () => {
      const meme1: MemeData = {
        text: 'Meme 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      const meme2: MemeData = {
        text: 'Meme 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['work']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      await toggleTagFilter('funny');
      await toggleTagFilter('funny');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(2);
    });

    test('should clear active tag filters', async () => {
      await toggleTagFilter('funny');
      await toggleTagFilter('work');
      
      expect(getActiveTagFilters().length).toBe(2);

      await toggleTagFilter('funny');
      await toggleTagFilter('work');

      expect(getActiveTagFilters().length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle memes with no tags', async () => {
      const meme: MemeData = {
        text: 'No tags',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await saveMeme(meme);
      await createHistoryPanel();

      await toggleTagFilter('funny');

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(0);
    });

    test('should handle empty history', async () => {
      await createHistoryPanel();
      await toggleTagFilter('funny');

      const emptyMessage = document.querySelector('.empty-history');
      expect(emptyMessage).toBeTruthy();
    });

    test('should prevent event bubbling on tag click', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const historyItem = document.querySelector('.history-item') as HTMLElement;
      let itemClicked = false;
      historyItem.onclick = () => { itemClicked = true; };

      const tagBadge = document.querySelector('.tag-filter-badge') as HTMLElement;
      tagBadge.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(itemClicked).toBe(false);
    });

    test('should work with dark mode', async () => {
      await chrome.storage.local.set({ darkMode: true });

      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const tagBadge = document.querySelector('.tag-filter-badge');
      expect(tagBadge).toBeTruthy();
    });
  });

  describe('getActiveTagFilters', () => {
    test('should return empty array initially', () => {
      const activeTags = getActiveTagFilters();
      expect(activeTags).toEqual([]);
    });

    test('should return active tag filters', async () => {
      await toggleTagFilter('funny');
      await toggleTagFilter('work');

      const activeTags = getActiveTagFilters();
      expect(activeTags).toContain('funny');
      expect(activeTags).toContain('work');
      expect(activeTags.length).toBe(2);
    });
  });

  describe('applyFilters', () => {
    test('should apply all filters together', async () => {
      const meme1: MemeData = {
        text: 'Funny work favorite',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: true,
        tags: ['funny', 'work']
      };

      const meme2: MemeData = {
        text: 'Funny work not favorite',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      const meme3: MemeData = {
        text: 'Just funny favorite',
        imageUrl: 'https://example.com/3.png',
        template: 'drake',
        timestamp: Date.now() + 2,
        language: 'English',
        isFavorite: true,
        tags: ['funny']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await saveMeme(meme3);
      await createHistoryPanel();

      await toggleTagFilter('funny');
      await toggleTagFilter('work');

      const filterBtn = document.querySelector('.favorites-filter') as HTMLElement;
      filterBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const items = document.querySelectorAll('.history-item');
      const visibleItems = Array.from(items).filter(
        item => (item as HTMLElement).style.display !== 'none'
      );

      expect(visibleItems.length).toBe(1);
    });
  });
});
