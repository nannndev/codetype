import { SNIPPETS } from "@/data/snippets";
import type { Snippet } from "@/types";

/** Drill lines outside this range are either too trivial or too punishing. */
const MIN_LINE = 12;
const MAX_LINE = 78;
const DEFAULT_LINES = 12;

interface ScoredLine {
  text: string;
  score: number;
  language: string;
}

let lineCache: ScoredLine[] | null = null;

/**
 * Flattens the corpus into candidate drill lines once. Leading indentation is
 * stripped so a drill is about the characters being practised, not about
 * re-typing eight spaces on every line.
 */
function corpusLines(): ScoredLine[] {
  if (lineCache) return lineCache;

  const seen = new Set<string>();
  const lines: ScoredLine[] = [];
  for (const snippet of SNIPPETS) {
    for (const raw of snippet.code.split("\n")) {
      const text = raw.trim();
      if (text.length < MIN_LINE || text.length > MAX_LINE) continue;
      if (seen.has(text)) continue;
      seen.add(text);
      lines.push({ text, score: 0, language: snippet.language });
    }
  }

  lineCache = lines;
  return lines;
}

/**
 * Picks corpus lines densest in `targets`. Mining real code beats generating
 * character soup: the lines stay idiomatic, so the drill trains the character
 * in the context it actually appears in.
 */
export function buildDrillSnippet(targets: string[], lineCount = DEFAULT_LINES): Snippet | null {
  // Space is excluded even when it ranks as a weakness: nearly every line
  // contains several, so scoring by it just selects whichever line has the most
  // whitespace instead of lines worth practising. It still gets reported.
  const wanted = targets.filter((char) => char.length === 1 && char !== " ");
  if (wanted.length === 0) return null;

  const targetSet = new Set(wanted);
  const scored: ScoredLine[] = [];

  for (const line of corpusLines()) {
    let hits = 0;
    const covered = new Set<string>();
    for (const char of line.text) {
      if (!targetSet.has(char)) continue;
      hits += 1;
      covered.add(char);
    }
    if (hits === 0) continue;
    // Density over raw count, with a bonus for lines hitting several targets at
    // once — otherwise one very long line beats a tight line every time.
    const density = hits / line.text.length;
    scored.push({ ...line, score: density * (1 + covered.size * 0.6) });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);

  // Take the best lines, but make sure every requested character appears at
  // least once: a top-N cut can otherwise drop the rarest target entirely.
  const picked: ScoredLine[] = [];
  const usedText = new Set<string>();
  const missing = new Set(wanted);

  for (const line of scored) {
    if (picked.length >= lineCount) break;
    if (usedText.has(line.text)) continue;
    picked.push(line);
    usedText.add(line.text);
    for (const char of line.text) missing.delete(char);
  }

  for (const char of missing) {
    const rescue = scored.find((line) => !usedText.has(line.text) && line.text.includes(char));
    if (!rescue) continue;
    if (picked.length >= lineCount) picked.pop();
    picked.push(rescue);
    usedText.add(rescue.text);
  }

  if (picked.length === 0) return null;

  // Interleave so the hardest lines are spread out instead of front-loaded.
  const ordered: ScoredLine[] = [];
  const half = Math.ceil(picked.length / 2);
  for (let index = 0; index < half; index += 1) {
    ordered.push(picked[index]);
    const tail = picked[picked.length - 1 - index];
    if (tail && tail !== picked[index]) ordered.push(tail);
  }

  const languages = [...new Set(ordered.map((line) => line.language))];
  return {
    id: `drill-${wanted.join("")}`,
    language: languages.length === 1 ? languages[0] : "Mixed",
    filename: `drill-${wanted.map(labelChar).join("")}.txt`,
    code: ordered.map((line) => line.text).join("\n"),
    // Marked custom so drill runs stay out of history, personal bests, and the
    // leaderboard — weakness should be measured on real code, not on a drill
    // deliberately stacked with the characters you are worst at.
    sourceType: "custom",
  };
}

export const DRILL_PRESETS = [
  { id: "brackets", name: "Brackets & Scope", icon: "{ }", chars: ["{", "}", "(", ")", "[", "]", "<", ">"] },
  { id: "operators", name: "Operators & Math", icon: "+ =", chars: ["=", "+", "-", "*", "/", "%", "&", "|", "!", "?", ":"] },
  { id: "punctuation", name: "Punctuation & Quotes", icon: "; \"", chars: [";", ":", ",", ".", "'", '"', "`"] },
  { id: "numbers", name: "Digits & Numbers", icon: "1 2", chars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] },
] as const;

export function buildPresetDrill(presetId: string): Snippet | null {
  const preset = DRILL_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  const snippet = buildDrillSnippet([...preset.chars], DEFAULT_LINES);
  if (!snippet) return null;
  return {
    ...snippet,
    id: `drill-preset-${preset.id}`,
    filename: `drill-${preset.id}.txt`,
  };
}

function labelChar(char: string): string {
  const names: Record<string, string> = {
    " ": "space", "/": "slash", "\\": "backslash", ".": "dot", ":": "colon", ";": "semi",
    "*": "star", "?": "q", "<": "lt", ">": "gt", "|": "pipe", '"': "dq", "'": "sq",
  };
  return names[char] ?? char;
}
