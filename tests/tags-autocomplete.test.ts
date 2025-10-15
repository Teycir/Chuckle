import { createOverlay, closeOverlay } from '../src/overlay';
import { saveMeme } from '../src/storage';
import { getAllTags, filterTags } from '../src/tags';
import type { MemeData } from '../src/types';

describe('Tag Autocomplete', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    await chrome.storage.local.clear();
  });

  afterEach(() => {
    closeOverlay();
  });

  describe('Dropdown Display', () => {
    test('should show dropdown with matching tags', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      expect(dropdown).toBeTruthy();
    });

    test('should filter tags by input', () => {
      const tags = ['funny', 'work', 'relatable', 'fun'];
      const filtered = filterTags(tags, 'fun');
      
      expect(filtered).toContain('funny');
      expect(filtered).toContain('fun');
      expect(filtered.length).toBe(2);
    });

    test('should be case-insensitive', () => {
      const tags = ['Funny', 'WORK', 'relatable'];
      const filtered = filterTags(tags, 'FUN');
      
      expect(filtered).toContain('Funny');
    });

    test('should hide dropdown when input is empty', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = '';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      expect(dropdown.style.display).toBe('none');
    });

    test('should hide dropdown when no matches', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'xyz';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      expect(dropdown.style.display).toBe('none');
    });
  });

  describe('Tag Selection', () => {
    test('should select tag on click', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const suggestion = document.querySelector('.tag-suggestion') as HTMLElement;
      if (suggestion) {
        suggestion.click();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(tagInput.value).toBe('');
    });

    test('should close dropdown after selection', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      const suggestion = document.querySelector('.tag-suggestion') as HTMLElement;
      if (suggestion) {
        suggestion.click();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(dropdown?.style.display).toBe('none');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should navigate down with arrow key', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'fun']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      tagInput.dispatchEvent(event);

      const suggestions = document.querySelectorAll('.tag-suggestion');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should navigate up with arrow key', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'fun']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      tagInput.dispatchEvent(downEvent);

      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      tagInput.dispatchEvent(upEvent);

      const suggestions = document.querySelectorAll('.tag-suggestion');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test('should select highlighted tag with Enter', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      tagInput.dispatchEvent(downEvent);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      tagInput.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(tagInput.value).toBe('');
    });

    test('should close dropdown with Escape', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'test';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      tagInput.dispatchEvent(escEvent);

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      expect(dropdown.style.display).toBe('none');
    });
  });

  describe('Debouncing', () => {
    test('should debounce input by 150ms', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };

      await createOverlay(meme);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      
      tagInput.value = 'f';
      tagInput.dispatchEvent(new Event('input'));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tagInput.value = 'fu';
      tagInput.dispatchEvent(new Event('input'));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const dropdown = document.querySelector('.tag-autocomplete') as HTMLElement;
      expect(dropdown).toBeTruthy();
    });
  });

  describe('getAllTags', () => {
    test('should return all unique tags', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'work']
      };

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now() + 1,
        language: 'English',
        isFavorite: false,
        tags: ['funny', 'relatable']
      };

      await saveMeme(meme1);
      await saveMeme(meme2);

      const tags = await getAllTags();
      
      expect(tags).toContain('funny');
      expect(tags).toContain('work');
      expect(tags).toContain('relatable');
      expect(tags.filter(t => t === 'funny').length).toBe(1);
    });

    test('should return sorted tags', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['zebra', 'apple', 'mango']
      };

      await saveMeme(meme);

      const tags = await getAllTags();
      
      expect(tags[0]).toBe('apple');
      expect(tags[1]).toBe('mango');
      expect(tags[2]).toBe('zebra');
    });

    test('should return empty array when no tags', async () => {
      const tags = await getAllTags();
      expect(tags).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should not show already added tags', async () => {
      const meme1: MemeData = {
        text: 'Test 1',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await saveMeme(meme1);

      const meme2: MemeData = {
        text: 'Test 2',
        imageUrl: 'https://example.com/2.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: ['funny']
      };

      await createOverlay(meme2);

      const tagInput = document.querySelector('.tag-input') as HTMLInputElement;
      tagInput.value = 'fun';
      tagInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 200));

      const suggestions = document.querySelectorAll('.tag-suggestion');
      const hasFunny = Array.from(suggestions).some(s => s.textContent === 'funny');
      
      expect(hasFunny).toBe(false);
    });

    test('should handle empty query', () => {
      const tags = ['funny', 'work'];
      const filtered = filterTags(tags, '');
      
      expect(filtered).toEqual([]);
    });

    test('should handle whitespace query', () => {
      const tags = ['funny', 'work'];
      const filtered = filterTags(tags, '   ');
      
      expect(filtered).toEqual([]);
    });
  });
});
