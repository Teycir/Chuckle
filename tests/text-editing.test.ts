import { createOverlay } from '../src/overlay';
import type { MemeData } from '../src/types';

describe('Text Editing', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({ darkMode: false }),
          set: jest.fn().mockResolvedValue(undefined)
        }
      }
    } as any;
  });

  test('meme text is editable', async () => {
    const memeData: MemeData = {
      text: 'Original text',
      imageUrl: 'https://example.com/meme.jpg',
      template: 'Drake',
      timestamp: Date.now(),
      language: 'English',
    };

    await createOverlay(memeData);
    
    const textEl = document.querySelector('.meme-text') as HTMLDivElement;
    expect(textEl).toBeTruthy();
    expect(textEl.contentEditable).toBe('true');
  });

  test('has blur handler for saving', async () => {
    const memeData: MemeData = {
      text: 'Original',
      imageUrl: 'https://example.com/meme.jpg',
      template: 'Drake',
      timestamp: Date.now(),
      language: 'English',
    };

    await createOverlay(memeData);
    
    const textEl = document.querySelector('.meme-text') as HTMLDivElement;
    expect(textEl.onblur).toBeTruthy();
  });
});
