


export async function formatTextForTemplate(text: string): Promise<string> {
  // Simple heuristic splitter: split by newlines first, or punctuation, or just length

  // Basic splitting logic
  const cleaned = text.trim();

  if (cleaned.includes('/')) {
    return cleaned;
  }

  // Try splitting by newline if present
  if (cleaned.includes('\n')) {
    const parts = cleaned.split('\n').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} / ${parts.slice(1).join(' ')}`;
    }
  }

  // Try splitting by common sentence delimiters
  const splitMatch = /([.?!])\s+/.exec(cleaned);
  if (splitMatch?.index) {
    const part1 = cleaned.slice(0, splitMatch.index + 1).trim();
    const part2 = cleaned.slice(splitMatch.index + 1).trim();
    if (part1 && part2) {
      return `${part1} / ${part2}`;
    }
  }

  // Fallback: Split roughly in half by words
  const words = cleaned.split(/\s+/);
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    const part1 = words.slice(0, mid).join(' ');
    const part2 = words.slice(mid).join(' ');
    return `${part1} / ${part2}`;
  }

  return `${cleaned} / yes`;
}
