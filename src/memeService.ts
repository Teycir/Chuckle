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
// Keeps: é, è, ê, à, ù, ô, ñ, ü, ö, ä, ç, etc. (French, Spanish, German, Italian)
// URL-encodes special characters for safety
function normalizeText(text: string): string {
  // Remove only truly problematic characters, keep accented letters
  const cleaned = text
    .replaceAll(/[<>"{}|\\^`]/g, '') // Remove URL-unsafe chars
    .replaceAll(/\s+/g, '_'); // Spaces to underscores

  // URL encode to safely handle accents and special chars
  return encodeURIComponent(cleaned);
}

// Helper to determine text parts
function getMemeTextParts(template: string, parts: string[], cleanText: string): { topText: string, bottomText: string } {
  if (template === 'cmm') {
    return { topText: '~', bottomText: normalizeText(parts.join('  ')) };
  }

  if (parts.length >= 2) {
    return {
      topText: normalizeText(parts[0]),
      bottomText: normalizeText(parts.slice(1).join(' '))
    };
  }

  if (parts.length === 1 && parts[0]) {
    const words = parts[0].split(/\s+/);
    const mid = Math.ceil(words.length / 2);
    return {
      topText: normalizeText(words.slice(0, mid).join(' ')),
      bottomText: normalizeText(words.slice(mid).join(' ') || 'yes')
    };
  }

  return { topText: normalizeText(cleanText), bottomText: 'yes' };
}

function constructMemeUrl(template: string, topText: string, bottomText: string): string {
  if (template === 'cmm') {
    return `${CONFIG.MEMEGEN_API_URL}/${template}/${bottomText}.png`;
  }
  return `${CONFIG.MEMEGEN_API_URL}/${template}/${topText}/${bottomText}.png`;
}

function isCriticalError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const criticalPhrases = [
    '429', 'API exhausted', 'API agotada', 'API épuisée', 'API erschöpft',
    'Too many requests', 'Too Many Requests', 'authentication failed', '403', '401'
  ];
  return criticalPhrases.some(phrase => error.message.includes(phrase));
}

export async function generateMemeImage(template: string, text: string, skipFormatting: boolean = false, forceRegenerate: boolean = false): Promise<{ watermarkedUrl: string; originalUrl: string; formattedText: string }> {
  try {
    const formattedTemplate = template.trim().toLowerCase().replace(/\s+/g, '_');
    const formattedText = (skipFormatting && text.includes(' / ')) ? text : await formatTextForTemplate(text, formattedTemplate, forceRegenerate);
    const cleanText = formattedText.replaceAll(/['']/g, "'").replace(/…/g, '...');
    const parts = cleanText.split(' / ').map(p => p.trim()).filter(p => p.length > 0);

    const { topText, bottomText } = getMemeTextParts(formattedTemplate, parts, cleanText);
    const url = constructMemeUrl(formattedTemplate, topText, bottomText);

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
    if (isCriticalError(error)) {
      throw error;
    }
    return { watermarkedUrl: CONFIG.FALLBACK_IMAGE_URL, originalUrl: CONFIG.FALLBACK_IMAGE_URL, formattedText: text };
  }
}
