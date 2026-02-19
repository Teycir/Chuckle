describe('Content Script', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: { onMessage: { addListener: jest.fn() } },
      storage: {
        local: {
          set: jest.fn(),
          get: jest.fn((keys, callback) => {
            if (callback) {
              callback({ language: 'English' });
            }
            return Promise.resolve({ language: 'English' });
          })
        }
      },
    } as any;
    global.fetch = jest.fn();
  });

  test('generates meme from text', async () => {
    // Mock selectMemeTemplate to return 'drake' locally if needed, or rely on actual implementation which returns 'drake'
    // Since we are unit testing content script, we usually mock the service.
    // However, here we are requiring the service directly.

    // Logic changed: selectMemeTemplate is deterministic now.
    const { selectMemeTemplate } = require('../src/memeService');
    const result = await selectMemeTemplate('test text');

    expect(result).toBe('drake');
  });
});
