export const MEME_TEMPLATES = [
  { id: 'drake', name: 'Drake', topics: ['choice', 'preference', 'comparison', 'rejection', 'approval'] },
  { id: 'db', name: 'Distracted BF', topics: ['temptation', 'distraction', 'betrayal', 'choice', 'infidelity'] },
  { id: 'ds', name: 'Daily Struggle', topics: ['dilemma', 'hard choice', 'stress', 'decision', 'pressure'] },
  { id: 'cmm', name: 'Change My Mind', topics: ['opinion', 'debate', 'controversial', 'statement', 'challenge'] },
  { id: 'pigeon', name: 'Pigeon', topics: ['confusion', 'misunderstanding', 'wrong', 'mistake', 'identification'] },
  { id: 'woman-cat', name: 'Woman Cat', topics: ['argument', 'accusation', 'defense', 'dismissal', 'conflict'] },
  { id: 'fine', name: 'This Is Fine', topics: ['denial', 'disaster', 'chaos', 'cope', 'fire'] },
  { id: 'stonks', name: 'Stonks', topics: ['success', 'profit', 'unexpected', 'win', 'growth'] },

  { id: 'success', name: 'Success Kid', topics: ['victory', 'achievement', 'win', 'triumph', 'celebration'] },
  { id: 'blb', name: 'Bad Luck Brian', topics: ['failure', 'misfortune', 'unlucky', 'disaster', 'backfire'] },

  { id: 'fry', name: 'Futurama Fry', topics: ['suspicion', 'doubt', 'uncertain', 'paranoid', 'question'] },
  { id: 'fwp', name: 'First World', topics: ['privilege', 'complaint', 'minor', 'luxury', 'trivial'] },
  { id: 'doge', name: 'Doge', topics: ['excitement', 'enthusiasm', 'wow', 'much', 'very'] },
  { id: 'iw', name: 'Insanity Wolf', topics: ['extreme', 'crazy', 'overreaction', 'insane', 'wild'] },
  { id: 'philosoraptor', name: 'Philosoraptor', topics: ['philosophy', 'deep', 'thinking', 'paradox', 'question'] },
  { id: 'grumpycat', name: 'Grumpy Cat', topics: ['grumpy', 'rejection', 'no', 'refusal', 'negative'] }
] as const;

export const GEMINI_PROMPT_TEMPLATE = (text: string, topic?: string) => 
  `Analyze this text and suggest ONE meme template from this list: db (distracted boyfriend), drake, ds (daily struggle), cmm (change my mind), pigeon, woman-cat, fine (this is fine), stonks, success, blb (bad luck brian), fry (futurama fry), fwp (first world problems), doge, iw (insanity wolf), philosoraptor, grumpycat. Text: "${text}".${topic ? ` Topic: ${topic}.` : ''} Return ONLY the template ID (e.g., "db", "drake"). No explanation.`;

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
