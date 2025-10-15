import type { GeminiResponse } from './types';
import { CONFIG } from './config';
import { geminiCache } from './cache';
import { logger } from './logger';
import { API_KEY_REGEX, GEMINI_PROMPT_TEMPLATE, ERROR_MESSAGES } from './constants';

export function validateApiKey(key: string): boolean {
  return API_KEY_REGEX.test(key);
}

export async function analyzeMemeContext(text: string, variant: number = 0): Promise<string> {
  const cacheKey = `gemini:${text}${variant > 0 ? `:v${variant}` : ''}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) return cached;

  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error(ERROR_MESSAGES.NO_API_KEY);
  if (!validateApiKey(geminiApiKey)) throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  
  const response = await fetch(
    `${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: GEMINI_PROMPT_TEMPLATE(text)
          }]
        }]
      })
    }
  );
  
  if (!response.ok) throw new Error(ERROR_MESSAGES.API_ERROR(response.status));
  
  const data: GeminiResponse = await response.json();
  if (data.error) throw new Error(data.error.message);
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error(`${ERROR_MESSAGES.INVALID_RESPONSE} for text: "${text.slice(0, 50)}..."`);
  }
  
  const result = data.candidates[0].content.parts[0].text;
  geminiCache.set(cacheKey, result);
  return result;
}

export async function generateMemeImage(template: string): Promise<string> {
  try {
    const url = `${CONFIG.MEMEGEN_API_URL}/${template}.png`;
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error(ERROR_MESSAGES.TEMPLATE_UNAVAILABLE);
    return url;
  } catch (error) {
    logger.error('Meme image generation failed', error);
    return CONFIG.FALLBACK_IMAGE_URL;
  }
}
