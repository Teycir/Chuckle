import type { GeminiResponse } from './types';
import { CONFIG } from './config';
import { geminiCache } from './cache';
import { logger } from './logger';
import { API_KEY_REGEX, GEMINI_PROMPT_TEMPLATE, ERROR_MESSAGES } from './constants';

export function validateApiKey(key: string): boolean {
  return API_KEY_REGEX.test(key);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeMemeContext(text: string, variant: number = 0): Promise<string> {
  const cacheKey = `gemini:${text}${variant > 0 ? `:v${variant}` : ''}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) {
    console.log('[Chuckle] Using cached template:', cached);
    return cached;
  }
  console.log('[Chuckle] Calling Gemini API for text:', text.slice(0, 50));

  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error(ERROR_MESSAGES.NO_API_KEY);
  if (!validateApiKey(geminiApiKey)) throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Chuckle] API attempt ${attempt}/3`);
      const response = await fetchWithTimeout(
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
        },
        10000
      );
      
      if (!response.ok) {
        console.error('[Chuckle] Gemini API error:', response.status);
        throw new Error(ERROR_MESSAGES.API_ERROR(response.status));
      }
      
      const data: GeminiResponse = await response.json();
      console.log('[Chuckle] Gemini API response received');
      if (data.error) throw new Error(data.error.message);
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(`${ERROR_MESSAGES.INVALID_RESPONSE} for text: "${text.slice(0, 50)}..."`);
      }
      
      const result = data.candidates[0].content.parts[0].text;
      console.log('[Chuckle] Template from API:', result);
      geminiCache.set(cacheKey, result);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Chuckle] Attempt ${attempt} failed:`, lastError.message);
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Network error: ${lastError?.message || 'Connection failed'}. Check your internet connection and API key.`);
}

// Normalize text for URL compatibility across French, Spanish, German, Italian
// Handles: é→e, ñ→n, ü→u, à→a, ö→o, ç→c, €→removed, etc.
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[€$£¥]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
}

export async function generateMemeImage(template: string, text: string): Promise<string> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanText = text.replace(/['']/g, "'").replace(/…/g, '...');
    const words = cleanText.split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    const topText = normalizeText(words.slice(0, mid).join(' '));
    const bottomText = normalizeText(words.slice(mid).join(' '));
    const url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${topText}/${bottomText}.png`;
    console.log('[Chuckle] Trying meme URL:', url);
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error(ERROR_MESSAGES.TEMPLATE_UNAVAILABLE);
    return url;
  } catch (error) {
    logger.error('Meme image generation failed', error);
    return CONFIG.FALLBACK_IMAGE_URL;
  }
}
