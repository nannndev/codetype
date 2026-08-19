import { account } from "@/lib/appwrite";
import {
  clearPendingKeyboardStats,
  getPendingKeyboardStats,
  markKeyboardMigrationComplete,
  replacePendingKeyboardStats,
  type KeyboardStatsMap,
} from "@/utils/keyboard-analytics";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");
const needsRemoteApi = typeof window !== "undefined"
  && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:");
const API_BASE_URL = configuredApiBase || (needsRemoteApi ? "https://codey-opal.vercel.app" : "");
const syncTimers = new Map<string, number>();
const inFlightSyncs = new Map<string, Promise<boolean>>();

function remainingStats(current: KeyboardStatsMap, sent: KeyboardStatsMap): KeyboardStatsMap {
  const remaining: KeyboardStatsMap = {};
  for (const [key, stat] of Object.entries(current)) {
    const sentStat = sent[key];
    const totalPresses = Math.max(0, stat.totalPresses - (sentStat?.totalPresses || 0));
    if (totalPresses === 0) continue;
    const errors = Math.max(0, stat.errors - (sentStat?.errors || 0));
    const totalDelayMs = Math.max(0, stat.totalDelayMs - (sentStat?.totalDelayMs || 0));
    remaining[key] = {
      key,
      totalPresses,
      errors,
      totalDelayMs,
      avgDelayMs: Math.round(totalDelayMs / totalPresses),
      accuracy: Number((((totalPresses - errors) / totalPresses) * 100).toFixed(1)),
    };
  }
  return remaining;
}

async function jwt(): Promise<string | null> {
  if (!account) return null;
  try {
    return (await account.createJWT()).jwt;
  } catch {
    return null;
  }
}

export async function getCloudKeyboardStats(): Promise<KeyboardStatsMap | null> {
  const token = await jwt();
  if (!token) return null;
  const response = await fetch(`${API_BASE_URL}/api/keyboard-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const payload = await response.json() as { stats?: KeyboardStatsMap };
  return payload.stats || {};
}

export function syncKeyboardStatsNow(userId: string): Promise<boolean> {
  const existing = inFlightSyncs.get(userId);
  if (existing) return existing;

  const sync = (async () => {
    const pending = getPendingKeyboardStats(userId);
    if (!pending || Object.keys(pending.stats).length === 0) return true;
    const token = await jwt();
    if (!token) return false;
    const response = await fetch(`${API_BASE_URL}/api/keyboard-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ batchId: pending.batchId, stats: pending.stats }),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error("Unable to sync keyboard stats", response.status, message);
      return false;
    }

    // Only clear the exact batch that was acknowledged; new keypresses may have
    // opened another batch while this request was in flight.
    const currentPending = getPendingKeyboardStats(userId);
    if (currentPending?.batchId === pending.batchId) {
      replacePendingKeyboardStats(remainingStats(currentPending.stats, pending.stats), userId);
      if (pending.includesMigration) {
        clearPendingKeyboardStats();
        markKeyboardMigrationComplete(userId);
      }
    }
    return true;
  })().finally(() => inFlightSyncs.delete(userId));

  inFlightSyncs.set(userId, sync);
  return sync;
}

export function scheduleKeyboardStatsSync(userId: string, delayMs = 10_000): void {
  const existingTimer = syncTimers.get(userId);
  if (existingTimer !== undefined) window.clearTimeout(existingTimer);
  syncTimers.set(userId, window.setTimeout(() => {
    syncTimers.delete(userId);
    void syncKeyboardStatsNow(userId);
  }, delayMs));
}
