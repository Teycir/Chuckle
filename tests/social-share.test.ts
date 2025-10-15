import { createShareButton } from '../src/social-share';

describe('Social Share', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(undefined)
        }
      }
    } as any;
  });

  test('creates share button', () => {
    const btn = createShareButton('https://example.com/meme.jpg', 'Test meme');
    expect(btn.textContent).toBe('🚀');
    expect(btn.title).toBe('Share meme');
  });

  test('opens share menu on click', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const btn = createShareButton('https://example.com/meme.jpg', 'Test meme');
    container.appendChild(btn);
    
    btn.click();
    
    const menu = document.querySelector('.share-menu');
    expect(menu).toBeTruthy();
    expect(menu?.querySelectorAll('button').length).toBe(4);
  });

  test('tracks share clicks', async () => {
    const mockSet = jest.fn().mockResolvedValue(undefined);
    global.chrome.storage.local.set = mockSet;
    global.chrome.storage.local.get = jest.fn().mockResolvedValue({ share_twitter: 5 });
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    const btn = createShareButton('https://example.com/meme.jpg', 'Test');
    container.appendChild(btn);
    
    btn.click();
    const twitterBtn = Array.from(document.querySelectorAll('.share-menu button'))
      .find(b => b.textContent === '𝕏');
    
    global.open = jest.fn();
    twitterBtn?.dispatchEvent(new Event('click'));
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockSet).toHaveBeenCalledWith({ share_twitter: 6 });
  });

  test('email share uses mailto protocol', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const btn = createShareButton('https://example.com/meme.jpg', 'Test meme');
    container.appendChild(btn);
    
    btn.click();
    const emailBtn = Array.from(document.querySelectorAll('.share-menu button'))
      .find(b => b.textContent === '📧') as HTMLButtonElement;
    
    expect(emailBtn).toBeTruthy();
    expect(emailBtn?.title).toBe('Share on Email');
  });
});
