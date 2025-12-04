import type { GeminiResponse } from './types';
import { CONFIG } from './config';
import { geminiCache } from './cache';
import { logger } from './logger';
import { API_KEY_REGEX, GEMINI_PROMPT_TEMPLATE } from './constants';
import { getErrorMessage } from './errorMessages';
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

async function extractTopic(text: string, provider: string, apiKey: string, model?: string): Promise<string> {
  const prompt = `Extract the main topic/theme from this text in 1-3 words: "${text}". Return ONLY the topic words (e.g., "choice", "failure", "confusion"). No explanation.`;
  
  try {
    let response: Response;
    if (provider === 'google') {
      // Use selected model for topic extraction
      const modelName = (model || 'models/gemini-2.0-flash').replace('models/', '');
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      response = await fetchWithTimeout(
        `${apiUrl}?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, topP: 0.8, topK: 20, maxOutputTokens: 10 }
          })
        },
        5000
      );
    } else {
      response = await fetchWithTimeout(
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
    }
    
    if (!response.ok) return '';
    const data: any = await response.json();
    const topic = provider === 'google' 
      ? data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase()
      : data.choices?.[0]?.message?.content?.trim().toLowerCase();
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
  const cacheKey = `gemini:${text}${isRegenerate ? `:v${variant}` : ''}`;

  if (!isRegenerate) {
    const cached = geminiCache.get(cacheKey);
    if (cached) {
      console.log('[Chuckle] Using cached template:', cached);
      return cached;
    }
  }

  const { aiProvider, geminiApiKey, openrouterApiKey, primaryModel, openrouterPrimaryModel } = await chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openrouterApiKey', 'primaryModel', 'openrouterPrimaryModel']);
  const provider = aiProvider || 'google';
  const model = provider === 'google' ? (primaryModel || 'models/gemini-2.0-flash') : (openrouterPrimaryModel || 'meta-llama/llama-3.2-3b-instruct:free');
  
  console.log('[Chuckle] Calling AI API for text:', text.slice(0, 50), isRegenerate ? '(regenerate)' : '', `| Provider: ${provider} | Model: ${model}`);
  
  if (provider === 'google') {
    if (!geminiApiKey) throw new Error(await getErrorMessage('noApiKey'));
    if (!validateApiKey(geminiApiKey)) throw new Error(await getErrorMessage('invalidApiKey'));
  } else {
    if (!openrouterApiKey) throw new Error(await getErrorMessage('noApiKey'));
  }

  const topic = !isRegenerate ? await extractTopic(text, provider, provider === 'google' ? geminiApiKey : openrouterApiKey, model) : '';

  try {
      let response: Response;
      
      if (provider === 'google') {
        const modelName = model.replace('models/', '');
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        response = await fetchWithTimeout(
          `${apiUrl}?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: isRegenerate
                    ? `${GEMINI_PROMPT_TEMPLATE(text)}\n\nIMPORTANT: Provide a DIFFERENT template than you might have suggested before for this text. Choose an alternative that fits the context.`
                    : GEMINI_PROMPT_TEMPLATE(text, topic)
                }]
              }],
              generationConfig: isRegenerate ? {
                temperature: 1.3,
                topP: 0.98,
                topK: 64
              } : {
                temperature: 0.7,
                topP: 0.9,
                topK: 30
              }
            })
          },
          10000
        );
      } else {
        response = await fetchWithTimeout(
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
                  ? `${GEMINI_PROMPT_TEMPLATE(text)}\n\nIMPORTANT: Provide a DIFFERENT template than you might have suggested before for this text. Choose an alternative that fits the context.`
                  : GEMINI_PROMPT_TEMPLATE(text, topic)
              }],
              temperature: isRegenerate ? 1.3 : 0.7,
              top_p: isRegenerate ? 0.98 : 0.9
            })
          },
          10000
        );
      }

      if (!response.ok) {
        console.error(`[Chuckle] ${provider === 'google' ? 'Gemini' : 'OpenRouter'} API error:`, response.status);
        if (response.status === 429) {
          throw new Error(await getErrorMessage('tooManyRequests'));
        }
        if (response.status === 403 || response.status === 401) {
          throw new Error(await getErrorMessage('invalidApiKey'));
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data: any = await response.json();
      console.log('[Chuckle] AI API response received');
      
      let result: string;
      if (provider === 'google') {
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error(`Invalid API response for text: "${text.slice(0, 50)}..."`);
        }
        result = data.candidates[0].content.parts[0].text.trim().replace(/\s+/g, ' ');
      } else {
        if (data.error) throw new Error(data.error.message);
        if (!data.choices?.[0]?.message?.content) {
          throw new Error(`Invalid API response for text: "${text.slice(0, 50)}..."`);
        }
        result = data.choices[0].message.content.trim().replace(/\s+/g, ' ');
      }
      console.log('[Chuckle] Template from API:', result);
      if (!isRegenerate) {
        geminiCache.set(cacheKey, result);
      }
      return result;
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    console.error('[Chuckle] API call failed:', lastError.message);
    throw lastError;
  }
}

async function summarizeText(text: string): Promise<string> {
  const { aiProvider, geminiApiKey, openrouterApiKey } = await chrome.storage.local.get(['aiProvider', 'geminiApiKey', 'openrouterApiKey']);
  const provider = aiProvider || 'google';
  
  if ((provider === 'google' && !geminiApiKey) || (provider === 'openrouter' && !openrouterApiKey)) {
    const words = text.split(/\s+/);
    return words.slice(0, 30).join(' ');
  }
  
  console.log('[Chuckle] Summarizing long text');
  
  try {
    // Get current model from storage
    const { primaryModel } = await chrome.storage.local.get(['primaryModel']);
    const currentModel = primaryModel || 'models/gemini-2.0-flash';
    const modelName = currentModel.replace('models/', '');
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    
    const response = await fetchWithTimeout(
      `${apiUrl}?key=${geminiApiKey}`,
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
      if (response.status === 429) {
        console.warn('[Chuckle] Rate limit hit during summarization, using fallback');
        const words = text.split(/\s+/);
        return words.slice(0, 30).join(' ');
      }
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

// Normalize text for URL compatibility while preserving accented characters
// Keeps: é, è, ê, à, ù, ô, ñ, ü, ö, ä, ç, etc. (French, Spanish, German, Italian)
// URL-encodes special characters for safety
function normalizeText(text: string): string {
  // Remove only truly problematic characters, keep accented letters
  let cleaned = text
    .replace(/[<>"{}|\\^`\[\]]/g, '') // Remove URL-unsafe chars
    .replace(/\s+/g, '_'); // Spaces to underscores

  // URL encode to safely handle accents and special chars
  return encodeURIComponent(cleaned);
}

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false, forceRegenerate: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    let processedText = text;
    
    processedText = text;
    const formattedText = (skipFormatting && text.includes(' / ')) ? processedText : await formatTextForTemplate(processedText, formattedTemplate, forceRegenerate);
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
