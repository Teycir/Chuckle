import { createHistoryPanel, toggleHistoryPanel, isHistoryPanelOpen } from '../src/history';
import { saveMeme, getAllMemes } from '../src/storage';
import type { MemeData } from '../src/types';

describe('History Panel - Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    const panel = document.querySelector('.history-panel');
    if (panel) panel.remove();
  });

  describe('Panel Creation', () => {
    test('should create history panel', async () => {
      await createHistoryPanel();
      
      const panel = document.querySelector('.history-panel');
      expect(panel).toBeTruthy();
    });

    test('should display empty message when no memes', async () => {
      await createHistoryPanel();
      
      const emptyMsg = document.querySelector('.empty-history');
      expect(emptyMsg).toBeTruthy();
      expect(emptyMsg?.textContent).toContain('No memes yet');
    });

    test('should show all memes in history', async () => {
      const meme1: MemeData = {
        text: 'First meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'Second meme',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      const items = document.querySelectorAll('.history-item');
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    test('should sort memes by timestamp newest first', async () => {
      const meme1: MemeData = {
        text: 'Old meme',
        imageUrl: 'https://example.com/1.png',
        template: 'drake',
        timestamp: 1000,
        language: 'English',
      };

      const meme2: MemeData = {
        text: 'New meme',
        imageUrl: 'https://example.com/2.png',
        template: 'distracted',
        timestamp: 2000,
        language: 'English',
      };

      await saveMeme(meme1);
      await saveMeme(meme2);
      await createHistoryPanel();

      const allMemes = await getAllMemes();
      const filtered = allMemes.filter(m => m.text === 'Old meme' || m.text === 'New meme');
      expect(filtered[0].timestamp).toBeGreaterThan(filtered[1].timestamp);
    });
  });

  describe('Panel Toggle', () => {
    test('should toggle panel visibility', async () => {
      await createHistoryPanel();
      
      toggleHistoryPanel();
      expect(isHistoryPanelOpen()).toBe(false);
      
      toggleHistoryPanel();
      expect(isHistoryPanelOpen()).toBe(true);
    });

    test('should hide panel when toggled off', async () => {
      await createHistoryPanel();
      
      toggleHistoryPanel();
      
      const panel = document.querySelector('.history-panel') as HTMLElement;
      expect(panel?.style.display).toBe('none');
    });

    test('should show panel when toggled on', async () => {
      await createHistoryPanel();
      toggleHistoryPanel();
      
      toggleHistoryPanel();
      
      const panel = document.querySelector('.history-panel') as HTMLElement;
      expect(panel?.style.display).not.toBe('none');
    });
  });

  describe('Meme Interaction', () => {
    test('should have click handler on meme items', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const item = document.querySelector('.history-item') as HTMLElement;
      expect(item?.onclick).toBeTruthy();
    });

    test('should display meme thumbnail', async () => {
      const meme: MemeData = {
        text: 'Test meme',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const img = document.querySelector('.history-item img') as HTMLImageElement;
      expect(img?.src).toBe('https://example.com/test.png');
    });

    test('should display meme text', async () => {
      const meme: MemeData = {
        text: 'Test meme text',
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toContain('Test meme text');
    });
  });

  describe('Dark Mode', () => {
    test('should apply dark mode when enabled', async () => {
      await chrome.storage.local.set({ darkMode: true });
      await createHistoryPanel();

      const panel = document.querySelector('.history-panel');
      expect(panel?.classList.contains('dark')).toBe(true);
    });

    test('should not apply dark mode when disabled', async () => {
      await chrome.storage.local.set({ darkMode: false });
      await createHistoryPanel();

      const panel = document.querySelector('.history-panel');
      expect(panel?.classList.contains('dark')).toBe(false);
    });
  });

  describe('Close Button', () => {
    test('should have close button', async () => {
      await createHistoryPanel();

      const closeBtn = document.querySelector('.history-close');
      expect(closeBtn).toBeTruthy();
    });

    test('should close panel when close button clicked', async () => {
      await createHistoryPanel();

      const closeBtn = document.querySelector('.history-close') as HTMLElement;
      closeBtn.click();

      expect(isHistoryPanelOpen()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long meme text', async () => {
      const meme: MemeData = {
        text: 'a'.repeat(1000),
        imageUrl: 'https://example.com/test.png',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const text = document.querySelector('.meme-text');
      expect(text).toBeTruthy();
    });

    test('should handle missing image URL', async () => {
      const meme: MemeData = {
        text: 'Test',
        imageUrl: '',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
      };

      await saveMeme(meme);
      await createHistoryPanel();

      const items = document.querySelectorAll('.history-item');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multiple panel creations', async () => {
      await createHistoryPanel();
      await createHistoryPanel();

      const panels = document.querySelectorAll('.history-panel');
      expect(panels.length).toBe(1);
    });
  });
});
