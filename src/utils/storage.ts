import type { RunResult, TestMode, PersonalBest, Settings } from '../types';

const HISTORY_KEY = 'codetype_history';
const STREAK_KEY = 'codetype_streak';
const SETTINGS_KEY = 'codetype_settings';

export interface StreakData {
  current: number;
  best: number;
  lastDate: string;
}

const DEFAULT_SETTINGS: Settings = {
  version: 1,
  goals: { runsPerDay: 10, minutesPerDay: 15, charsPerDay: 2000 },
  achievements: [],
};

// History

export function getHistory(): RunResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResult(result: RunResult): void {
  const history = getHistory();
  history.push({
    ...result,
    id: result.id ?? `${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-500)));
}

export function ensureHistoryIds(): RunResult[] {
  const history = getHistory();
  let changed = false;
  const normalized = history.map((result, index) => {
    if (result.id) return result;
    changed = true;
    return { ...result, id: `${result.timestamp}-${index.toString(36)}` };
  });
  if (changed) localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getResults(): RunResult[] {
  return getHistory();
}

export function getResultsByMode(mode: TestMode): RunResult[] {
  return getHistory().filter((r) => r.mode === mode);
}

// Streak

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return { current: 0, best: 0, lastDate: '' };
}

export function updateStreak(): void {
  const streak = getStreak();
  const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayDate = new Date();
  const today = toLocalDateKey(todayDate);

  if (streak.lastDate === today) return;

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const yesterday = toLocalDateKey(yesterdayDate);
  if (streak.lastDate === yesterday) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }

  streak.lastDate = today;
  streak.best = Math.max(streak.best, streak.current);
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

// Versioned Settings

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.version === 'number') return parsed as Settings;
  } catch {
    // fall through
  }
  const migrated = { ...DEFAULT_SETTINGS };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable
  }
}

// Personal Bests

export function getPersonalBests(): PersonalBest[] {
  const history = getHistory();
  const map = new Map<string, PersonalBest>();

  for (const run of history) {
    const key = `${run.language}|${run.mode}|${run.duration ?? 0}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        language: run.language,
        mode: run.mode,
        duration: run.duration ?? null,
        bestWpm: run.wpm,
        bestAccuracy: run.accuracy,
        bestConsistency: run.consistency,
        lastRunAt: run.timestamp,
        totalRuns: 1,
      });
    } else {
      existing.bestWpm = Math.max(existing.bestWpm, run.wpm);
      existing.bestAccuracy = Math.max(existing.bestAccuracy, run.accuracy);
      existing.bestConsistency = Math.max(existing.bestConsistency, run.consistency);
      existing.lastRunAt = Math.max(existing.lastRunAt, run.timestamp);
      existing.totalRuns += 1;
    }
  }

  return Array.from(map.values());
}

export function getPersonalBest(
  language: string,
  mode: TestMode,
  duration: number | null,
): PersonalBest | null {
  const key = `${language}|${mode}|${duration ?? 0}`;
  const all = getPersonalBests();
  return all.find((pb) => {
    const pbKey = `${pb.language}|${pb.mode}|${pb.duration ?? 0}`;
    return pbKey === key;
  }) ?? null;
}
