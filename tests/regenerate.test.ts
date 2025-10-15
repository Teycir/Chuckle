import { createOverlay } from '../src/overlay';
import type { MemeData } from '../src/types';
import * as geminiService from '../src/geminiService';
import * as loading from '../src/loading';

jest.mock('../src/geminiService');
jest.mock('../src/loading');

describe('Regenerate Feature', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => {
            callback?.({ darkMode: false });
            return Promise.resolve({ darkMode: false });
          }),
        },
      },
    } as any;
  });

  it('should show regenerate button in overlay', async () => {
    const memeData: MemeData = {
      text: 'Test meme',
      imageUrl: 'https://example.com/meme.png',
      template: 'drake',
      timestamp: Date.now(),
      language: 'en',
      isFavorite: false,
      tags: [],
    };

    await createOverlay(memeData);
    const regenBtn = document.querySelector('.regenerate-btn');
    expect(regenBtn).toBeTruthy();
    expect(regenBtn?.textContent).toBe('🎲');
  });

  it('should regenerate meme when button clicked', async () => {
    const memeData: MemeData = {
      text: 'Test meme',
      imageUrl: 'https://example.com/meme.png',
      template: 'drake',
      timestamp: Date.now(),
      language: 'en',
      isFavorite: false,
      tags: [],
    };

    (geminiService.analyzeMemeContext as jest.Mock).mockResolvedValue('new-template');
    (geminiService.generateMemeImage as jest.Mock).mockResolvedValue('https://example.com/new-meme.png');

    await createOverlay(memeData);
    const regenBtn = document.querySelector('.regenerate-btn') as HTMLButtonElement;
    
    regenBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(loading.showLoading).toHaveBeenCalledWith('Regenerating meme...');
    expect(geminiService.analyzeMemeContext).toHaveBeenCalledWith('Test meme', expect.any(Number));
  });

  it('should update image when regeneration completes', async () => {
    const memeData: MemeData = {
      text: 'Test meme',
      imageUrl: 'https://example.com/meme.png',
      template: 'drake',
      timestamp: Date.now(),
      language: 'en',
      isFavorite: false,
      tags: [],
    };

    (geminiService.analyzeMemeContext as jest.Mock).mockResolvedValue('new-template');
    (geminiService.generateMemeImage as jest.Mock).mockResolvedValue('https://example.com/new-meme.png');

    await createOverlay(memeData);
    const regenBtn = document.querySelector('.regenerate-btn') as HTMLButtonElement;
    
    regenBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const img = document.querySelector('.meme-image') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/new-meme.png');
    expect(loading.hideLoading).toHaveBeenCalled();
  });
});
