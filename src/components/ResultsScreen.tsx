import type { RunResult, PersonalBest } from "@/types";
import { Button } from "@/components/ui/button";
import { ErrorHeatmap } from "@/components/ErrorHeatmap";
import { RefreshCw, ArrowRight, Trophy } from "lucide-react";

interface ResultsScreenProps {
  result: RunResult;
  previousBest: PersonalBest | null;
  onRetry: () => void;
  onNext: () => void;
}

export function ResultsScreen({ result, previousBest, onRetry, onNext }: ResultsScreenProps) {
  const modeLabel =
    result.mode === 'timed'
      ? `${result.duration / 1000}s`
      : result.mode === 'zen'
        ? 'Zen'
        : 'Snippet';

  const isNewWpmRecord = previousBest ? result.wpm > previousBest.bestWpm : true;
  const isNewAccuracyRecord = previousBest ? result.accuracy > previousBest.bestAccuracy : true;
  const hasAnyRecord = isNewWpmRecord || isNewAccuracyRecord;
  const isCustom = result.sourceType === "custom";

  return (
    <div className="mt-8 flex animate-fade-in-up flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold">
          Run Complete — <span className="text-muted-foreground">{modeLabel}</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{result.language}</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative rounded-xl border bg-card p-6 text-center">
          {!isCustom && isNewWpmRecord && (
            <div className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Trophy className="size-3" /> Record
            </div>
          )}
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">WPM</p>
          <p className="text-5xl font-bold tracking-tight">{result.wpm.toFixed(1)}</p>
          {previousBest && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Best: {previousBest.bestWpm.toFixed(1)} WPM in {previousBest.totalRuns} runs
            </p>
          )}
        </div>
        <div className="relative rounded-xl border bg-card p-6 text-center">
          {!isCustom && isNewAccuracyRecord && result.accuracy > 0 && (
            <div className="absolute -top-2 right-2 flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Trophy className="size-3" /> Record
            </div>
          )}
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Accuracy</p>
          <p className="text-5xl font-bold tracking-tight text-green-600 dark:text-green-400">{result.accuracy.toFixed(1)}%</p>
          {previousBest && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Best: {previousBest.bestAccuracy.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {!isCustom && hasAnyRecord && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="size-3.5" />
            New personal best!
          </span>
        </div>
      )}

      {isCustom && <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">Local practice result · not added to history, streak, cloud sync, personal best, or leaderboard.</div>}

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Raw WPM', value: result.rawWpm.toFixed(1) },
          { label: 'Consistency', value: `${result.consistency.toFixed(1)}%` },
          { label: 'Errors', value: String(result.totalErrors) },
          { label: 'Chars', value: String(result.charsTyped) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
            <p className="text-sm font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-line Accuracy */}
      {result.perLineStats.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Per-Line Accuracy</p>
          <div className="flex flex-col gap-1.5">
            {result.perLineStats.map((ls) => (
              <div key={ls.lineIndex} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-6 text-right tabular-nums">
                  L{ls.lineIndex + 1}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${ls.accuracy}%` }}
                  />
                </div>
                <span className="w-10 text-[10px] tabular-nums text-muted-foreground">{ls.accuracy.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Heatmap */}
      {result.errorPositions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Error Map ({result.errorPositions.length} errors)
          </p>
          <ErrorHeatmap errorPositions={result.errorPositions} totalChars={result.charsTyped} />
        </div>
      )}

      {/* Error Details */}
      {result.errorPositions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Error Details</p>
          <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-xs font-mono">
            {result.errorPositions.slice(0, 20).map((e, errorIndex) => (
              <div key={`${e.index}-${errorIndex}`}>
                pos {e.index}: expected{' '}
                <span className="text-green-600 dark:text-green-400">{e.expected === '\n' ? '↵' : e.expected}</span>
                {' '}got{' '}
                <span className="text-red-500">{e.typed === '\n' ? '↵' : e.typed}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button onClick={onRetry} size="lg">
            <RefreshCw data-icon="inline-start" />
            Try Again
          </Button>
          <Button onClick={onNext} variant="outline" size="lg">
            <ArrowRight data-icon="inline-start" />
            Next Snippet
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to retry
        </span>
      </div>
    </div>
  );
}
