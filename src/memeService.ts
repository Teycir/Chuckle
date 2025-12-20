import { CONFIG } from './config';
import { apiCache } from './cache';
import { logger } from './logger';
import { PROMPT_TEMPLATE } from './constants';
import { getErrorMessage } from './errorMessages';
import { addWatermark } from './watermark';
import { formatTextForTemplate } from './templateFormatter';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function extractTopic(text: string, apiKey: string, model?: string): Promise<string> {
  const prompt = `Extract the main topic/theme from this text in 1-3 words: "${text}". Return ONLY the topic words (e.g., "choice", "failure", "confusion"). No explanation.`;
  
  try {
    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          top_p: 0.8,
          max_tokens: 10
        })
      },
      5000
    );
    
    if (!response.ok) return '';
    const data: any = await response.json();
    console.log('[Chuckle] Topic extraction raw response:', JSON.stringify(data));
    const topic = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    console.log('[Chuckle] Extracted topic:', topic);
    return topic || '';
  } catch (error) {
    console.log('[Chuckle] Topic extraction failed, continuing without topic');
    return '';
  }
}

export async function analyzeMemeContext(text: string, variant: number = 0): Promise<string> {
  const { offlineMode } = await chrome.storage.local.get(['offlineMode']);
  
  if (offlineMode) {
    console.log('[Chuckle] Offline mode: using default template');
    return 'drake';
  }
  
  const isRegenerate = variant > 0;
  const cacheKey = `api:${text}${isRegenerate ? `:v${variant}` : ''}`;

  if (!isRegenerate) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      console.log('[Chuckle] Using cached template:', cached);
      return cached;
    }
  }

  const { openrouterApiKey, openrouterPrimaryModel } = await chrome.storage.local.get(['openrouterApiKey', 'openrouterPrimaryModel']);
  const model = openrouterPrimaryModel || 'meta-llama/llama-3.2-3b-instruct:free';
  
  console.log('[Chuckle] Calling OpenRouter API for text:', text.slice(0, 50), isRegenerate ? '(regenerate)' : '', `| Model: ${model}`);
  
  if (!openrouterApiKey) throw new Error(await getErrorMessage('noApiKey'));

  const topic = !isRegenerate ? await extractTopic(text, openrouterApiKey, model) : '';

  try {
      const response = await fetchWithTimeout(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{
              role: 'user',
              content: isRegenerate
                ? `${PROMPT_TEMPLATE(text)}\n\nIMPORTANT: Provide a DIFFERENT template than you might have suggested before for this text. Choose an alternative that fits the context.`
                : PROMPT_TEMPLATE(text, topic)
            }],
            temperature: isRegenerate ? 1.3 : 0.7,
            top_p: isRegenerate ? 0.98 : 0.9
          })
        },
        10000
      );

      if (!response.ok) {
        console.error('[Chuckle] OpenRouter API error:', response.status);
        if (response.status === 429) {
          throw new Error(await getErrorMessage('tooManyRequests'));
        }
        if (response.status === 403 || response.status === 401) {
          throw new Error(await getErrorMessage('invalidApiKey'));
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: any = await response.json();
      console.log('[Chuckle] OpenRouter API response received');
      
      if (data.error) throw new Error(data.error.message);
      if (!data.choices?.[0]?.message?.content) {
        throw new Error(`Invalid API response for text: "${text.slice(0, 50)}..."`);
      }
      const result = data.choices[0].message.content.trim().replace(/\s+/g, ' ');
      console.log('[Chuckle] Template from API:', result);
      if (!isRegenerate) {
        apiCache.set(cacheKey, result);
      }
      return result;
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    console.error('[Chuckle] API call failed:', lastError.message);
    throw lastError;
  }
}

// Normalize text for URL compatibility while preserving accented characters
// Keeps: é, è, ê, à, ù, ô, ñ, ü, ö, ä, ç, etc. (French, Spanish, German, Italian)
// URL-encodes special characters for safety
function normalizeText(text: string): string {
  // Remove only truly problematic characters, keep accented letters
  const cleaned = text
    .replace(/[<>"{}|\\^`]/g, '') // Remove URL-unsafe chars
    .replace(/\s+/g, '_'); // Spaces to underscores

  // URL encode to safely handle accents and special chars
  return encodeURIComponent(cleaned);
}

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false, forceRegenerate: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    const formattedText = (skipFormatting && text.includes(' / ')) ? text : await formatTextForTemplate(text, formattedTemplate, forceRegenerate);
    const cleanText = formattedText.replace(/['']/g, "'").replace(/…/g, '...');
    
    const parts = cleanText.split(' / ').map(p => p.trim()).filter(p => p.length > 0);
    let topText: string, bottomText: string;
    
    console.log('[Chuckle] Split parts:', parts);
    console.log('[Chuckle] Parts count:', parts.length);
    
    if (formattedTemplate === 'cmm') {
      topText = '~';
      bottomText = normalizeText(parts.join('  '));
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
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(await getErrorMessage('tooManyRequests'));
      }
      throw new Error('Template unavailable');
    }
    const watermarkedUrl = await addWatermark(url);
    return { watermarkedUrl, originalUrl: url, formattedText: cleanText };
  } catch (error) {
    logger.error('Meme image generation failed', error);
    // Re-throw critical errors that user needs to see
    if (error instanceof Error && (error.message.includes('429') ||
        error.message.includes('API exhausted') ||
        error.message.includes('API agotada') ||
        error.message.includes('API épuisée') ||
        error.message.includes('API erschöpft') ||
        error.message.includes('Too many requests') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('authentication failed') ||
        error.message.includes('403') ||
        error.message.includes('401'))) {
      throw error;
    }
    return { watermarkedUrl: CONFIG.FALLBACK_IMAGE_URL, originalUrl: CONFIG.FALLBACK_IMAGE_URL, formattedText: text };
  }
}
