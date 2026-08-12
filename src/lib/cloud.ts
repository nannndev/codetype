import { AppwriteException, Permission, Query, Role, type Models } from "appwrite";
import type { RunResult, TestMode } from "@/types";
import { appwriteConfig, databases } from "@/lib/appwrite";

const SYNCED_RUNS_KEY = "codetype_appwrite_synced_runs_v1";

export interface CloudProfile extends Models.Document {
  githubUsername?: string;
  displayName?: string;
  avatarUrl?: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate?: string;
}

export interface CloudRun extends Models.Document {
  userId: string;
  language: string;
  mode: TestMode;
  durationMs: number;
  durationSeconds?: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  keystrokes: number;
  mistakes: number;
  snippetsCompleted: number;
  sourceRepo?: string;
  verified: boolean;
}

function runKey(run: RunResult): string {
  return run.id ?? `${run.timestamp}-${run.language}-${run.mode}`;
}

function documentId(userId: string, run: RunResult): string {
  const value = `${userId}:${runKey(run)}`;
  let first = 2166136261;
  let second = 2246822519;
  for (let index = 0; index < value.length; index += 1) {
    first = Math.imul(first ^ value.charCodeAt(index), 16777619);
    second = Math.imul(second ^ value.charCodeAt(index), 3266489917);
  }
  return `run_${(first >>> 0).toString(36)}_${(second >>> 0).toString(36)}_${run.timestamp.toString(36)}`.slice(0, 36);
}

function getSyncedKeys(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SYNCED_RUNS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function markSynced(key: string): void {
  try {
    const keys = getSyncedKeys();
    keys.add(key);
    localStorage.setItem(SYNCED_RUNS_KEY, JSON.stringify(Array.from(keys).slice(-1000)));
  } catch {
    // Cloud data is already saved; this marker only avoids a redundant request.
  }
}

function runData(userId: string, run: RunResult): Record<string, unknown> {
  const data: Record<string, unknown> = {
    userId,
    language: run.language,
    mode: run.mode,
    durationMs: Math.max(0, Math.round(run.duration)),
    wpm: run.wpm,
    rawWpm: run.rawWpm,
    accuracy: run.accuracy,
    consistency: run.consistency,
    correctChars: run.totalCorrect,
    keystrokes: run.charsTyped,
    mistakes: run.totalErrors,
    snippetsCompleted: run.snippetsCompleted,
    verified: false,
  };
  if (run.mode === "timed") data.durationSeconds = Math.max(1, Math.round(run.duration / 1000));
  if (run.sourceRepo) data.sourceRepo = run.sourceRepo;
  return data;
}

export async function uploadRun(userId: string, run: RunResult): Promise<void> {
  if (!databases) return;
  const key = `${userId}:${runKey(run)}`;
  if (getSyncedKeys().has(key)) return;

  try {
    const owner = Role.user(userId);
    await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.runsCollectionId,
      documentId: documentId(userId, run),
      data: runData(userId, run),
      permissions: [Permission.read(Role.any()), Permission.update(owner), Permission.delete(owner)],
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 409) throw error;
  }
  markSynced(key);
}

export async function syncLocalRuns(userId: string, runs: RunResult[]): Promise<void> {
  for (const run of runs) await uploadRun(userId, run);
}

export async function getProfile(userId: string): Promise<CloudProfile | null> {
  if (!databases) return null;
  try {
    return await databases.getDocument<CloudProfile>({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.profilesCollectionId,
      documentId: userId,
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}

export async function listUserRuns(userId: string): Promise<CloudRun[]> {
  if (!databases) return [];
  const response = await databases.listDocuments<CloudRun>({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.runsCollectionId,
    queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(500)],
  });
  return response.documents;
}

export async function listLeaderboard(filters: {
  language?: string;
  mode?: TestMode;
  durationSeconds?: number;
} = {}): Promise<CloudRun[]> {
  if (!databases) return [];
  const queries = [Query.orderDesc("wpm"), Query.limit(100)];
  if (filters.language) queries.unshift(Query.equal("language", filters.language));
  if (filters.mode) queries.unshift(Query.equal("mode", filters.mode));
  if (filters.mode === "timed" && filters.durationSeconds) {
    queries.unshift(Query.equal("durationSeconds", filters.durationSeconds));
  }
  const response = await databases.listDocuments<CloudRun>({
    databaseId: appwriteConfig.databaseId,
    collectionId: appwriteConfig.runsCollectionId,
    queries,
  });
  return response.documents;
}

export async function listProfiles(userIds: string[]): Promise<Map<string, CloudProfile>> {
  if (!databases || userIds.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(userIds));
  const profiles = await Promise.all(uniqueIds.map((id) => getProfile(id)));
  return new Map(profiles.filter((profile): profile is CloudProfile => Boolean(profile)).map((profile) => [profile.$id, profile]));
}
