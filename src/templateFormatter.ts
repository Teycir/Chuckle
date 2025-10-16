import { CONFIG } from './config';
import type { GeminiResponse } from './types';

const TEMPLATE_PROMPTS: Record<string, string> = {
  drake: 'Drake meme: TOP = bad/rejected option, BOTTOM = good/approved option. Make it savage and brutally honest about preferences. Format: "bad thing / good thing" (max 35 chars each)',
  db: 'Distracted BF: TOP = current focus, BOTTOM = tempting distraction. Make it about betrayal, temptation, or questionable priorities. Format: "current thing / tempting thing" (max 35 chars each)',
  ds: 'Two Buttons: TOP = first option, BOTTOM = second option (both equally difficult). Make it about impossible choices or moral dilemmas. Format: "option 1 / option 2" (max 35 chars each)',
  cmm: 'Change My Mind: TOP = setup, BOTTOM = controversial statement. Make it provocative, edgy, and designed to trigger debate. Format: "setup / bold claim" (max 35 chars each)',
  pigeon: 'Pigeon: TOP = thing being looked at, BOTTOM = "Is this [misidentification]?". Make it about hilariously wrong assumptions or stupidity. Format: "thing / Is this X?" (max 35 chars each)',
  'woman-cat': 'Woman Yelling at Cat: TOP = angry accusation, BOTTOM = dismissive response. Make it about conflict, drama, or not giving a damn. Format: "accusation / dismissal" (max 35 chars each)',
  fine: 'This is Fine: TOP = situation, BOTTOM = denial statement. Make it about denial in the face of disaster or chaos. Format: "situation / this is fine" (max 35 chars each)',
  stonks: 'Stonks: TOP = failure/mistake, BOTTOM = unexpected success. Make it about failing upward or absurd wins from stupid decisions. Format: "mistake / stonks" (max 35 chars each)',
  astronaut: 'Always Has Been: TOP = realization/question, BOTTOM = "Always has been". Make it about dark revelations or conspiracy truths. Format: "realization / Always has been" (max 35 chars each)',
  success: 'Success Kid: TOP = setup/challenge, BOTTOM = unexpected win. Make it about petty victories or savage comebacks. Format: "challenge / victory" (max 35 chars each)',
  blb: 'Bad Luck Brian: TOP = action taken, BOTTOM = unfortunate outcome. Make it about catastrophic failure or the worst possible outcome. Format: "action / bad result" (max 35 chars each)',
  mordor: 'One Does Not Simply: TOP = "One does not simply", BOTTOM = impossible task. Make it about ridiculously difficult or taboo things. Format: "One does not simply / task" (max 35 chars each)',
  aag: 'Ancient Aliens: TOP = mysterious thing, BOTTOM = conspiracy explanation. Make it about absurd conspiracy theories or paranoid explanations. Format: "mystery / aliens" (max 35 chars each)',
  fry: 'Futurama Fry: TOP = "Not sure if", BOTTOM = suspicious alternative. Make it about paranoia, suspicion, or questioning reality. Format: "Not sure if / or just" (max 35 chars each)',
  fwp: 'First World Problems: TOP = privileged situation, BOTTOM = trivial complaint. Make it about entitled whining or absurdly privileged complaints. Format: "situation / complaint" (max 35 chars each)',
  doge: 'Doge: TOP = "much" statement, BOTTOM = "such/very" statement. Make it silly, broken English, and overly enthusiastic. Format: "much X / such Y" (max 35 chars each)',
  iw: 'Insanity Wolf: TOP = extreme situation, BOTTOM = insane action. Make it about psychotic overreactions or unhinged responses. Format: "situation / extreme action" (max 35 chars each)',
  philosoraptor: 'Philosoraptor: TOP = philosophical question part 1, BOTTOM = question part 2. Make it a mind-bending or absurd philosophical paradox. Format: "question start / question end" (max 35 chars each)',
  grumpycat: 'Grumpy Cat: TOP = suggestion/request, BOTTOM = grumpy "No" response. Make it about bitter rejection or misanthropic refusal. Format: "request / No" (max 35 chars each)'
};

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&quot;': '"', '&#34;': '"', '&apos;': "'", '&#39;': "'",
    '&amp;': '&', '&#38;': '&', '&lt;': '<', '&#60;': '<',
    '&gt;': '>', '&#62;': '>', '&nbsp;': ' ', '&#160;': ' '
  };
  return text.replace(/&[#a-z0-9]+;/gi, match => entities[match.toLowerCase()] || '');
}

function cleanText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*#@]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function smartSplit(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 3) return `${words[0] || text} / ${words.slice(1).join(' ') || 'yes'}`;
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join(' ')} / ${words.slice(mid).join(' ')}`;
}

export async function formatTextForTemplate(text: string, template: string): Promise<string> {
  const templatePrompt = TEMPLATE_PROMPTS[template] || 'Format as two parts: "part 1 / part 2" (max 35 chars each)';
  
  console.log(`[Chuckle] Formatting text for ${template}`);
  
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) return smartSplit(text);
  
  const prompt = `${templatePrompt}\n\nAdapt this text to match the template format and personality. Keep the CORE TOPIC from the original text but adapt it to fit the template's style.\n\nSTRICT RULES:\n- MUST stay on the same topic/subject as the original text\n- Adapt the text to match the template's personality and format\n- MUST use " / " separator between top and bottom text\n- Each part MAX 35 characters\n- Make it funny while keeping the original topic\n- NO emojis, NO special characters, NO HTML entities\n- NO hashtags, NO asterisks\n\nText: "${text}"\n\nReturn ONLY the formatted text with " / " separator. Nothing else.`;

  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 1.4,
          topP: 0.98,
          topK: 64
        }
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      console.error('[Chuckle] Template formatting failed:', response.status);
      return smartSplit(text);
    }
    
    const data: GeminiResponse = await response.json();
    let formatted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (formatted) {
      formatted = formatted.replace(/^["']|["']$/g, '').trim();
      formatted = decodeHtmlEntities(formatted);
      formatted = cleanText(formatted);
      const lines = formatted.split('\n').filter(l => l.trim().length > 0);
      const firstLine = lines[0] || formatted;
      
      if (firstLine.includes(' / ')) {
        const parts = firstLine.split(' / ').map(p => p.trim());
        if (parts.length >= 2 && parts[0].length <= 35 && parts[1].length <= 35) {
          const cleanedLine = `${parts[0]} / ${parts[1]}`;
          console.log('[Chuckle] Text formatted for template:', cleanedLine);
          return cleanedLine;
        }
      }
    }
    
    console.log('[Chuckle] Formatted text too long, using smart split');
    return smartSplit(text);
  } catch (error) {
    console.error('[Chuckle] Template formatting error:', error);
    return smartSplit(text);
  }
}
