# Codey Local Feature Handoff

## Objective

Continue developing Codey as a polished local-first code typing application. Supabase/public accounts/leaderboards are explicitly paused. Do not require a backend for the work in this handoff.

## Current Product State

- React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn-style local components.
- Monochrome gradient workspace with subtle code characters in the background.
- Snippet, timed (15/30/60/120 seconds), and Zen modes.
- Dynamic GitHub snippets through `/api/snippets`, with curated/static fallback.
- PHP, Dart, Flutter, and the original language catalog are available.
- Language selection is a compact editor-adjacent dropdown using official Simple Icons.
- Typing results/history and streak are stored in `localStorage`.
- WPM and raw WPM now use cumulative counters across multiple snippets in Timed/Zen.
- `Esc` restarts, `Enter` retries from results, and `Tab` stops Zen.
- Supabase scaffolding exists but is not configured. Do not make Supabase required.

## Priority Features

### 1. Personal Bests

Add local personal-best tracking grouped by:

- Language
- Mode
- Timed duration where relevant

Show the previous best and whether the latest run created a new record. Existing local history must remain compatible.

### 2. History Analytics

Improve `/history` with:

- WPM trend
- Accuracy trend
- Runs per day
- Language distribution
- Filters for language, mode, and time range
- Best, average, and latest values

Charts should remain lightweight and responsive. Avoid adding a large chart dependency unless it materially improves the result.

### 3. Daily Goals

Add configurable local goals such as:

- Number of completed runs
- Minutes practiced
- Characters typed

Display today's progress in the workspace and history page. Persist settings and progress locally using timezone-safe local date keys.

### 4. Local Achievements

Create meaningful achievements, for example:

- First completed run
- 50/80/100 WPM
- 95% and 100% accuracy
- Seven-day streak
- Practice five different languages
- Complete a 60-second timed run

Achievements must be derived from history where possible so existing users can unlock them retroactively.

### 5. Import And Export

Allow users to:

- Export preferences, streak, goals, achievements, and typing history as versioned JSON
- Import a valid backup
- Preview import counts before applying
- Avoid duplicate runs during repeated imports
- Recover gracefully from malformed or newer unsupported backup versions

### 6. Keyboard Workflow

Improve keyboard navigation without conflicting with typing input:

- Keep `Esc` for restart
- Keep `Enter` for retry on results
- Add a discoverable shortcut help surface
- Consider a command palette only if it remains disabled while an active typing run is capturing characters
- Ensure buttons and language/mode controls return focus to the typing workspace

### 7. Additional Practice Modes

Explore local-only modes that reuse the current engine:

- Error-focused retry generated from recent mistakes
- Personal-best challenge/ghost target
- Daily challenge generated deterministically from date + language
- Custom pasted code practice

Implement one mode at a time. Do not destabilize existing Snippet, Timed, or Zen behavior.

## Statistical Rules

- Standard WPM: `(cumulative correct characters / 5) / elapsed minutes`.
- Raw WPM: `(all character attempts / 5) / elapsed minutes`.
- Accuracy: `(keystrokes - mistakes) / keystrokes * 100`.
- Corrected mistakes remain counted as mistakes for accuracy.
- Backspace updates the committed/current correct-character count.
- Timed and Zen counters must remain cumulative when the displayed snippet changes.
- Do not calculate leaderboard-style rankings locally; only personal comparisons.

## Storage Requirements

- Preserve the legacy pre-rename keys and data where practical:
  - `codetype_history`
  - `codetype_streak`
- Introduce a versioned storage schema for new settings.
- Migrate old data safely instead of clearing it.
- Keep storage reads defensive because localStorage can be unavailable or malformed.
- Do not store GitHub or Supabase secrets in browser storage.

## Relevant Files

- `src/App.tsx` — workspace state and result creation
- `src/hooks/useGame.ts` — typing engine and cumulative counters
- `src/hooks/useSnippets.ts` — snippet selection
- `src/utils/scoring.ts` — statistical formulas
- `src/utils/storage.ts` — local history and streak
- `src/routes/History.tsx` — local analytics page
- `src/routes/Settings.tsx` — preferences surface
- `src/components/ResultsScreen.tsx` — completed-run details
- `src/components/StatsBar.tsx` — live metrics
- `src/components/LanguagePicker.tsx` — language dock
- `src/index.css` — theme and workspace atmosphere

## Design Direction

- Preserve the monochrome gradient and subtle code-character atmosphere.
- Avoid grid backgrounds and generic neon/AI-looking decoration.
- Keep the editor dominant and controls compact.
- Use official ecosystem icons where available.
- Maintain desktop and mobile responsiveness.
- Respect reduced motion and visible keyboard focus.
- Prefer clear data hierarchy over adding more decorative cards.

## Guardrails

- Do not make Supabase, authentication, or public leaderboards required.
- Do not expose `GITHUB_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` to Vite/browser code.
- Do not replace existing user history.
- Do not regress timer completion, restart shortcuts, cumulative WPM, or dynamic-language selection.
- Run `npm run build` after each completed feature group.

## Suggested Execution Order

1. Version and harden local storage.
2. Add personal-best derivation.
3. Add history filters and analytics.
4. Add daily goals.
5. Add retroactive achievements.
6. Add import/export.
7. Add shortcut help.
8. Prototype one additional practice mode.

Each completed feature should include a short summary of changed files, storage migration behavior, and manual verification steps.
