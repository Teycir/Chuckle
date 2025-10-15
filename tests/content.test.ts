describe('Content Script', () => {
  const testApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBlWG7PpQOAah7dkkmy03kWJwPUUq2e40I';
  
  beforeEach(() => {
    global.chrome = {
      runtime: { onMessage: { addListener: jest.fn() } },
      storage: { 
        local: { 
          set: jest.fn(),
          get: jest.fn((keys, callback) => {
            if (callback) {
              callback({ geminiApiKey: testApiKey });
            }
            return Promise.resolve({ geminiApiKey: testApiKey });
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
