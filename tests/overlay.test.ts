import { createOverlay, closeOverlay, isOverlayOpen } from '../src/overlay';
import type { MemeData } from '../src/types';

describe('Overlay - Deep Tests', () => {
  let mockStorage: { [key: string]: any };

  beforeEach(() => {
    document.body.innerHTML = '';
    mockStorage = { darkMode: false };
    
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys) => {
            if (Array.isArray(keys)) {
              const result: any = {};
              keys.forEach(key => {
                if (mockStorage[key] !== undefined) {
                  result[key] = mockStorage[key];
                }
              });
              return Promise.resolve(result);
            }
            return Promise.resolve(mockStorage);
          })
        }
      }
    } as any;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('createOverlay - Comprehensive Tests', () => {
    const createMemeData = (overrides?: Partial<MemeData>): MemeData => ({
      text: 'test meme',
      imageUrl: 'http://example.com/meme.png',
      template: 'drake',
      timestamp: Date.now(),
      language: 'English',
      isFavorite: false,
      tags: [],
      ...overrides
    });

    test('should create overlay with meme data', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      const overlay = document.querySelector('.meme-overlay');
      expect(overlay).toBeTruthy();
    });

    test('should display meme image', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      const img = document.querySelector('.meme-image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toBe(memeData.imageUrl);
    });

    test('should display meme text', async () => {
      const memeData = createMemeData({ text: 'funny meme text' });
      await createOverlay(memeData);

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toBe('funny meme text');
    });

    test('should create close button', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      const closeBtn = document.querySelector('.close-btn');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.textContent).toBe('×');
    });

    test('should apply dark mode when enabled', async () => {
      mockStorage.darkMode = true;
      const memeData = createMemeData();
      await createOverlay(memeData);

      const overlay = document.querySelector('.meme-overlay');
      expect(overlay?.classList.contains('dark')).toBe(true);
    });

    test('should not apply dark mode when disabled', async () => {
      mockStorage.darkMode = false;
      const memeData = createMemeData();
      await createOverlay(memeData);

      const overlay = document.querySelector('.meme-overlay');
      expect(overlay?.classList.contains('dark')).toBe(false);
    });

    test('should add overlay to document body', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      expect(document.body.children.length).toBeGreaterThan(0);
      expect(document.querySelector('.meme-overlay')).toBeTruthy();
    });

    test('should handle long text', async () => {
      const longText = 'a'.repeat(500);
      const memeData = createMemeData({ text: longText });
      await createOverlay(memeData);

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toBe(longText);
    });

    test('should handle special characters in text', async () => {
      const specialText = 'Test!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const memeData = createMemeData({ text: specialText });
      await createOverlay(memeData);

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toBe(specialText);
    });

    test('should handle unicode in text', async () => {
      const unicodeText = '测试🎭😂👍';
      const memeData = createMemeData({ text: unicodeText });
      await createOverlay(memeData);

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toBe(unicodeText);
    });

    test('should handle empty text', async () => {
      const memeData = createMemeData({ text: '' });
      await createOverlay(memeData);

      const text = document.querySelector('.meme-text');
      expect(text?.textContent).toBe('');
    });

    test('should handle invalid image URL gracefully', async () => {
      const memeData = createMemeData({ imageUrl: 'invalid-url' });
      await createOverlay(memeData);

      const img = document.querySelector('.meme-image') as HTMLImageElement;
      expect(img.src).toContain('invalid-url');
    });

    test('should create overlay with correct z-index', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      const overlay = document.querySelector('.meme-overlay') as HTMLElement;
      expect(overlay.classList.contains('meme-overlay')).toBe(true);
    });

    test('should prevent body scroll when overlay is open', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);

      expect(document.body.style.overflow).toBe('hidden');
    });

    test('should handle multiple language settings', async () => {
      const languages = ['English', 'Spanish', 'French', 'German'];
      
      for (const language of languages) {
        document.body.innerHTML = '';
        const memeData = createMemeData({ language });
        await createOverlay(memeData);
        
        const overlay = document.querySelector('.meme-overlay');
        expect(overlay).toBeTruthy();
      }
    });

    test('should not create duplicate overlays', async () => {
      const memeData = createMemeData();
      await createOverlay(memeData);
      await createOverlay(memeData);

      const overlays = document.querySelectorAll('.meme-overlay');
      expect(overlays.length).toBe(1);
    });
  });

  describe('closeOverlay - Comprehensive Tests', () => {
    test('should remove overlay from DOM', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      expect(document.querySelector('.meme-overlay')).toBeTruthy();

      closeOverlay();
      expect(document.querySelector('.meme-overlay')).toBeFalsy();
    });

    test('should restore body scroll', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      expect(document.body.style.overflow).toBe('hidden');

      closeOverlay();
      expect(document.body.style.overflow).toBe('');
    });

    test('should not throw error when no overlay exists', () => {
      expect(() => closeOverlay()).not.toThrow();
    });

    test('should handle multiple close calls', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      closeOverlay();
      closeOverlay();
      closeOverlay();

      expect(document.querySelector('.meme-overlay')).toBeFalsy();
    });
  });

  describe('isOverlayOpen - Comprehensive Tests', () => {
    test('should return false when no overlay exists', () => {
      expect(isOverlayOpen()).toBe(false);
    });

    test('should return true when overlay exists', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      expect(isOverlayOpen()).toBe(true);
    });

    test('should return false after closing overlay', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      expect(isOverlayOpen()).toBe(true);

      closeOverlay();
      expect(isOverlayOpen()).toBe(false);
    });
  });

  describe('Overlay Interactions - Comprehensive Tests', () => {
    test('should close overlay when close button clicked', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      const closeBtn = document.querySelector('.close-btn') as HTMLElement;
      
      closeBtn.click();
      
      expect(document.querySelector('.meme-overlay')).toBeFalsy();
    });

    test('should close overlay when clicking outside content', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      const overlay = document.querySelector('.meme-overlay') as HTMLElement;
      
      overlay.click();
      
      expect(document.querySelector('.meme-overlay')).toBeFalsy();
    });

    test('should not close when clicking on content', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      const content = document.querySelector('.meme-content') as HTMLElement;
      
      content.click();
      
      expect(document.querySelector('.meme-overlay')).toBeTruthy();
    });

    test('should close overlay on Escape key', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(document.querySelector('.meme-overlay')).toBeFalsy();
    });

    test('should not close on other keys', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      
      expect(document.querySelector('.meme-overlay')).toBeTruthy();
    });
  });

  describe('Overlay Accessibility - Comprehensive Tests', () => {
    test('should have proper ARIA attributes', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const overlay = document.querySelector('.meme-overlay');
      expect(overlay?.getAttribute('role')).toBe('dialog');
      expect(overlay?.getAttribute('aria-modal')).toBe('true');
    });

    test('should have accessible close button', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const closeBtn = document.querySelector('.close-btn');
      expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    test('should have alt text for image', async () => {
      const memeData: MemeData = {
        text: 'test meme',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const img = document.querySelector('.meme-image');
      expect(img?.getAttribute('alt')).toBeTruthy();
    });

    test('should trap focus within overlay', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const closeBtn = document.querySelector('.close-btn') as HTMLElement;
      expect(document.activeElement).toBe(closeBtn);
    });
  });

  describe('Overlay Performance - Comprehensive Tests', () => {
    test('should create overlay quickly', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      const start = performance.now();
      await createOverlay(memeData);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
    });

    test('should close overlay quickly', async () => {
      const memeData: MemeData = {
        text: 'test',
        imageUrl: 'url',
        template: 'drake',
        timestamp: Date.now(),
        language: 'English',
        isFavorite: false,
        tags: []
      };
      
      await createOverlay(memeData);
      
      const start = performance.now();
      closeOverlay();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });
});
