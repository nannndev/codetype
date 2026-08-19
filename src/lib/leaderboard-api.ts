import type { CloudProfile, CloudRun, LeaderboardFilters } from "@/lib/cloud";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "");
const needsRemoteApi = typeof window !== "undefined"
  && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:");
const API_BASE_URL = configuredApiBase || (needsRemoteApi ? "https://codey-opal.vercel.app" : "");

interface LeaderboardResponse {
  runs: CloudRun[];
  profiles: CloudProfile[];
  error?: string;
}

interface CachedLeaderboard {
  expiresAt: number;
  value: { runs: CloudRun[]; profiles: Map<string, CloudProfile> };
}

const CACHE_TTL_MS = 30_000;
const leaderboardCache = new Map<string, CachedLeaderboard>();
const pendingRequests = new Map<string, Promise<{ runs: CloudRun[]; profiles: Map<string, CloudProfile> }>>();

function leaderboardUrl(filters: LeaderboardFilters): string {
  const params = new URLSearchParams();
  if (filters.language) params.set("language", filters.language);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.snippetLength) params.set("snippetLength", filters.snippetLength);
  if (filters.durationSeconds) params.set("durationSeconds", String(filters.durationSeconds));
  return `${API_BASE_URL}/api/leaderboard?${params.toString()}`;
}

export async function getLeaderboardView(filters: LeaderboardFilters): Promise<{ runs: CloudRun[]; profiles: Map<string, CloudProfile> }> {
  const url = leaderboardUrl(filters);
  const cached = leaderboardCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = pendingRequests.get(url);
  if (pending) return pending;

  const request = fetch(url)
    .then(async (response) => {
      const payload = await response.json() as LeaderboardResponse;
      if (!response.ok) throw new Error(payload.error || "Leaderboard data could not be loaded.");
      const value = {
        runs: payload.runs,
        profiles: new Map(payload.profiles.map((profile) => [profile.$id, profile])),
      };
      leaderboardCache.set(url, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    })
    .finally(() => pendingRequests.delete(url));

  pendingRequests.set(url, request);
  return request;
}
