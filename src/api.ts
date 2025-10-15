import type { GeminiResponse } from './types';
import { CONFIG } from './config';
import { geminiCache } from './cache';
import { logger } from './logger';

export async function analyzeMemeContext(text: string): Promise<string> {
  const cacheKey = `gemini:${text}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) return cached;

  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error('API key not configured');
  
  const response = await fetch(
    `${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this text and suggest a meme template: "${text}". Return only the template name.`
          }]
        }]
      })
    }
  );
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data: GeminiResponse = await response.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid API response');
  
  const result = data.candidates[0].content.parts[0].text;
  geminiCache.set(cacheKey, result);
  return result;
}

export async function generateMemeImage(template: string): Promise<string> {
  try {
    const url = `${CONFIG.MEMEGEN_API_URL}/${template}.png`;
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error('Template unavailable');
    return url;
  } catch (error) {
    logger.error('Meme image generation failed', error);
    return CONFIG.FALLBACK_IMAGE_URL;
  }
}