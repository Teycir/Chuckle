import { CONFIG } from './config';
import { logger } from './logger';
import { getErrorMessage } from './errorMessages';
import { addWatermark } from './watermark';
import { formatTextForTemplate } from './templateFormatter';

const MIN_GENERATION_INTERVAL = 3000; // 3 seconds between generations

export async function selectMemeTemplate(_text: string): Promise<string> {
  // Simple deterministic selection based on text length or random
  // For now, default to 'drake' as it's versatile
  return 'drake';
}

// Normalize text for URL compatibility while preserving accented characters
function normalizeText(text: string): string {
  // Remove only truly problematic characters, keep accented letters
  const cleaned = text
    .replaceAll(/[<>"{}|\\^`]/g, '') // Remove URL-unsafe chars
    .replaceAll(/\s+/g, '_'); // Spaces to underscores

  // URL encode to safely handle accents and special chars
  return encodeURIComponent(cleaned);
}

/**
 * Checks if the error message indicates a critical status that should be re-thrown.
 */
function isCriticalError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const criticalPatterns = [
    '429', 'API exhausted', 'API agotada', 'API épuisée', 'API erschöpft',
    'Too many requests', 'Too Many Requests'
  ];
  return criticalPatterns.some(pattern => error.message.includes(pattern));
}

/**
 * Determines the top and bottom text strings based on the template and content parts.
 */
function getMemeTexts(template: string, parts: string[], cleanText: string): { top: string; bottom: string } {
  if (template === 'cmm') {
    return { top: '~', bottom: normalizeText(parts.join('  ')) };
  }

  if (parts.length >= 2) {
    return {
      top: normalizeText(parts[0]),
      bottom: normalizeText(parts.slice(1).join(' '))
    };
  }

  if (parts.length === 1 && parts[0]) {
    const words = parts[0].split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    return {
      top: normalizeText(words.slice(0, mid).join(' ')),
      bottom: normalizeText(words.slice(mid).join(' ') || 'yes')
    };
  }

  return { top: normalizeText(cleanText), bottom: 'yes' };
}

async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  const data = await chrome.storage.local.get(['lastGenerationTime']);
  const lastGenerationTime = data.lastGenerationTime || 0;

  if (now - lastGenerationTime < MIN_GENERATION_INTERVAL) {
    const waitTime = Math.ceil((MIN_GENERATION_INTERVAL - (now - lastGenerationTime)) / 1000);
    throw new Error(`Please wait ${waitTime}s before generating another meme.`);
  }

  await chrome.storage.local.set({ lastGenerationTime: now });
}

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false, _forceRegenerate: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  await checkRateLimit();

  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    const formattedText = skipFormatting && text.includes(' / ') ? text : await formatTextForTemplate(text);
    const cleanText = formattedText.replace(/['']/g, "'").replace(/…/g, '...');

    const parts = cleanText.split(' / ').map(p => p.trim()).filter(p => p.length > 0);
    const { top, bottom } = getMemeTexts(formattedTemplate, parts, cleanText);

    const url = formattedTemplate === 'cmm'
      ? `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${bottom}.png`
      : `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${top}/${bottom}.png`;

    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      const errorMsg = response.status === 429 ? await getErrorMessage('tooManyRequests') : 'Template unavailable';
      throw new Error(errorMsg);
    }

    const watermarkedUrl = await addWatermark(url);
    return { watermarkedUrl, originalUrl: url, formattedText: cleanText };
  } catch (error) {
    logger.error('Meme image generation failed', error, {
      template,
      textLength: text.length,
      skipFormatting
    });
    if (isCriticalError(error)) throw error;
    return { watermarkedUrl: CONFIG.FALLBACK_IMAGE_URL, originalUrl: CONFIG.FALLBACK_IMAGE_URL, formattedText: text };
  }
}

