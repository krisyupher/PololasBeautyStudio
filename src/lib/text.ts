/**
 * Splits a short phrase into `count` lines of similar length, the way the printed catalog sets
 * its handwritten accents ("Armonía / en cada / detalle"). Words are never split.
 *
 * The longest line decides how wide the accent is, so that is minimized first; then lines of
 * even length win, and finally lines that get shorter towards the end (they are indented).
 */
export function balanceLines(text: string, count = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lineCount = Math.max(1, Math.min(Math.floor(count), words.length));

  let best: string[] = [words.join(' ')];
  let bestScore = Number.POSITIVE_INFINITY;

  // Phrases are a handful of words, so every placement of the line breaks can be tried.
  const visit = (start: number, linesLeft: number, lines: string[]): void => {
    if (linesLeft === 1) {
      const candidate = [...lines, words.slice(start).join(' ')];
      const score = scoreLines(candidate);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
      return;
    }
    // Leave at least one word for each of the remaining lines.
    for (let end = start + 1; end <= words.length - (linesLeft - 1); end++) {
      visit(end, linesLeft - 1, [...lines, words.slice(start, end).join(' ')]);
    }
  };

  visit(0, lineCount, []);
  return best;
}

function scoreLines(lines: string[]): number {
  const lengths = lines.map((line) => line.length);
  const longest = Math.max(...lengths);
  const mean = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const spread = lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0);
  let growth = 0;
  for (let index = 1; index < lengths.length; index++) {
    growth += Math.max(0, (lengths[index] ?? 0) - (lengths[index - 1] ?? 0));
  }
  return longest * 10_000 + spread * 10 + growth;
}
