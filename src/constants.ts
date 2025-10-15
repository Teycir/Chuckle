export const GEMINI_PROMPT_TEMPLATE = (text: string) => 
  `Analyze this text and suggest a meme template: "${text}". Return only the template name.`;

export const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35}$/;

export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured',
  INVALID_API_KEY: 'Invalid API key format',
  API_ERROR: (status: number) => `API error: ${status}`,
  INVALID_RESPONSE: 'Invalid API response',
  TEMPLATE_UNAVAILABLE: 'Template unavailable'
} as const;
