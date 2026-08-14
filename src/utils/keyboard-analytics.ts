import type { CloudRun } from "@/lib/cloud";

export interface KeyStat {
  key: string;
  totalPresses: number;
  errors: number;
  accuracy: number;
  totalDelayMs: number;
  avgDelayMs: number;
}

export type KeyboardStatsMap = Record<string, KeyStat>;

function getStorageKey(userId?: string | null): string {
  return userId ? `codey_keyboard_analytics_v1_${userId}` : "codey_keyboard_analytics_v1_guest";
}

export function getStoredKeyStats(userId?: string | null): KeyboardStatsMap {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? (JSON.parse(raw) as KeyboardStatsMap) : {};
  } catch {
    return {};
  }
}

export function saveKeyStats(stats: KeyboardStatsMap, userId?: string | null): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(stats));
  } catch {
    // LocalStorage quota or unavailable
  }
}

export function recordRunKeypressStats(params: {
  userId?: string | null;
  input: string;
  code: string;
  errorPositions: (number | { index: number })[];
  keyIntervals?: number[];
}): KeyboardStatsMap {
  const stats = getStoredKeyStats(params.userId);
  const errorSet = new Set(
    params.errorPositions.map((pos) => (typeof pos === "number" ? pos : pos.index))
  );

  for (let i = 0; i < params.input.length; i += 1) {
    const char = params.input[i]?.toUpperCase();
    if (!char) continue;

    const isError = errorSet.has(i);
    const delay = params.keyIntervals?.[i] ?? 120;

    const existing = stats[char] || {
      key: char,
      totalPresses: 0,
      errors: 0,
      accuracy: 100,
      totalDelayMs: 0,
      avgDelayMs: 120,
    };

    existing.totalPresses += 1;
    if (isError) existing.errors += 1;
    existing.totalDelayMs += delay;
    existing.avgDelayMs = Math.round(existing.totalDelayMs / existing.totalPresses);
    existing.accuracy = Number(
      (((existing.totalPresses - existing.errors) / existing.totalPresses) * 100).toFixed(1)
    );

    stats[char] = existing;
  }

  saveKeyStats(stats, params.userId);
  return stats;
}

export function computeKeyStatsFromCloudRuns(runs: CloudRun[], fallbackMap?: KeyboardStatsMap): KeyboardStatsMap {
  if (!runs.length) return fallbackMap || {};

  const map: KeyboardStatsMap = { ...(fallbackMap || {}) };

  // Combine cloud run accuracy metrics per language & format
  for (const run of runs) {
    const runAcc = run.accuracy;
    const estPresses = run.keystrokes || 100;
    const estErrors = run.mistakes || Math.round(estPresses * (1 - runAcc / 100));

    // Populate common key samples if detailed per-key log isn't present
    const sampleKeys = ["E", "T", "A", "O", "I", "N", "S", "H", "R", "D", "L", "C", "U", "M", "W", "F", "G", "Y", "P", "B", "V", "K", "J", "X", "Q", "Z", "{", "}", "(", ")", ";", "="];
    const perKeyWeight = Math.max(1, Math.floor(estPresses / sampleKeys.length));
    const perKeyErrors = Math.max(0, Math.floor(estErrors / sampleKeys.length));

    for (const key of sampleKeys) {
      const existing = map[key] || {
        key,
        totalPresses: 0,
        errors: 0,
        accuracy: 100,
        totalDelayMs: 0,
        avgDelayMs: 120,
      };

      existing.totalPresses += perKeyWeight;
      existing.errors += perKeyErrors;
      existing.accuracy = Number(
        (((existing.totalPresses - existing.errors) / existing.totalPresses) * 100).toFixed(1)
      );
      map[key] = existing;
    }
  }

  return map;
}

export function getWeakestKeys(stats: KeyboardStatsMap, limit = 5): KeyStat[] {
  return Object.values(stats)
    .filter((s) => s.totalPresses >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
