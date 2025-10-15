import { generateBatch } from '../src/batch';
import * as storage from '../src/storage';
import { geminiCache } from '../src/cache';

jest.mock('../src/storage');

const testApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBlWG7PpQOAah7dkkmy03kWJwPUUq2e40I';

global.fetch = jest.fn();
global.chrome = {
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({ geminiApiKey: testApiKey }))
    }
  }
} as any;

describe('Batch Meme Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    geminiCache.clear();
  });

  test('should generate multiple memes successfully', async () => {
    const texts = ['First meme', 'Second meme', 'Third meme'];
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'drake' }] } }]
      })
    });
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    expect(storage.saveMeme).toHaveBeenCalledTimes(3);
  });

  test('should generate 2 variants per text', async () => {
    const texts = ['Test'];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'drake' }] } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'distracted' }] } }]
        })
      });
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts, 2);

    expect(results[0].variants).toHaveLength(2);
    expect(storage.saveMeme).toHaveBeenCalledTimes(2);
  });

  test('should generate 3 variants per text', async () => {
    const texts = ['Test'];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'drake' }] } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'distracted' }] } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'picard' }] } }]
        })
      });
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts, 3);

    expect(results[0].variants).toHaveLength(3);
    expect(storage.saveMeme).toHaveBeenCalledTimes(3);
  });

  test('should handle individual failures', async () => {
    const texts = ['FailTest1', 'FailTest2', 'FailTest3'];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'template1' }] } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: { message: 'API error' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'template3' }] } }]
        })
      });
    
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });

  test('should return correct result structure', async () => {
    const texts = ['StructureTest456'];
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'structuretemplate' }] } }]
      })
    });
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts);

    expect(results[0].text).toBe('StructureTest456');
    expect(results[0].success).toBe(true);
    expect(results[0].variants).toHaveLength(1);
    expect(results[0].variants![0].template).toBe('structuretemplate');
    expect(results[0].variants![0].imageUrl).toContain('structuretemplate');
  });

  test('should handle empty array', async () => {
    const results = await generateBatch([]);
    expect(results).toEqual([]);
  });

  test('should save memes with correct data', async () => {
    const texts = ['SaveTestUnique987'];
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'savetemplate' }] } }]
      })
    });
    (storage.saveMeme as jest.Mock).mockResolvedValue('meme_123');

    const results = await generateBatch(texts);

    expect(results[0].success).toBe(true);
    expect(storage.saveMeme).toHaveBeenCalled();
    const callArg = (storage.saveMeme as jest.Mock).mock.calls[0][0];
    expect(callArg.text).toBe('SaveTestUnique987');
    expect(callArg.isFavorite).toBe(false);
    expect(callArg.tags).toEqual([]);
  });
});
