export const CONFIG = {
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  IMGFLIP_API_URL: 'https://api.imgflip.com/caption_image',
  MEMEGEN_API_URL: 'https://api.memegen.link/images',
  FALLBACK_IMAGE_URL: 'https://api.memegen.link/images/drake/meme_generation_failed/please_try_again.png',
  DEBOUNCE_DELAY: 150,
  MAX_TAG_LENGTH: 100,
  MAX_HISTORY_ITEMS: 1000,
  BATCH_VARIANTS_OPTIONS: [1, 2, 3] as const,
  DEFAULT_VARIANTS: 1,
  MAX_UNDO_STACK: 20,
  CACHE_TTL_MS: 3600000
} as const;
