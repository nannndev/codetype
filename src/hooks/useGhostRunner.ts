import { useMemo } from 'react';
import { getBestRunForGhost } from '@/utils';
import type { TestMode, SnippetLength, GameStatus, GhostRunnerState, RunResult } from '@/types';

interface UseGhostRunnerOptions {
  enabled: boolean;
  snippetId?: string;
  snippetCodeLength: number;
  language: string;
  mode: TestMode;
  duration: number | null;
  snippetLength?: SnippetLength;
  status: GameStatus;
  elapsedMs: number;
  userWpm: number;
  userInputLength: number;
}

interface UseGhostRunnerReturn extends GhostRunnerState {
  bestRun: RunResult | null;
}

export function useGhostRunner({
  enabled,
  snippetId,
  snippetCodeLength,
  language,
  mode,
  duration,
  snippetLength,
  status,
  elapsedMs,
  userWpm,
  userInputLength,
}: UseGhostRunnerOptions): UseGhostRunnerReturn {
  const bestRun = useMemo(() => {
    if (!enabled) return null;
    return getBestRunForGhost(snippetId, language, mode, duration, snippetLength);
  }, [enabled, snippetId, language, mode, duration, snippetLength, status]);

  return useMemo(() => {
    if (!enabled || !bestRun || bestRun.wpm <= 0) {
      return {
        hasPb: false,
        targetWpm: 0,
        ghostCharIndex: -1,
        deltaWpm: 0,
        deltaChars: 0,
        bestRun: null,
      };
    }

    const targetWpm = bestRun.wpm;

    if (status === 'idle') {
      return {
        hasPb: true,
        targetWpm,
        ghostCharIndex: 0,
        deltaWpm: 0,
        deltaChars: 0,
        bestRun,
      };
    }

    let ghostCharIndex = 0;

    // Use progressSnapshots ONLY if it's from the exact same snippet (same snippetId or code length)
    const isSameSnippet = bestRun.snippetId === snippetId || bestRun.targetChars === snippetCodeLength;
    if (isSameSnippet && bestRun.progressSnapshots && bestRun.progressSnapshots.length > 0) {
      const snapshots = bestRun.progressSnapshots;
      if (elapsedMs <= snapshots[0].ms) {
        ghostCharIndex = (elapsedMs / snapshots[0].ms) * snapshots[0].charIndex;
      } else if (elapsedMs >= snapshots[snapshots.length - 1].ms) {
        ghostCharIndex = snapshots[snapshots.length - 1].charIndex;
      } else {
        for (let i = 0; i < snapshots.length - 1; i++) {
          const current = snapshots[i];
          const next = snapshots[i + 1];
          if (elapsedMs >= current.ms && elapsedMs <= next.ms) {
            const ratio = (elapsedMs - current.ms) / (next.ms - current.ms);
            ghostCharIndex = current.charIndex + ratio * (next.charIndex - current.charIndex);
            break;
          }
        }
      }
    } else {
      // Fallback linear calculation: 1 WPM = 5 chars per minute = 5/60000 chars per ms
      const charsPerMs = (targetWpm * 5) / 60000;
      ghostCharIndex = Math.floor(elapsedMs * charsPerMs);
    }

    // Clamp ghostCharIndex between 0 and snippetCodeLength
    ghostCharIndex = Math.min(snippetCodeLength, Math.max(0, Math.round(ghostCharIndex)));
    const deltaWpm = Math.round((userWpm - targetWpm) * 10) / 10;
    const deltaChars = userInputLength - ghostCharIndex;

    return {
      hasPb: true,
      targetWpm,
      ghostCharIndex,
      deltaWpm,
      deltaChars,
      bestRun,
    };
  }, [enabled, bestRun, status, elapsedMs, userWpm, userInputLength, snippetCodeLength, snippetId]);
}
