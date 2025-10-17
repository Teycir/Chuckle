import type { GeminiResponse } from './types';
import { CONFIG } from './config';
import { geminiCache } from './cache';
import { logger } from './logger';
import { API_KEY_REGEX, GEMINI_PROMPT_TEMPLATE, ERROR_MESSAGES } from './constants';
import { addWatermark } from './watermark';
import { formatTextForTemplate } from './templateFormatter';

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
  const isRegenerate = variant > 0;
  const cacheKey = `gemini:${text}${isRegenerate ? `:v${variant}` : ''}`;
  
  if (!isRegenerate) {
    const cached = geminiCache.get(cacheKey);
    if (cached) {
      console.log('[Chuckle] Using cached template:', cached);
      return cached;
    }
  }
  
  console.log('[Chuckle] Calling Gemini API for text:', text.slice(0, 50), isRegenerate ? '(regenerate)' : '');

  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error(ERROR_MESSAGES.NO_API_KEY);
  if (!validateApiKey(geminiApiKey)) throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  
  try {
      const response = await fetchWithTimeout(
        `${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: isRegenerate 
                  ? `${GEMINI_PROMPT_TEMPLATE(text)}\n\nIMPORTANT: Provide a DIFFERENT template than you might have suggested before for this text. Choose an alternative that fits the context.`
                  : GEMINI_PROMPT_TEMPLATE(text)
              }]
            }],
            generationConfig: isRegenerate ? {
              temperature: 1.3,
              topP: 0.98,
              topK: 64
            } : {
              temperature: 1.0,
              topP: 0.95,
              topK: 40
            }
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
      
      const result = data.candidates[0].content.parts[0].text.trim().replace(/\s+/g, ' ');
      console.log('[Chuckle] Template from API:', result);
      if (!isRegenerate) {
        geminiCache.set(cacheKey, result);
      }
      return result;
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    console.error('[Chuckle] API call failed:', lastError.message);
    throw new Error(`Network error: ${lastError.message || 'Connection failed'}. Check your internet connection and API key.`);
  }
}

async function summarizeText(text: string): Promise<string> {
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) {
    const words = text.split(/\s+/);
    return words.slice(0, 30).join(' ');
  }
  
  console.log('[Chuckle] Summarizing long text');
  
  try {
    const response = await fetchWithTimeout(
      `${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Summarize this text in EXACTLY 10 words or less. Keep the main point only.\n\nText: "${text}"\n\nReturn ONLY the summary (max 10 words), nothing else.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40
          }
        })
      },
      8000
    );
    
    if (!response.ok) {
      console.error('[Chuckle] Summarization failed:', response.status);
      const words = text.split(/\s+/);
      return words.slice(0, 30).join(' ');
    }
    
    const data: GeminiResponse = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (summary && summary.length > 0) {
      const wordCount = summary.split(/\s+/).length;
      if (wordCount <= 10) {
        console.log('[Chuckle] Text summarized:', summary, `(${wordCount} words)`);
        return summary;
      }
    }
    
    const words = text.split(/\s+/);
    return words.slice(0, 30).join(' ');
  } catch (error) {
    console.error('[Chuckle] Summarization error:', error);
    const words = text.split(/\s+/);
    return words.slice(0, 30).join(' ');
  }
}

// Normalize text for URL compatibility across French, Spanish, German, Italian
// Handles: é→e, ñ→n, ü→u, à→a, ö→o, ç→c, €→removed, etc.
// Also URL-encodes special characters like ?, &, etc.
// For Grumpy Cat, we need to be more careful with question marks and other special chars
function normalizeText(text: string): string {
  // First clean the text of unicode characters
  let cleaned = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s$€£¥!?.,;:'-]/g, '');

  // Convert spaces to underscores for URL compatibility
  cleaned = cleaned.replace(/\s+/g, '_');

  // URL encode to handle special characters like ?, &, etc.
  return encodeURIComponent(cleaned);
}

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    let processedText = text;
    
    const words = text.split(/\s+/);
    if (words.length > 12) {
      processedText = words.slice(0, 12).join(' ');
    } else {
      processedText = text;
    }
    const formattedText = skipFormatting ? processedText : await formatTextForTemplate(processedText, formattedTemplate);
    const cleanText = formattedText.replace(/['']/g, "'").replace(/…/g, '...');
    
    const parts = cleanText.split(' / ').map(p => p.trim()).filter(p => p.length > 0);
    let topText: string, bottomText: string;
    
    console.log('[Chuckle] Split parts:', parts);
    console.log('[Chuckle] Parts count:', parts.length);
    
    if (formattedTemplate === 'cmm') {
      topText = '~';
      bottomText = normalizeText(parts.join(', '));
    } else if (parts.length >= 2) {
      const bottomParts = parts.slice(1);
      const bottomJoined = bottomParts.join(' ');
      topText = normalizeText(parts[0]);
      bottomText = normalizeText(bottomJoined);
      console.log('[Chuckle] Bottom parts:', bottomParts);
      console.log('[Chuckle] Bottom joined BEFORE normalize:', bottomJoined);
      console.log('[Chuckle] Bottom text AFTER normalize:', bottomText);
    } else if (parts.length === 1 && parts[0]) {
      const words = parts[0].split(/\s+/);
      const mid = Math.ceil(words.length / 2);
      topText = normalizeText(words.slice(0, mid).join(' '));
      bottomText = normalizeText(words.slice(mid).join(' ') || 'yes');
    } else {
      topText = normalizeText(cleanText);
      bottomText = 'yes';
    }
    
    console.log('[Chuckle] Formatted template:', formattedTemplate);
    console.log('[Chuckle] FINAL Top text:', topText);
    console.log('[Chuckle] FINAL Bottom text:', bottomText);
    let url: string;
    if (formattedTemplate === 'cmm') {
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${bottomText}.png`;
    } else if (formattedTemplate === 'grumpycat') {
      // Grumpy Cat uses a different format: /grumpycat/top_text/bottom_text.png
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${topText}/${bottomText}.png`;
    } else {
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${topText}/${bottomText}.png`;
    }
    console.log('[Chuckle] FULL meme URL:', url);
    console.log('[Chuckle] Formatted text for display:', cleanText);
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) throw new Error(ERROR_MESSAGES.TEMPLATE_UNAVAILABLE);
    const watermarkedUrl = await addWatermark(url);
    return { watermarkedUrl, originalUrl: url, formattedText: cleanText };
  } catch (error) {
    logger.error('Meme image generation failed', error);
    return { watermarkedUrl: CONFIG.FALLBACK_IMAGE_URL, originalUrl: CONFIG.FALLBACK_IMAGE_URL, formattedText: text };
  }
}
