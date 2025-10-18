describe('Content Script', () => {
  const testApiKey = process.env.GEMINI_API_KEY || 'AIzaSyDummyTestKey1234567890ABCDEFGHIJK';
  
  beforeEach(() => {
    global.chrome = {
      runtime: { onMessage: { addListener: jest.fn() } },
      storage: { 
        local: { 
          set: jest.fn(),
          get: jest.fn((keys, callback) => {
            if (callback) {
              callback({ geminiApiKey: testApiKey, aiProvider: 'google' });
            }
            return Promise.resolve({ geminiApiKey: testApiKey, language: 'English', aiProvider: 'google' });
          })
        } 
      },
    } as any;
    global.fetch = jest.fn();
  });

  test('generates meme from text', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'choice' }] } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'drake' }] } }]
        })
      });

    const { analyzeMemeContext } = require('../src/geminiService');
    const result = await analyzeMemeContext('test text');
    
    expect(result).toBe('drake');
  });
});
