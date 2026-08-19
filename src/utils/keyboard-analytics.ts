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

export interface PendingKeyboardStats {
  batchId: string;
  includesMigration?: boolean;
  stats: KeyboardStatsMap;
}

export interface PhysicalKeypress {
  key: string;
  delayMs: number;
  isError?: boolean;
}

/** Maps keys to finger assignments */
export type FingerZone =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumbs"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

export const FINGER_MAP: Record<string, { finger: FingerZone; name: string; color: string }> = {
  // Row 1
  "`": { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  "1": { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  "2": { finger: "left-ring", name: "Left Ring", color: "#a855f7" },
  "3": { finger: "left-middle", name: "Left Middle", color: "#3b82f6" },
  "4": { finger: "left-index", name: "Left Index", color: "#10b981" },
  "5": { finger: "left-index", name: "Left Index", color: "#10b981" },
  "6": { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  "7": { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  "8": { finger: "right-middle", name: "Right Middle", color: "#eab308" },
  "9": { finger: "right-ring", name: "Right Ring", color: "#f97316" },
  "0": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "-": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "=": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },

  // Row 2
  Q: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  W: { finger: "left-ring", name: "Left Ring", color: "#a855f7" },
  E: { finger: "left-middle", name: "Left Middle", color: "#3b82f6" },
  R: { finger: "left-index", name: "Left Index", color: "#10b981" },
  T: { finger: "left-index", name: "Left Index", color: "#10b981" },
  Y: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  U: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  I: { finger: "right-middle", name: "Right Middle", color: "#eab308" },
  O: { finger: "right-ring", name: "Right Ring", color: "#f97316" },
  P: { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "[": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "]": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "\\": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },

  // Row 3
  A: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  S: { finger: "left-ring", name: "Left Ring", color: "#a855f7" },
  D: { finger: "left-middle", name: "Left Middle", color: "#3b82f6" },
  F: { finger: "left-index", name: "Left Index", color: "#10b981" },
  G: { finger: "left-index", name: "Left Index", color: "#10b981" },
  H: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  J: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  K: { finger: "right-middle", name: "Right Middle", color: "#eab308" },
  L: { finger: "right-ring", name: "Right Ring", color: "#f97316" },
  ";": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  "'": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },

  // Row 4
  Z: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  X: { finger: "left-ring", name: "Left Ring", color: "#a855f7" },
  C: { finger: "left-middle", name: "Left Middle", color: "#3b82f6" },
  V: { finger: "left-index", name: "Left Index", color: "#10b981" },
  B: { finger: "left-index", name: "Left Index", color: "#10b981" },
  N: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  M: { finger: "right-index", name: "Right Index", color: "#06b6d4" },
  ",": { finger: "right-middle", name: "Right Middle", color: "#eab308" },
  ".": { finger: "right-ring", name: "Right Ring", color: "#f97316" },
  "/": { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },

  // Special keys
  SPACE: { finger: "thumbs", name: "Thumbs", color: "#8b5cf6" },
  ENTER: { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  TAB: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  BACKSPACE: { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  CAPS: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  SHIFT_L: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  SHIFT_R: { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  CTRL_L: { finger: "left-pinky", name: "Left Pinky", color: "#ec4899" },
  CTRL_R: { finger: "right-pinky", name: "Right Pinky", color: "#ef4444" },
  ALT_L: { finger: "thumbs", name: "Left Thumb", color: "#8b5cf6" },
  ALT_R: { finger: "thumbs", name: "Right Thumb", color: "#8b5cf6" },
};

const PHYSICAL_KEY_IDS: Record<string, string> = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Space: "SPACE",
  Enter: "ENTER",
  NumpadEnter: "ENTER",
  Tab: "TAB",
  Backspace: "BACKSPACE",
  CapsLock: "CAPS",
  ShiftLeft: "SHIFT_L",
  ShiftRight: "SHIFT_R",
  ControlLeft: "CTRL_L",
  ControlRight: "CTRL_R",
  AltLeft: "ALT_L",
  AltRight: "ALT_R",
};

/** Converts KeyboardEvent.code into the physical key IDs rendered by the heatmap. */
export function normalizePhysicalKey(code: string, key = "", location = 0): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (PHYSICAL_KEY_IDS[code]) return PHYSICAL_KEY_IDS[code];

  const side = location === 2 ? "R" : "L";
  if (key === "Shift") return `SHIFT_${side}`;
  if (key === "Control") return `CTRL_${side}`;
  if (key === "Alt" || key === "AltGraph") return `ALT_${side}`;
  return null;
}

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

export function mergeStatsMaps(...maps: KeyboardStatsMap[]): KeyboardStatsMap {
  const merged: KeyboardStatsMap = {};
  for (const map of maps) {
    for (const stat of Object.values(map)) {
      const current = merged[stat.key] || {
        key: stat.key,
        totalPresses: 0,
        errors: 0,
        accuracy: 100,
        totalDelayMs: 0,
        avgDelayMs: 0,
      };
      current.totalPresses += stat.totalPresses;
      current.errors += stat.errors;
      current.totalDelayMs += stat.totalDelayMs;
      current.avgDelayMs = current.totalPresses > 0
        ? Math.round(current.totalDelayMs / current.totalPresses)
        : 0;
      current.accuracy = current.totalPresses > 0
        ? Number((((current.totalPresses - current.errors) / current.totalPresses) * 100).toFixed(1))
        : 100;
      merged[stat.key] = current;
    }
  }
  return merged;
}

/** Includes analytics captured before sign-in without duplicating them into account storage. */
export function getVisibleKeyStats(userId?: string | null): KeyboardStatsMap {
  const guestStats = getStoredKeyStats();
  if (!userId) return guestStats;
  return mergeStatsMaps(guestStats, getStoredKeyStats(userId));
}

function pendingStorageKey(userId?: string | null): string {
  return `codey_keyboard_pending_v1_${userId || "guest"}`;
}

function migrationStorageKey(userId: string): string {
  return `codey_keyboard_cloud_migrated_v1_${userId}`;
}

function createBatchId(): string {
  return `kb_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function getPendingKeyboardStats(userId?: string | null): PendingKeyboardStats | null {
  try {
    const raw = localStorage.getItem(pendingStorageKey(userId));
    return raw ? JSON.parse(raw) as PendingKeyboardStats : null;
  } catch {
    return null;
  }
}

function savePendingKeyboardStats(pending: PendingKeyboardStats, userId?: string | null): void {
  try {
    localStorage.setItem(pendingStorageKey(userId), JSON.stringify(pending));
  } catch {
    // Local analytics remain available even if the sync queue cannot be persisted.
  }
}

export function clearPendingKeyboardStats(userId?: string | null): void {
  try {
    localStorage.removeItem(pendingStorageKey(userId));
  } catch {
    // A later sync can safely retry the idempotent batch.
  }
}

export function replacePendingKeyboardStats(stats: KeyboardStatsMap, userId?: string | null): void {
  if (Object.keys(stats).length === 0) {
    clearPendingKeyboardStats(userId);
    return;
  }
  savePendingKeyboardStats({ batchId: createBatchId(), stats }, userId);
}

export function markKeyboardMigrationComplete(userId: string): void {
  try {
    localStorage.setItem(migrationStorageKey(userId), "1");
  } catch {
    // The server batch ID still protects retries from duplicate aggregation.
  }
}

export function prepareKeyboardStatsMigration(userId: string): void {
  try {
    if (localStorage.getItem(migrationStorageKey(userId)) === "1") return;
    const existingPending = getPendingKeyboardStats(userId);
    if (existingPending?.includesMigration) return;
    const snapshot = getVisibleKeyStats(userId);
    if (Object.keys(snapshot).length === 0) {
      markKeyboardMigrationComplete(userId);
      return;
    }
    savePendingKeyboardStats({
      batchId: existingPending?.batchId || createBatchId(),
      includesMigration: true,
      stats: snapshot,
    }, userId);
  } catch {
    // Migration retries the next time the authenticated app starts.
  }
}

function queuePendingStats(stats: KeyboardStatsMap, userId?: string | null): void {
  const pending = getPendingKeyboardStats(userId);
  savePendingKeyboardStats({
    batchId: pending?.batchId || createBatchId(),
    includesMigration: pending?.includesMigration,
    stats: mergeStatsMaps(pending?.stats || {}, stats),
  }, userId);
}

export function saveKeyStats(stats: KeyboardStatsMap, userId?: string | null): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(stats));
  } catch {
    // LocalStorage quota or unavailable
  }
}

export function recordPhysicalKeypressStats(
  keypresses: PhysicalKeypress[],
  userId?: string | null,
): KeyboardStatsMap {
  const stats = getStoredKeyStats(userId);
  const delta: KeyboardStatsMap = {};

  for (const keypress of keypresses) {
    const existing = stats[keypress.key] || {
      key: keypress.key,
      totalPresses: 0,
      errors: 0,
      accuracy: 100,
      totalDelayMs: 0,
      avgDelayMs: 0,
    };

    existing.totalPresses += 1;
    if (keypress.isError) existing.errors += 1;
    existing.totalDelayMs += Math.max(0, Math.round(keypress.delayMs));
    existing.avgDelayMs = Math.round(existing.totalDelayMs / existing.totalPresses);
    existing.accuracy = Number(
      (((existing.totalPresses - existing.errors) / existing.totalPresses) * 100).toFixed(1)
    );
    stats[keypress.key] = existing;
    const pending = delta[keypress.key] || {
      key: keypress.key,
      totalPresses: 0,
      errors: 0,
      accuracy: 100,
      totalDelayMs: 0,
      avgDelayMs: 0,
    };
    pending.totalPresses += 1;
    if (keypress.isError) pending.errors += 1;
    pending.totalDelayMs += Math.max(0, Math.round(keypress.delayMs));
    pending.avgDelayMs = Math.round(pending.totalDelayMs / pending.totalPresses);
    pending.accuracy = Number((((pending.totalPresses - pending.errors) / pending.totalPresses) * 100).toFixed(1));
    delta[keypress.key] = pending;
  }

  saveKeyStats(stats, userId);
  queuePendingStats(delta, userId);
  return stats;
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
    const rawChar = params.input[i];
    if (!rawChar) continue;

    const charKey = rawChar === " " ? "SPACE" : rawChar === "\n" ? "ENTER" : rawChar === "\t" ? "TAB" : rawChar.toUpperCase();
    const isError = errorSet.has(i);
    const delay = params.keyIntervals?.[i] ?? 110;

    const existing = stats[charKey] || {
      key: charKey,
      totalPresses: 0,
      errors: 0,
      accuracy: 100,
      totalDelayMs: 0,
      avgDelayMs: 110,
    };

    existing.totalPresses += 1;
    if (isError) existing.errors += 1;
    existing.totalDelayMs += delay;
    existing.avgDelayMs = Math.round(existing.totalDelayMs / existing.totalPresses);
    existing.accuracy = Number(
      (((existing.totalPresses - existing.errors) / existing.totalPresses) * 100).toFixed(1)
    );

    stats[charKey] = existing;
  }

  saveKeyStats(stats, params.userId);
  return stats;
}

export function computeKeyStatsFromCloudRuns(runs: CloudRun[], fallbackMap?: KeyboardStatsMap): KeyboardStatsMap {
  if (!runs.length) return fallbackMap || {};
  return fallbackMap || {};
}

export function getWeakestKeys(stats: KeyboardStatsMap, limit = 5): KeyStat[] {
  return Object.values(stats)
    .filter((s) => s.totalPresses >= 2)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
