import type { RunResult, PersonalBest, Snippet } from "@/types";
import { Button } from "@/components/ui/button";
import { ErrorHeatmap } from "@/components/ErrorHeatmap";
import { WeakKeys } from "@/components/WeakKeys";
import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowRight, Trophy, ImageDown } from "lucide-react";
import { useAuth, githubUsernameFromUser } from "@/components/AuthProvider";
import type { ShareCardOptions } from "@/lib/share-result";
import { SharePreviewDialog } from "@/components/SharePreviewDialog";
import { Zap } from "lucide-react";
import { rankRejectionReason, describeRankRejection } from "@/utils/ranking";
import type { RankedStatus } from "@/hooks/useRankedGame";

interface ResultsScreenProps {
  result: RunResult;
  previousBest: PersonalBest | null;
  verifiedResult?: { verified: boolean; wpm: number; accuracy: number } | null;
  rankedStatus?: RankedStatus;
  rankedError?: string | null;
  onRetry: () => void;
  onNext: () => void;
  onDrill: (snippet: Snippet) => void;
}

export function ResultsScreen({ result, previousBest, verifiedResult, rankedStatus, rankedError, onRetry, onNext, onDrill }: ResultsScreenProps) {
  const { user } = useAuth();
  const [shareOptions, setShareOptions] = useState<ShareCardOptions | null>(null);
  const modeLabel =
    result.mode === 'timed'
      ? `${result.duration / 1000}s`
      : result.mode === 'zen'
        ? 'Zen'
        : `${result.snippetLength ? `${result.snippetLength.charAt(0).toUpperCase()}${result.snippetLength.slice(1)} ` : ''}Snippet`;

  const isNewWpmRecord = previousBest ? result.wpm > previousBest.bestWpm : true;
  const isNewAccuracyRecord = previousBest ? result.accuracy > previousBest.bestAccuracy : true;
  const hasAnyRecord = isNewWpmRecord || isNewAccuracyRecord;
  const isCustom = result.sourceType === "custom";
  const rejection = rankRejectionReason(result);

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

      {verifiedResult?.verified && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-500">
            <span>⚡ Ranked Score</span>
          </span>
        </div>
      )}

      {rankedStatus === "submitting" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">
          Verifying Ranked run with the server...
        </div>
      )}

      {rankedStatus === "rejected" && rankedError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs font-semibold text-red-600 dark:text-red-400">
          Ranked run rejected: {rankedError}
        </div>
      )}

      {!isCustom && hasAnyRecord && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Trophy className="size-3.5" />
            New personal best!
          </span>
        </div>
      )}

      {isCustom
        ? <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">Local practice result · not added to history, streak, cloud sync, personal best, or leaderboard.</div>
        : verifiedResult?.verified
          ? <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">🛡️ Verified by server anti-cheat — Placed on the Ranked Leaderboard!</div>
          : rejection && <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">Saved to your history, but not ranked. {describeRankRejection(rejection)}</div>}

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

      {/* Keyed on timestamp so the panel re-reads history after this run is saved. */}
      <WeakKeys refreshKey={result.timestamp} onDrill={onDrill} />

      {/* CTAs */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2 w-full">
          <Button onClick={() => setShareOptions({ result, username: user ? githubUsernameFromUser(user) || user.name || undefined : undefined })} variant="outline" size="lg" className="flex-1 border-foreground/25 bg-foreground text-background hover:bg-foreground/85 hover:text-background">
            <ImageDown data-icon="inline-start" /> Share result
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
            <Link to="/analytics/keyboard"><Zap className="size-4" /> Keyboard analytics</Link>
          </Button>
        </div>
        <div className="flex gap-2 w-full justify-center">
          <Button onClick={onRetry} size="lg" className="flex-1">
            <RefreshCw data-icon="inline-start" />
            Try Again
          </Button>
          <Button onClick={onNext} variant="outline" size="lg" className="flex-1">
            <ArrowRight data-icon="inline-start" />
            Next Snippet
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to retry
        </span>
      </div>
      <SharePreviewDialog options={shareOptions} onClose={() => setShareOptions(null)} />
    </div>
  );
}
