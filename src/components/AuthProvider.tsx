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

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  configured: boolean;
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
    await databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.profilesCollectionId,
      documentId: user.$id,
      data: {
        githubUsername: githubUsernameFromUser(user),
        displayName: user.name || undefined,
        currentStreak: 0,
        bestStreak: 0,
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

  const refresh = useCallback(async () => {
    if (!account) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await ensureProfile(currentUser);
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
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isAppwriteConfigured,
    login: signInWithGitHub,
    logout,
  }), [user, loading, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
