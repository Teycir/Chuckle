export async function optimizeText(text: string): Promise<string> {
  const trimmed = text.trim();
  
  console.log('[Chuckle] Processing text:', trimmed.slice(0, 50));
  
  const { openrouterApiKey, openrouterPrimaryModel } = await chrome.storage.local.get(['openrouterApiKey', 'openrouterPrimaryModel']);
  if (!openrouterApiKey) return trimmed.slice(0, 200);
  
  const model = openrouterPrimaryModel || 'meta-llama/llama-3.2-3b-instruct:free';
  const prompt = trimmed.length > 300 
    ? `Summarize this text into a HILARIOUS, punchy statement (max 200 chars). Make it EXTREMELY funny, witty, and meme-worthy. Add humor, exaggeration, or irony:\n"${trimmed}"\n\nReturn ONLY the funny summary, nothing else.`
    : `Transform this text to be EXTREMELY funny and meme-worthy (max 200 chars). Keep the core meaning but maximize humor with wit, exaggeration, or irony:\n"${trimmed}"\n\nReturn ONLY the funny version, nothing else.`;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.5,
        top_p: 0.98,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      console.error('[Chuckle] Text optimization failed:', response.status);
      return trimmed.slice(0, 150);
    }
    
    const data: any = await response.json();
    const optimized = data.choices?.[0]?.message?.content?.trim();
    
    if (optimized && optimized.length <= 200) {
      console.log('[Chuckle] Text optimized:', optimized);
      return optimized;
    }
    
    return trimmed.slice(0, 200);
  } catch (error) {
    console.error('[Chuckle] Text optimization error:', error);
    return trimmed.slice(0, 200);
  }
}
