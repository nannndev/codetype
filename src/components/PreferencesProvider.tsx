import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "12" | "14" | "16" | "18" | "20" | "22" | "24";
export type FontFamily = "jetbrains" | "fira" | "cascadia" | "source";
export type CursorStyle = "block" | "underline" | "line";
export type SnippetLength = "short" | "medium" | "long";
export type EditorTheme = "codey" | "tokyo" | "catppuccin" | "github" | "dracula";

export interface Preferences {
  fontSize: FontSize;
  fontFamily: FontFamily;
  cursorStyle: CursorStyle;
  snippetLength: SnippetLength;
  editorTheme: EditorTheme;
}

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Keep the pre-rename key so existing Codey preferences survive the rename.
const STORAGE_KEY = "codetype-preferences";

const DEFAULTS: Preferences = {
  fontSize: "16",
  fontFamily: "jetbrains",
  cursorStyle: "block",
  snippetLength: "medium",
  editorTheme: "codey",
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  "12": "12px",
  "14": "14px",
  "16": "16px",
  "18": "18px",
  "20": "20px",
  "22": "22px",
  "24": "24px",
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
  document.documentElement.dataset.editorTheme = prefs.editorTheme;
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const migratedFontSize = parsed.fontSize === "sm" ? "12" : parsed.fontSize === "md" ? "14" : parsed.fontSize === "lg" ? "16" : parsed.fontSize;
      return { ...DEFAULTS, ...parsed, fontSize: migratedFontSize ?? DEFAULTS.fontSize };
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
