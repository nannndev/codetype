# Codey Ranked Mode And Anti-Cheat Handoff

## Objective

Create a dedicated Ranked Mode for public leaderboards. Normal Snippet, Timed,
Zen, Custom, Drill, and Ghost practice remain practice modes and must not be
treated as verified competitive scores.

## Product Model

Codey has two clearly separated activity types:

- Practice: local-first, flexible, instant, and useful for history/progress.
- Ranked: server-issued challenge, fixed rules, server-verified result, and
  eligible for public leaderboard placement.

Only Ranked runs appear on the primary leaderboard. Existing community runs
may remain accessible in a separate legacy/community board during migration.

## Ranked Flow

1. User must sign in.
2. User chooses language and ranked format.
3. Client requests a challenge from a trusted serverless endpoint.
4. Server selects the snippet and creates a unique `run_sessions` document.
5. Server records session ID, user ID, challenge hash, start time, expiry,
   language, format, duration, and snippet length.
6. Client receives the challenge content and session ID.
7. Client captures typing attempts and elapsed timing for the session.
8. Client submits the session result and compact input event data.
9. Server validates the session and recalculates WPM, raw WPM, accuracy,
   mistakes, duration, and completion from trusted challenge data.
10. Server creates the final run with `verified: true`.
11. Leaderboard queries only verified Ranked runs.

## Ranked Categories

### Snippet

- Short
- Medium
- Long
- Fixed server-selected snippet
- Exact challenge completion required

### Timed

- 15 seconds
- 30 seconds
- 60 seconds
- 120 seconds
- Server timestamp is authoritative
- Snippet changes remain controlled by the issued challenge set

Zen, Custom, Weak-key Drill, and Ghost practice are never ranked.

## Server Validation

The server must reject a result when:

- Session does not exist, belongs to another user, or is already completed.
- Session is expired or submitted outside the allowed timing tolerance.
- Challenge hash does not match the server-issued challenge.
- Submitted text/event sequence is inconsistent with the challenge.
- Calculated accuracy is below the ranked minimum.
- Snippet length does not match its category.
- Duration is impossibly short or differs materially from server timing.
- WPM exceeds a configurable plausibility threshold.
- Event timing contains impossible or strongly synthetic patterns.
- User exceeds submission/session rate limits.

Server calculations are authoritative. Never trust client-submitted WPM,
accuracy, duration, mistakes, or the `verified` flag.

## Initial Protection Rules

- Minimum ranked accuracy: 90%.
- Configurable maximum plausible WPM.
- Minimum duration/completion constraints per category.
- One-time session IDs with short expiry.
- Per-user and per-IP session/submission rate limits.
- Duplicate submission prevention.
- Challenge hash verification.
- Server-only permission to create verified runs.
- Log rejection reason without exposing anti-cheat internals to the client.

These protections reduce obvious abuse but are not presented as perfect cheat
detection. Rules should be adjustable without a frontend deployment.

## Appwrite Requirements

Use the existing collections where practical:

- `run_sessions`: server-owned ranked challenges and lifecycle.
- `runs`: final results; only trusted server code may create
  `verified: true` documents.
- `profiles`: public identity only, not anti-cheat state.

The browser must not receive `APPWRITE_API_KEY` or permission to set a run as
verified. Vercel serverless functions use the server API key.

Suggested additional `run_sessions` fields:

- `challengeHash`
- `snippetId` or challenge reference
- `snippetLength`
- `startedAt`
- `expiresAt`
- `completedAt`
- `status`
- optional server-side anti-abuse metadata

Suggested additional `runs` fields:

- `sessionId`
- `challengeHash`
- `verifiedAt`
- `verificationVersion`

## Leaderboard UX

- Primary leaderboard is labeled `Ranked` or `Verified rankings`.
- Remove confusing `Community · unverified beta` wording from the primary UI.
- Show a verified mark on Ranked entries.
- Explain Ranked rules before starting a challenge.
- Practice results clearly say they affect history and goals, not ranking.
- If retained, legacy client-submitted scores live under a separate
  `Community` board with a concise explanation.

## Migration

- Existing runs remain in cloud history.
- Existing `verified: false` runs do not enter the primary Ranked board.
- Do not retroactively mark existing runs verified.
- Preserve local history, streak, goals, achievements, and personal bests.
- Ranked personal bests should be tracked separately from practice bests.

## Delivery Order

1. Lock verified run writes to server credentials.
2. Create ranked-session server endpoints.
3. Implement authoritative scoring and challenge validation.
4. Implement session expiry, duplicate prevention, and rate limits.
5. Add Ranked Mode UI and result states.
6. Switch primary leaderboard to `verified: true` only.
7. Add verified marks and migration messaging.
8. Add monitoring and tune plausibility thresholds using real data.

## Guardrails

- Practice must remain usable without login or backend availability.
- Ranked must fail closed if the verification service is unavailable.
- Never silently submit a Practice run as Ranked.
- Never downgrade a failed Ranked verification into a public score.
- Do not expose challenge-selection secrets or server credentials.
- Statistical formulas remain identical between client preview and server
  verification, with the server result taking precedence.
