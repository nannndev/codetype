import { SNIPPETS } from "@/data/snippets";
import type { RunResult } from "@/types";

export interface ConfusionPair {
  typed: string;
  count: number;
}

export interface WeakKey {
  /** The character the user was supposed to type. */
  char: string;
  errors: number;
  /** Estimated times this character was faced across the analysed runs. */
  exposure: number;
  /** Smoothed error rate in [0, 1]. The ranking signal. */
  rate: number;
  /** What the user actually pressed instead, most frequent first. */
  confusions: ConfusionPair[];
}

export interface WeakKeyReport {
  keys: WeakKey[];
  runsAnalysed: number;
  totalErrors: number;
  /** False when there is too little data to rank anything honestly. */
  hasEnoughData: boolean;
}

/** Runs older than this are ignored — old habits are not current weaknesses. */
const MAX_RUNS = 60;
/** Below this, per-character rates are noise rather than signal. */
const MIN_ERRORS = 12;
/**
 * Additive smoothing constant for the error rate. Rare characters get thin
 * exposure estimates, and `errors / exposure` on a tiny denominator explodes —
 * one slip on a character seen twice would outrank a real habitual error.
 * Adding this to the denominator pulls low-evidence characters toward zero and
 * lets evidence, not luck, decide the ranking.
 */
const SMOOTHING = 30;
/** Ignore one-off slips entirely; they are typos, not weaknesses. */
const MIN_CHAR_ERRORS = 3;

let frequencyCache: Map<string, number> | null = null;

/**
 * Character distribution of the bundled corpus, used to estimate how often a
 * character was faced. RunResult stores only `charsTyped`, not the text typed,
 * so exposure cannot be counted exactly — but ranking by raw error count would
 * just surface whatever is most common (space, `e`, `t`) instead of what the
 * user is actually bad at, so an estimated rate beats an exact miscount.
 */
function corpusFrequency(): Map<string, number> {
  if (frequencyCache) return frequencyCache;

  const counts = new Map<string, number>();
  let total = 0;
  for (const snippet of SNIPPETS) {
    for (const char of snippet.code) {
      if (char === "\n" || char === "\r") continue;
      counts.set(char, (counts.get(char) ?? 0) + 1);
      total += 1;
    }
  }

  const frequency = new Map<string, number>();
  if (total > 0) for (const [char, count] of counts) frequency.set(char, count / total);
  frequencyCache = frequency;
  return frequency;
}

function isRankable(char: string): boolean {
  // Newlines and tabs are structural, not keys the user chooses to press, and
  // "" shows up when the user typed past the end of a snippet.
  return char.length === 1 && char !== "\n" && char !== "\r" && char !== "\t";
}

export function analyseWeakKeys(history: RunResult[]): WeakKeyReport {
  const runs = history.slice(-MAX_RUNS);
  const frequency = corpusFrequency();

  const errorCounts = new Map<string, number>();
  const exposures = new Map<string, number>();
  const confusions = new Map<string, Map<string, number>>();
  let totalErrors = 0;

  runs.forEach((run) => {
    for (const error of run.errorPositions ?? []) {
      if (!isRankable(error.expected)) continue;
      errorCounts.set(error.expected, (errorCounts.get(error.expected) ?? 0) + 1);
      totalErrors += 1;

      if (isRankable(error.typed)) {
        const forChar = confusions.get(error.expected) ?? new Map<string, number>();
        forChar.set(error.typed, (forChar.get(error.typed) ?? 0) + 1);
        confusions.set(error.expected, forChar);
      }
    }

    // Spread this run's keystrokes over the corpus distribution to approximate
    // how many times each character came up.
    const typed = run.charsTyped ?? 0;
    if (typed <= 0) return;
    for (const [char, share] of frequency) {
      exposures.set(char, (exposures.get(char) ?? 0) + share * typed);
    }
  });

  const keys: WeakKey[] = [];
  for (const [char, errors] of errorCounts) {
    if (errors < MIN_CHAR_ERRORS) continue;
    const exposure = exposures.get(char) ?? 0;
    // Smoothed so every character shares one comparable scale — a hard cutoff
    // would bucket rare characters separately and push them below common ones,
    // which is exactly the bias rate-ranking exists to remove.
    keys.push({
      char,
      errors,
      exposure,
      rate: Math.min(1, errors / (exposure + SMOOTHING)),
      confusions: rankConfusions(confusions.get(char)),
    });
  }

  keys.sort((a, b) => (b.rate !== a.rate ? b.rate - a.rate : b.errors - a.errors));

  return {
    keys,
    runsAnalysed: runs.length,
    totalErrors,
    hasEnoughData: totalErrors >= MIN_ERRORS,
  };
}

function rankConfusions(counts: Map<string, number> | undefined): ConfusionPair[] {
  if (!counts) return [];
  return [...counts.entries()]
    .map(([typed, count]) => ({ typed, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/** Human-readable name for characters that are invisible or ambiguous on screen. */
export function describeChar(char: string): string {
  if (char === " ") return "space";
  if (char === "\n") return "newline";
  if (char === "\t") return "tab";
  return char;
}
