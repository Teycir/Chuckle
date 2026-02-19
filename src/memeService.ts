import { CONFIG } from './config';
import { apiCache } from './cache';
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


    if (formattedTemplate === 'cmm') {
      topText = '~';
      bottomText = normalizeText(parts.join('  '));
    } else if (parts.length >= 2) {
      const bottomParts = parts.slice(1);
      const bottomJoined = bottomParts.join(' ');
      topText = normalizeText(parts[0]);
      bottomText = normalizeText(bottomJoined);
    } else if (parts.length === 1 && parts[0]) {
      const words = parts[0].split(/\s+/);
      const mid = Math.ceil(words.length / 2);
      topText = normalizeText(words.slice(0, mid).join(' '));
      bottomText = normalizeText(words.slice(mid).join(' ') || 'yes');
    } else {
      topText = normalizeText(cleanText);
      bottomText = 'yes';
    }

    let url: string;
    if (formattedTemplate === 'cmm') {
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${bottomText}.png`;
    } else if (formattedTemplate === 'grumpycat') {
      // Grumpy Cat uses a different format: /grumpycat/top_text/bottom_text.png
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${topText}/${bottomText}.png`;
    } else {
      url = `${CONFIG.MEMEGEN_API_URL}/${formattedTemplate}/${topText}/${bottomText}.png`;
    }
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
