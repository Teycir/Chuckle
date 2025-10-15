export const MEME_TEMPLATES = [
  'Distracted Boyfriend',
  'Drake Hotline Bling',
  'Two Buttons',
  'Change My Mind',
  'Expanding Brain',
  'Is This A Pigeon',
  'Woman Yelling At Cat',
  'Bernie Sanders',
  'Surprised Pikachu',
  'This Is Fine',
  'Galaxy Brain',
  'Stonks',
  'Always Has Been',
  'Buff Doge vs Cheems',
  'Wojak',
  'Pepe The Frog',
  'Success Kid',
  'Bad Luck Brian',
  'One Does Not Simply',
  'Ancient Aliens'
];

export function getRandomTemplate(): string {
  return MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];
}
