import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppwriteException, Permission, Role, type Models } from "appwrite";
import {
  account,
  appwriteConfig,
  databases,
  isAppwriteConfigured,
  signInWithGitHub,
  signOut as appwriteSignOut,
} from "@/lib/appwrite";
import { syncLocalRuns } from "@/lib/cloud";
import { ensureHistoryIds, getStreak } from "@/utils/storage";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  configured: boolean;
  syncStatus: SyncStatus;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function githubUsernameFromUser(user: Models.User<Models.Preferences>): string | undefined {
  const preferences = user.prefs as Record<string, unknown>;
  const preferenceUsername = preferences.githubUsername;
  if (typeof preferenceUsername === "string" && preferenceUsername.trim()) return preferenceUsername.trim();
  if (user.email.includes("@users.noreply.github.com")) return user.email.split("@")[0].replace(/^\d+\+/, "");
  return undefined;
}

async function ensureProfile(user: Models.User<Models.Preferences>): Promise<void> {
  if (!databases) return;

  try {
    await databases.getDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.profilesCollectionId,
      documentId: user.$id,
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) throw error;

    const owner = Role.user(user.$id);
    const streak = getStreak();
    await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.profilesCollectionId,
      documentId: user.$id,
      data: {
        githubUsername: githubUsernameFromUser(user),
        displayName: user.name || undefined,
        currentStreak: streak.current,
        bestStreak: streak.best,
        lastActiveDate: streak.lastDate ? new Date(`${streak.lastDate}T12:00:00`).toISOString() : undefined,
      },
      permissions: [
        Permission.read(Role.any()),
        Permission.update(owner),
        Permission.delete(owner),
      ],
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(isAppwriteConfigured);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const refresh = useCallback(async () => {
    if (!account) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await ensureProfile(currentUser);
      setSyncStatus("syncing");
      void syncLocalRuns(currentUser.$id, ensureHistoryIds())
        .then(() => setSyncStatus("synced"))
        .catch((syncError) => {
          console.error("Unable to sync local runs", syncError);
          setSyncStatus("error");
        });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        setUser(null);
      } else {
        console.error("Unable to load Appwrite session", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await appwriteSignOut();
    setUser(null);
    setSyncStatus("idle");
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isAppwriteConfigured,
    syncStatus,
    login: signInWithGitHub,
    logout,
  }), [user, loading, syncStatus, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
