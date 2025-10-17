import { CONFIG } from './config';
import type { GeminiResponse } from './types';
import { getErrorMessage } from './errorMessages';

const TEMPLATE_PROMPTS: Record<string, string> = {
  drake: 'Drake (rejecting/approving): TOP=rejected option (what Drake pushes away), BOTTOM=approved option (what Drake wants). Keep original sentiment. Example: "Paid ads / One viral Reddit post"',
  db: 'Distracted Boyfriend: TOP=tempting new thing, BOTTOM=current thing being ignored. About temptation/distraction. Example: "New framework / Finishing current project"',
  ds: 'Two Buttons (sweating): Both options equally difficult/impossible. About hard choices. Example: "Ship buggy code / Miss deadline"',
  cmm: 'Change My Mind: Controversial/bold statement. Example: "Reddit > paid marketing"',
  pigeon: 'Pigeon (Is this...?): TOP=thing seen, BOTTOM="Is this [wrong label]?". About misidentification. Example: "40 users / Is this going viral?"',
  'woman-cat': 'Woman Yelling at Cat: TOP=angry accusation, BOTTOM=calm dismissal. Example: "You need more users! / I got 40, I\'m good"',
  fine: 'This is Fine (dog in fire): Denial during disaster. Example: "0 users for 3 weeks / This is fine"',
  stonks: 'Stonks: Failing upward, unexpected win from mistake. Example: "One lazy Reddit post / 40 users"',
  astronaut: 'Always Has Been: Dark revelation. TOP=realization, BOTTOM="Always has been". Example: "Wait, Reddit works? / Always has been"',
  success: 'Success Kid (fist pump): CELEBRATING small wins, feeling accomplished. Example: "Only got 40 users / Feels like a million"',
  blb: 'Bad Luck Brian: Worst possible outcome. Example: "Posted on Reddit / Got roasted instead"',
  mordor: 'One Does Not Simply: Impossible task. TOP="One does not simply", BOTTOM=task. Example: "One does not simply / Get users from Reddit"',
  aag: 'Ancient Aliens: Conspiracy theory explanation. Example: "Reddit success / Aliens"',
  fry: 'Futurama Fry (squinting): Suspicion/paranoia. TOP="Not sure if", BOTTOM="or". Example: "Not sure if good post / Or just got lucky"',
  fwp: 'First World Problems: Privileged complaint. Example: "Got 40 users / But wanted 100"',
  doge: 'Doge: Broken English, enthusiastic. TOP="much/wow", BOTTOM="such/very". Example: "much Reddit success / very 40 users wow"',
  iw: 'Insanity Wolf: Extreme overreaction. Example: "Got 40 users / QUIT JOB, GO FULL TIME"',
  philosoraptor: 'Philosoraptor: Mind-bending question. Example: "If Reddit gave me users / Did I find Reddit or did it find me?"',
  grumpycat: 'Grumpy Cat: Grumpy rejection. Example: "Celebrate 40 users? / No."'
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

async function extractSentiment(text: string): Promise<{topic: string; sentiment: string; key_numbers: string}> {
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) return {topic: text, sentiment: 'neutral', key_numbers: ''};
  
  const prompt = `Analyze this text and extract:
1. TOPIC (what it's about in 3-5 words)
2. SENTIMENT (positive/negative/neutral/excited/proud/frustrated)
3. KEY_NUMBERS (any important numbers with context, e.g., "40 users")

Examples:
- "I know 40 isn't a lot but it feels like a huge accomplishment" → TOPIC: getting first users | SENTIMENT: proud/excited | KEY_NUMBERS: 40 users
- "When you finally understand recursion" → TOPIC: understanding recursion | SENTIMENT: excited | KEY_NUMBERS: none
- "My code works but I don't know why" → TOPIC: mysterious code success | SENTIMENT: confused/lucky | KEY_NUMBERS: none

Text: "${text}"

Return in format: TOPIC: xxx | SENTIMENT: xxx | KEY_NUMBERS: xxx`;

  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, topP: 0.7, topK: 10, maxOutputTokens: 50 }
      })
    });
    
    if (!response.ok) return {topic: text, sentiment: 'neutral', key_numbers: ''};
    
    const data: GeminiResponse = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    const topicMatch = result.match(/TOPIC:\s*([^|]+)/);
    const sentimentMatch = result.match(/SENTIMENT:\s*([^|]+)/);
    const numbersMatch = result.match(/KEY_NUMBERS:\s*(.+)/);
    
    const analysis = {
      topic: topicMatch?.[1]?.trim() || text,
      sentiment: sentimentMatch?.[1]?.trim() || 'neutral',
      key_numbers: numbersMatch?.[1]?.trim() || ''
    };
    
    console.log('[Chuckle] Sentiment analysis:', analysis);
    return analysis;
  } catch (error) {
    console.error('[Chuckle] Sentiment extraction failed:', error);
    return {topic: text, sentiment: 'neutral', key_numbers: ''};
  }
}

export async function formatTextForTemplate(text: string, template: string): Promise<string> {
  const templatePrompt = TEMPLATE_PROMPTS[template] || 'Format as two parts: "part 1 / part 2" (max 35 chars each)';
  
  console.log(`[Chuckle] Formatting text for ${template}`);
  
  const { geminiApiKey } = await chrome.storage.local.get(['geminiApiKey']);
  if (!geminiApiKey) return smartSplit(text);
  
  const analysis = await extractSentiment(text);
  
  const prompt = `Template: ${templatePrompt}

Context:
- Topic: ${analysis.topic}
- Sentiment: ${analysis.sentiment}
- Key info: ${analysis.key_numbers || 'none'}
- Original: "${text}"

RULES:
1. Each part MAX 30 chars (strict!)
2. Use " / " separator
3. Match template personality
4. Keep sentiment (${analysis.sentiment})
5. Include key info if relevant (${analysis.key_numbers})
6. NO emojis/special chars

Return ONLY: "top text / bottom text"`;

  try {
    const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.85,
          topK: 25,
          maxOutputTokens: 30
        }
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        const errorMsg = await getErrorMessage('tooManyRequests');
        throw new Error(errorMsg);
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
        if (parts.length >= 2) {
          const part1 = parts[0].slice(0, 35);
          const part2 = parts[1].slice(0, 35);
          const cleanedLine = `${part1} / ${part2}`;
          console.log('[Chuckle] Text formatted for template:', cleanedLine, `(${part1.length}/${part2.length} chars)`);
          return cleanedLine;
        }
      }
    }
    
    throw new Error('AI failed to format with separator');
  } catch (error) {
    console.error('[Chuckle] Template formatting error:', error);
    if (error instanceof Error && (error.message.includes('Too many requests') || error.message.includes('429'))) {
      throw error;
    }
    throw new Error(`Failed to format text for ${template}: ${error}`);
  }
}
