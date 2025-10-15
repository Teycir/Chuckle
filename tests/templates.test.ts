import { MEME_TEMPLATES, getRandomTemplate } from '../src/templates';

describe('Templates', () => {
  test('has 20 templates', () => {
    expect(MEME_TEMPLATES.length).toBe(20);
  });

  test('includes popular templates', () => {
    expect(MEME_TEMPLATES).toContain('Drake Hotline Bling');
    expect(MEME_TEMPLATES).toContain('Distracted Boyfriend');
    expect(MEME_TEMPLATES).toContain('Stonks');
  });

  test('getRandomTemplate returns valid template', () => {
    const template = getRandomTemplate();
    expect(MEME_TEMPLATES).toContain(template);
  });

  test('getRandomTemplate returns different values', () => {
    const templates = new Set();
    for (let i = 0; i < 50; i++) {
      templates.add(getRandomTemplate());
    }
    expect(templates.size).toBeGreaterThan(1);
  });
});
