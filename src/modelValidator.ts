export async function validateModelForMemeGeneration(apiKey: string, model: string, provider: string): Promise<boolean> {
  try {
    const testPrompt = 'Convert "test message" to meme format. Return exactly: "top text / bottom text"';
    let response: Response;
    
    if (provider === 'google') {
      const modelName = model.replace('models/', '');
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 50 }
        })
      });
    } else {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: testPrompt }],
          temperature: 0.1,
          max_tokens: 50
        })
      });
    }
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const text = provider === 'google' 
      ? data.candidates?.[0]?.content?.parts?.[0]?.text
      : data.choices?.[0]?.message?.content;
    return !!(text && text.trim().length > 0 && text.includes('/'));
  } catch (error) {
    return false;
  }
}

export async function validateAndSetupModels(apiKey: string, provider: 'google' | 'openrouter', statusCallback?: (message: string, type: 'loading' | 'success' | 'error') => void): Promise<boolean> {
  statusCallback?.('Testing models...', 'loading');
  
  const testModels = provider === 'google' 
    ? ['models/gemini-2.5-flash']
    : ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.2-3b-instruct:free'];
  
  const validModels = [];
  
  for (const model of testModels) {
    try {
      console.log(`[Chuckle] Testing ${provider} model:`, model);
      const isValid = await validateModelForMemeGeneration(apiKey, model, provider);
      if (isValid) {
        validModels.push(model);
        console.log(`[Chuckle] ✅ Valid ${provider} model:`, model);
      } else {
        console.log(`[Chuckle] ❌ Invalid ${provider} model:`, model);
      }
    } catch (error) {
      console.log(`[Chuckle] ❌ Error testing ${provider}`, model, error);
    }
  }
  
  if (validModels.length === 0) {
    statusCallback?.('No working models found', 'error');
    return false;
  }
  
  const primary = validModels[0];
  const fallbacks = validModels.slice(1);
  
  const storageKey = provider === 'google' ? 'primaryModel' : 'openrouterPrimaryModel';
  const fallbackKey = provider === 'google' ? 'fallbackModels' : 'openrouterFallbackModels';
  
  await chrome.storage.local.set({
    [storageKey]: primary,
    [fallbackKey]: fallbacks
  });
  
  console.log(`[Chuckle] ✅ ${provider} model cascade setup:`, { primary, fallbacks });
  
  const modelName = primary.split('/').pop();
  statusCallback?.(`Using ${modelName} (+${fallbacks.length} fallbacks)`, 'success');
  
  return true;
}