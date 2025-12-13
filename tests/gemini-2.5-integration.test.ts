/**
 * Integration test for Gemini 2.5 Flash
 * This test makes REAL API calls to verify the model works
 */

const TEST_API_KEY = 'AIzaSyCHopEXJ9mkRpRiCGk-qumfSvLq9VcibyQ';

describe('Gemini 2.5 Flash Integration Tests', () => {
  
  test('topic extraction returns valid topic', async () => {
    const prompt = 'Extract the main topic/theme from this text in 1-3 words: "Over 100 million people connect and share their wisdom". Return ONLY the topic words (e.g., "choice", "failure", "confusion"). No explanation.';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${TEST_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, topP: 0.8, topK: 20, maxOutputTokens: 10 }
        })
      }
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    const topic = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    
    console.log('Topic extracted:', topic);
    expect(topic).toBeDefined();
    expect(topic.length).toBeGreaterThan(0);
    expect(topic.split(' ').length).toBeLessThanOrEqual(3);
  }, 15000);

  test('template selection returns valid template ID', async () => {
    const text = 'Over 100 million people connect and share their wisdom';
    const prompt = `Analyze this text and suggest ONE meme template from this list: db (distracted boyfriend), drake, ds (two buttons - sweating over impossible choices), cmm (change my mind), pigeon, woman-cat, fine (this is fine), stonks, success, blb (bad luck brian), fry (futurama fry), fwp (first world problems), doge, iw (insanity wolf), philosoraptor, grumpycat. Text: "${text}". Return ONLY the template ID (e.g., "db", "drake"). No explanation.`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${TEST_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topP: 0.9, topK: 30 }
        })
      }
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    const template = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    
    console.log('Template selected:', template);
    expect(template).toBeDefined();
    expect(template.length).toBeGreaterThan(0);
    
    const validTemplates = ['db', 'drake', 'ds', 'cmm', 'pigeon', 'woman-cat', 'fine', 'stonks', 'success', 'blb', 'fry', 'fwp', 'doge', 'iw', 'philosoraptor', 'grumpycat'];
    expect(validTemplates).toContain(template);
  }, 15000);

  test('text formatting returns proper separator format', async () => {
    const text = 'Over 100 million people connect and share their wisdom';
    const prompt = `Format: "${text}"

Template: Futurama Fry (squinting): TOP="Not sure if [first option]", BOTTOM="Or [second option]". Very paranoid, at limit of insanity.

RULES:
1. Return ONLY: "text1 / text2"
2. Each part MAX 70 chars
3. Language: English
4. Be concise and viral
5. CRITICAL: Be concise and creative - rephrase to fit within 70 chars

CRITICAL - Choose ONE definitive answer:
- NO alternatives ("OR", "Alternatively", "could be")
- NO thinking process or commentary
- NO multiple options
- Just return the FINAL result

Response (ONLY the 2 parts):`;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${TEST_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topP: 0.85, topK: 25, maxOutputTokens: 100 }
        })
      }
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    const formatted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    console.log('Formatted text:', formatted);
    expect(formatted).toBeDefined();
    expect(formatted).toContain('/');
    
    const parts = formatted.split('/').map(p => p.trim());
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[0].length).toBeLessThanOrEqual(80);
    expect(parts[1].length).toBeLessThanOrEqual(80);
  }, 15000);
});
