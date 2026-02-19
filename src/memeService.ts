import { CONFIG } from './config';
import { logger } from './logger';
import { getErrorMessage } from './errorMessages';
import { addWatermark } from './watermark';
import { formatTextForTemplate } from './templateFormatter';

export async function analyzeMemeContext(text: string, variant: number = 0): Promise<string> {
  // Default to 'drake' or random if we wanted to be fancy, but let's stick to 'drake' as a safe default
  // The user will manually change it anyway.
  return 'drake';
}

// Normalize text for URL compatibility while preserving accented characters
function normalizeText(text: string): string {
  // Remove only truly problematic characters, keep accented letters
  const cleaned = text
    .replace(/[<>"{}|\\^`]/g, '') // Remove URL-unsafe chars
    .replace(/\s+/g, '_'); // Spaces to underscores

  // URL encode to safely handle accents and special chars
  return encodeURIComponent(cleaned);
}

/**
 * Checks if the error message indicates a critical status that should be re-thrown.
 */
function isCriticalError(error: any): boolean {
  if (!(error instanceof Error)) return false;
  const criticalPatterns = [
    '429', 'API exhausted', 'API agotada', 'API épuisée', 'API erschöpft',
    'Too many requests', 'Too Many Requests', 'authentication failed', '403', '401'
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

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false, forceRegenerate: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    const formattedText = (skipFormatting && text.includes(' / ')) ? text : await formatTextForTemplate(text, formattedTemplate, forceRegenerate);
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
    logger.error('Meme image generation failed', error);
    if (isCriticalError(error)) throw error;
    return { watermarkedUrl: CONFIG.FALLBACK_IMAGE_URL, originalUrl: CONFIG.FALLBACK_IMAGE_URL, formattedText: text };
  }
}
