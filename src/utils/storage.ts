import type { RunResult, TestMode } from '../types';

const HISTORY_KEY = 'codetype_history';
const STREAK_KEY = 'codetype_streak';

export interface StreakData {
  current: number;
  best: number;
  lastDate: string;
}

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

export function getResults(): RunResult[] {
  return getHistory();
}

export function getResultsByMode(mode: TestMode): RunResult[] {
  return getHistory().filter((r) => r.mode === mode);
}

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
