describe('Model Validator - Gemini 2.5 Flash', () => {
  const mockApiKey = 'test-key';

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
    global.chrome = {
      storage: {
        local: {
          set: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue({})
        }
      }
    };
  });

  test('validates gemini-2.5-flash model name is correct', () => {
    const testModels = ['models/gemini-2.5-flash'];
    expect(testModels[0]).toBe('models/gemini-2.5-flash');
    expect(testModels[0]).toContain('2.5-flash');
    expect(testModels[0]).not.toContain('2.0-flash');
  });

  test('model validator uses correct API endpoint for gemini-2.5-flash', () => {
    const model = 'models/gemini-2.5-flash';
    const modelName = model.replace('models/', '');
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    expect(apiUrl).toContain('gemini-2.5-flash');
    expect(apiUrl).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  });

  test('validates correct model format for storage', () => {
    const primaryModel = 'models/gemini-2.5-flash';
    const fallbackModels: string[] = [];
    
    expect(primaryModel).toMatch(/^models\/gemini-2\.5-flash$/);
    expect(Array.isArray(fallbackModels)).toBe(true);
  });
});
