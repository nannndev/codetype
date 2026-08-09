import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "sm" | "md" | "lg";
export type FontFamily = "jetbrains" | "fira" | "cascadia" | "source";
export type CursorStyle = "block" | "underline" | "line";

export interface Preferences {
  fontSize: FontSize;
  fontFamily: FontFamily;
  cursorStyle: CursorStyle;
}

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const STORAGE_KEY = "codetype-preferences";

const DEFAULTS: Preferences = {
  fontSize: "md",
  fontFamily: "jetbrains",
  cursorStyle: "block",
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: "0.8125rem",
  md: "0.875rem",
  lg: "1rem",
};

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  cascadia: '"Cascadia Code", monospace',
  source: '"Source Code Pro", monospace',
};

function applyPreferences(prefs: Preferences) {
  document.documentElement.style.setProperty("--code-font-size", FONT_SIZE_MAP[prefs.fontSize]);
  document.documentElement.style.setProperty("--code-font-family", FONT_FAMILY_MAP[prefs.fontFamily]);
  document.documentElement.style.setProperty("--code-cursor-style", prefs.cursorStyle);
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // fall through
  }
  return DEFAULTS;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
