export const MEME_TEMPLATES = [
  { id: 'drake', name: 'Drake' },
  { id: 'db', name: 'Distracted BF' },
  { id: 'ds', name: 'Daily Struggle' },
  { id: 'cmm', name: 'Change My Mind' },
  { id: 'pigeon', name: 'Pigeon' },
  { id: 'woman-cat', name: 'Woman Cat' },
  { id: 'fine', name: 'This Is Fine' },
  { id: 'stonks', name: 'Stonks' },
  { id: 'astronaut', name: 'Always Has Been' },
  { id: 'success', name: 'Success Kid' },
  { id: 'blb', name: 'Bad Luck Brian' },
  { id: 'mordor', name: 'One Does Not' },
  { id: 'aag', name: 'Ancient Aliens' },
  { id: 'fry', name: 'Futurama Fry' },
  { id: 'fwp', name: 'First World' },
  { id: 'doge', name: 'Doge' },
  { id: 'iw', name: 'Insanity Wolf' },
  { id: 'philosoraptor', name: 'Philosoraptor' },
  { id: 'grumpycat', name: 'Grumpy Cat' }
] as const;

export const GEMINI_PROMPT_TEMPLATE = (text: string) => 
  `Analyze this text and suggest ONE meme template from this list: db (distracted boyfriend), drake, ds (daily struggle), cmm (change my mind), pigeon, woman-cat, fine (this is fine), stonks, astronaut (always has been), success, blb (bad luck brian), mordor (one does not simply), aag (ancient aliens), fry (futurama fry), fwp (first world problems), doge, iw (insanity wolf), philosoraptor, grumpycat. Text: "${text}". Return ONLY the template ID (e.g., "db", "drake"). No explanation.`;

export const TEXT_OPTIMIZATION_PROMPT = (text: string) => 
  `Transform this into HILARIOUS meme text (max 100 chars). Be creative, witty, and punchy. Add comedic timing, irony, or relatable humor. Fix typos, complete or remove cut-off sentences. Make it viral-worthy! Text: "${text}". Return ONLY the optimized text, nothing else.`;

export const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35}$/;

export const ERROR_MESSAGES = {
  NO_API_KEY: 'API key not configured',
  INVALID_API_KEY: 'Invalid API key format',
  API_ERROR: (status: number) => `API error: ${status}`,
  INVALID_RESPONSE: 'Invalid API response',
  TEMPLATE_UNAVAILABLE: 'Template unavailable'
} as const;
