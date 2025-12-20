export async function validateModelForMemeGeneration(apiKey: string, model: string): Promise<boolean> {
  try {
    const testPrompt = 'Convert "test message" to meme format. Return exactly: "top text / bottom text"';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: testPrompt }],
        temperature: 0.1,
        max_tokens: 50
      })
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    return !!(text && text.trim().length > 0 && text.includes('/'));
  } catch (error) {
    return false;
  }
}

export async function validateAndSetupModels(apiKey: string, provider: 'openrouter', statusCallback?: (message: string, type: 'loading' | 'success' | 'error') => void): Promise<boolean> {
  statusCallback?.('Testing models...', 'loading');
  
  const testModels = ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free'];
  
  const validModels = [];
  
  for (const model of testModels) {
    try {
      console.log('[Chuckle] Testing OpenRouter model:', model);
      const isValid = await validateModelForMemeGeneration(apiKey, model);
      if (isValid) {
        validModels.push(model);
        console.log('[Chuckle] ✅ Valid OpenRouter model:', model);
      } else {
        console.log('[Chuckle] ❌ Invalid OpenRouter model:', model);
      }
    } catch (error) {
      console.log('[Chuckle] ❌ Error testing OpenRouter', model, error);
    }
  }
  
  if (validModels.length === 0) {
    statusCallback?.('No working models found', 'error');
    return false;
  }
  
  const primary = validModels[0];
  const fallbacks = validModels.slice(1);
  
  await chrome.storage.local.set({
    openrouterPrimaryModel: primary,
    openrouterFallbackModels: fallbacks
  });
  
  console.log('[Chuckle] ✅ OpenRouter model cascade setup:', { primary, fallbacks });
  
  const modelName = primary.split('/').pop();
  statusCallback?.(`Using ${modelName} (+${fallbacks.length} fallbacks)`, 'success');
  
  return true;
}