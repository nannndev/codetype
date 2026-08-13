export {
  computeCharStates,
  computeAccuracy,
  computeWpm,
  computeRawWpm,
  computeConsistency,
  computePerLineStats,
  computeErrorMap,
} from './scoring';
export {
  getHistory,
  saveResult,
  getResults,
  getResultsByMode,
  getStreak,
  updateStreak,
  getSettings,
  saveSettings,
  getDailyGoalProgress,
  toLocalDateKey,
  getPersonalBests,
  getPersonalBest,
} from './storage';
