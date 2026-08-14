export type DivisionTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Legend';

export interface DivisionInfo {
  tier: DivisionTier;
  subRank: string; // e.g. "Gold II"
  codeIndex: number;
  elo: number; // Backward-compatible alias for codeIndex
  minScore: number;
  maxScore: number;
  nextTier: DivisionTier | null;
  progressPercent: number;
  color: string;
  gradientClass: string;
  badgeIcon: string;
}

export const DIVISIONS: Record<DivisionTier, { minScore: number; maxScore: number; color: string; gradientClass: string; badgeIcon: string }> = {
  Bronze: {
    minScore: 0,
    maxScore: 799,
    color: '#cd7f32',
    gradientClass: 'from-amber-700 via-amber-600 to-amber-800 text-amber-100 border-amber-600/50 shadow-amber-900/30',
    badgeIcon: '🥉',
  },
  Silver: {
    minScore: 800,
    maxScore: 1199,
    color: '#c0c0c0',
    gradientClass: 'from-slate-400 via-slate-300 to-slate-500 text-slate-950 border-slate-300/50 shadow-slate-500/30',
    badgeIcon: '🥈',
  },
  Gold: {
    minScore: 1200,
    maxScore: 1599,
    color: '#ffd700',
    gradientClass: 'from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 border-amber-300/60 shadow-amber-500/40',
    badgeIcon: '👑',
  },
  Platinum: {
    minScore: 1600,
    maxScore: 1999,
    color: '#38bdf8',
    gradientClass: 'from-sky-400 via-cyan-400 to-blue-500 text-zinc-950 border-cyan-300/60 shadow-cyan-500/40',
    badgeIcon: '🛡️',
  },
  Diamond: {
    minScore: 2000,
    maxScore: 2499,
    color: '#a855f7',
    gradientClass: 'from-purple-400 via-fuchsia-400 to-indigo-500 text-zinc-950 border-purple-300/60 shadow-purple-500/40',
    badgeIcon: '💎',
  },
  Legend: {
    minScore: 2500,
    maxScore: 9999,
    color: '#ef4444',
    gradientClass: 'from-red-500 via-rose-500 to-amber-500 text-zinc-950 border-rose-400/70 shadow-rose-500/50 animate-pulse',
    badgeIcon: '🔥',
  },
};

/**
 * Calculates Code Index rating from user's best WPM & average accuracy.
 * Formula: Code Index = (wpm * 16) + (accuracy * 5)
 */
export function calculateCodeIndex(bestWpm: number, avgAccuracy: number): number {
  if (!bestWpm || bestWpm <= 0) return 0;
  const wpmPoints = Math.round(bestWpm * 16);
  const accPoints = Math.round(Math.max(0, avgAccuracy) * 5);
  return Math.max(0, wpmPoints + accPoints);
}

// Alias for backward-compatibility
export const calculateElo = calculateCodeIndex;

export function getDivisionInfo(codeIndex: number): DivisionInfo {
  let tier: DivisionTier = 'Bronze';
  let nextTier: DivisionTier | null = 'Silver';

  if (codeIndex >= 2500) {
    tier = 'Legend';
    nextTier = null;
  } else if (codeIndex >= 2000) {
    tier = 'Diamond';
    nextTier = 'Legend';
  } else if (codeIndex >= 1600) {
    tier = 'Platinum';
    nextTier = 'Diamond';
  } else if (codeIndex >= 1200) {
    tier = 'Gold';
    nextTier = 'Platinum';
  } else if (codeIndex >= 800) {
    tier = 'Silver';
    nextTier = 'Gold';
  }

  const spec = DIVISIONS[tier];
  const range = spec.maxScore - spec.minScore;
  const currentInRange = Math.max(0, codeIndex - spec.minScore);
  const progressPercent = nextTier ? Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100))) : 100;

  // Calculate Sub-Division (e.g. Gold III, Gold II, Gold I)
  let subIndex = "I";
  if (nextTier) {
    const third = range / 3;
    if (currentInRange < third) subIndex = "III";
    else if (currentInRange < third * 2) subIndex = "II";
    else subIndex = "I";
  }

  return {
    tier,
    subRank: `${tier} ${subIndex}`,
    codeIndex,
    elo: codeIndex,
    minScore: spec.minScore,
    maxScore: spec.maxScore,
    nextTier,
    progressPercent,
    color: spec.color,
    gradientClass: spec.gradientClass,
    badgeIcon: spec.badgeIcon,
  };
}
