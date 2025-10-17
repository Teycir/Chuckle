/**
 * Generic text utilities - can be used in any project
 * Provides text sanitization, HTML decoding, and emoji removal
 */

/**
 * Decodes common HTML entities to their character equivalents
 * @param text - Text containing HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"', '&#34;': '"', '&apos;': "'", '&#39;': "'",
    '&amp;': '&', '&#38;': '&', '&lt;': '<', '&#60;': '<',
    '&gt;': '>', '&#62;': '>', '&nbsp;': ' ', '&#160;': ' '
  };
  return text.replace(/&[#a-z0-9]+;/gi, match => entities[match.toLowerCase()] || '');
}

/**
 * Removes emoji characters from text
 * @param text - Text containing emojis
 * @returns Text without emojis
 */
export function removeEmojis(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '');
}

/**
 * Sanitizes text by removing special characters and normalizing whitespace
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[*#@]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans text by removing emojis and special characters
 * @param text - Text to clean
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return sanitizeText(removeEmojis(text));
}
