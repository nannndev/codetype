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

export async function getLeaderboardView(filters: LeaderboardFilters): Promise<{ runs: CloudRun[]; profiles: Map<string, CloudProfile> }> {
  const params = new URLSearchParams();
  if (filters.language) params.set("language", filters.language);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.snippetLength) params.set("snippetLength", filters.snippetLength);
  if (filters.durationSeconds) params.set("durationSeconds", String(filters.durationSeconds));

  const response = await fetch(`${API_BASE_URL}/api/leaderboard?${params.toString()}`);
  const payload = await response.json() as LeaderboardResponse;
  if (!response.ok) throw new Error(payload.error || "Leaderboard data could not be loaded.");
  return {
    runs: payload.runs,
    profiles: new Map(payload.profiles.map((profile) => [profile.$id, profile])),
  };
}
