describe('Content Script', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: { onMessage: { addListener: jest.fn() } },
      storage: { 
        local: { 
          set: jest.fn(),
          get: jest.fn((keys, callback) => {
            if (callback) {
              callback({ geminiApiKey: 'test-key' });
            }
            return Promise.resolve({ geminiApiKey: 'test-key' });
          })
        } 
      },
      action: { openPopup: jest.fn() }
    } as any;
    global.fetch = jest.fn();
  });

  test('generates meme from text', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'drake' }] } }]
      })
    });

    const { analyzeMemeContext } = require('../src/content');
    const result = await analyzeMemeContext('test text');
    
    expect(result).toBe('drake');
  });
});
