export const GEMINI_PROMPT_TEMPLATE = (text: string) => 
  `Analyze this text and suggest ONE meme template from this list: db (distracted boyfriend), drake, ds (daily struggle), cmm (change my mind), gb (galaxy brain), pigeon, woman-cat, fine (this is fine), stonks, astronaut (always has been), success, blb (bad luck brian), mordor (one does not simply), aag (ancient aliens), fry (futurama fry), fwp (first world problems), doge, iw (insanity wolf), philosoraptor, grumpycat. Text: "${text}". Return ONLY the template ID (e.g., "db", "drake", "gb"). No explanation.`;

export const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35}$/;

export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured',
  INVALID_API_KEY: 'Invalid API key format',
  API_ERROR: (status: number) => `API error: ${status}`,
  INVALID_RESPONSE: 'Invalid API response',
  TEMPLATE_UNAVAILABLE: 'Template unavailable'
} as const;
