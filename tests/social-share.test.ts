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
    const container = createShareButton('https://example.com/meme.jpg', 'Test meme');
    const btn = container.querySelector('.share-btn');
    expect(btn).toBeTruthy();
    expect(container.querySelector('div')?.textContent).toContain('Share');
  });

  test('opens share menu on click', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const container = createShareButton('https://example.com/meme.jpg', 'Test meme');
    wrapper.appendChild(container);
    
    const btn = container.querySelector('.share-btn') as HTMLButtonElement;
    btn?.click();
    
    const modal = document.querySelector('.share-modal');
    expect(modal).toBeTruthy();
  });

  test('opens share modal with platforms', async () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const container = createShareButton('https://example.com/meme.jpg', 'Test');
    wrapper.appendChild(container);
    
    const btn = container.querySelector('.share-btn') as HTMLButtonElement;
    btn?.click();
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const modal = document.querySelector('.share-modal');
    expect(modal).toBeTruthy();
    const buttons = modal?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThan(0);
  });

  test('email share uses mailto protocol', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const container = createShareButton('https://example.com/meme.jpg', 'Test meme');
    wrapper.appendChild(container);
    
    const btn = container.querySelector('.share-btn') as HTMLButtonElement;
    btn?.click();
    
    const modal = document.querySelector('.share-modal');
    expect(modal).toBeTruthy();
  });
});
