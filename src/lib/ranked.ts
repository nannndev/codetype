import { account } from './appwrite';
import type { SnippetLength, TestMode } from '../types';

export interface RankedChallenge {
  sessionId: string;
  challengeHash: string;
  snippetCode: string;
  language: string;
  mode: TestMode;
  snippetLength: SnippetLength;
  durationSeconds?: number;
  targetChars: number;
  expiresAt: string;
}

export interface RankedSubmission {
  sessionId: string;
  challengeHash: string;
  completedCode: string;
  mistakes: number;
  totalMs: number;
  keyIntervals: number[];
  language: string;
  mode: TestMode;
  snippetLength: SnippetLength;
  durationSeconds?: number;
}

export interface RankedResult {
  verified: boolean;
  runId: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

async function getJwtToken(): Promise<string | null> {
  if (!account) return null;
  try {
    const session = await account.createJWT();
    return session.jwt;
  } catch {
    return null;
  }
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { error?: string };
    return new Error(payload.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function requestRankedChallenge(params: {
  language: string;
  mode: TestMode;
  snippetLength?: SnippetLength;
  durationSeconds?: number;
}): Promise<RankedChallenge> {
  const jwt = await getJwtToken();
  if (!jwt) throw new Error('You must be signed in with GitHub to play Ranked Mode.');

  const response = await fetch('/api/ranked/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw await apiError(response, 'Ranked verification service is unavailable.');
  return await response.json() as RankedChallenge;
}

export async function submitRankedRun(payload: RankedSubmission): Promise<RankedResult> {
  const jwt = await getJwtToken();
  if (!jwt) throw new Error('Authentication lost during Ranked submission.');

  const response = await fetch('/api/ranked/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await apiError(response, 'Ranked result could not be verified or recorded.');
  return await response.json() as RankedResult;
}
