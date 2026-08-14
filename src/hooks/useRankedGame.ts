import { useState, useCallback, useRef } from "react";
import { requestRankedChallenge, submitRankedRun, type RankedChallenge, type RankedResult } from "@/lib/ranked";
import type { SnippetLength, TestMode } from "@/types";

export type RankedStatus = "idle" | "requesting_challenge" | "ready" | "submitting" | "verified" | "rejected";

export function useRankedGame() {
  const [isRanked, setIsRanked] = useState(false);
  const [rankedStatus, setRankedStatus] = useState<RankedStatus>("idle");
  const [challenge, setChallenge] = useState<RankedChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<RankedResult | null>(null);

  const keyTimesRef = useRef<number[]>([]);
  const lastKeyTimeRef = useRef<number | null>(null);

  const recordKeypress = useCallback(() => {
    const now = performance.now();
    if (lastKeyTimeRef.current !== null) {
      const interval = Math.max(1, Math.round(now - lastKeyTimeRef.current));
      keyTimesRef.current.push(interval);
    }
    lastKeyTimeRef.current = now;
  }, []);

  const resetKeypressData = useCallback(() => {
    keyTimesRef.current = [];
    lastKeyTimeRef.current = null;
  }, []);

  const fetchChallenge = useCallback(async (params: {
    language: string;
    mode: TestMode;
    snippetLength?: SnippetLength;
    durationSeconds?: number;
  }) => {
    setRankedStatus("requesting_challenge");
    setError(null);
    setVerifiedResult(null);
    resetKeypressData();

    try {
      const nextChallenge = await requestRankedChallenge(params);
      setChallenge(nextChallenge);
      setIsRanked(true);
      setRankedStatus("ready");
      return nextChallenge;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Ranked challenge.";
      setError(message);
      setRankedStatus("rejected");
      throw err;
    }
  }, [resetKeypressData]);

  const submit = useCallback(async (params: {
    completedCode: string;
    mistakes: number;
    totalMs: number;
    language: string;
    mode: TestMode;
    snippetLength?: SnippetLength;
    durationSeconds?: number;
  }) => {
    if (!challenge) {
      setError("No active challenge found.");
      return null;
    }

    setRankedStatus("submitting");
    setError(null);

    try {
      const result = await submitRankedRun({
        sessionId: challenge.sessionId,
        challengeHash: challenge.challengeHash,
        completedCode: params.completedCode,
        mistakes: params.mistakes,
        totalMs: params.totalMs,
        keyIntervals: keyTimesRef.current,
        language: params.language,
        mode: params.mode,
        snippetLength: params.snippetLength || "medium",
        durationSeconds: params.durationSeconds,
      });

      setVerifiedResult(result);
      setRankedStatus("verified");
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ranked verification failed.";
      setError(message);
      setRankedStatus("rejected");
      return null;
    }
  }, [challenge]);

  const exitRanked = useCallback(() => {
    setIsRanked(false);
    setRankedStatus("idle");
    setChallenge(null);
    setError(null);
    setVerifiedResult(null);
    resetKeypressData();
  }, [resetKeypressData]);

  return {
    isRanked,
    setIsRanked,
    rankedStatus,
    challenge,
    error,
    verifiedResult,
    recordKeypress,
    fetchChallenge,
    submit,
    exitRanked,
  };
}
