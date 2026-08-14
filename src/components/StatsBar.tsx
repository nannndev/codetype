import { cn } from "@/lib/utils";
import type { TestMode } from "@/types";

interface StatsBarProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  progress: number;
  mode: TestMode;
  secondsRemaining: number;
  snippetsCompleted: number;
  totalChars: number;
  ghostState?: {
    hasPb: boolean;
    targetWpm: number;
    deltaWpm: number;
    deltaChars: number;
  };
  onToggleGhost?: () => void;
  isGhostEnabled?: boolean;
}

function StatCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums", className)}>{value}</span>
    </div>
  );
}

export function StatsBar({
  wpm,
  accuracy,
  elapsedSeconds,
  progress,
  mode,
  secondsRemaining,
  snippetsCompleted,
  totalChars,
  ghostState,
  onToggleGhost,
  isGhostEnabled = true,
}: StatsBarProps) {
  const isTimed = mode === 'timed';
  const isZen = mode === 'zen';
  const timeLow = isTimed && secondsRemaining <= 5;
  const hasGhost = Boolean(ghostState?.hasPb);

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("grid gap-2 sm:gap-3", isZen ? (hasGhost ? "grid-cols-5" : "grid-cols-4") : (hasGhost ? "grid-cols-4" : "grid-cols-3"))}>
        <StatCard label="WPM" value={wpm.toFixed(1)} />
        <StatCard
          label="Accuracy"
          value={`${accuracy.toFixed(1)}%`}
          className={accuracy >= 90 ? "text-green-600 dark:text-green-400" : "text-yellow-500"}
        />
        {isTimed ? (
          <StatCard
            label="Time left"
            value={`${secondsRemaining}s`}
            className={cn(timeLow && "text-red-500 animate-pulse")}
          />
        ) : isZen ? (
          <>
            <StatCard label="Snippets" value={String(snippetsCompleted)} />
            <StatCard label="Chars" value={String(totalChars)} />
          </>
        ) : (
          <StatCard label="Time" value={`${elapsedSeconds.toFixed(1)}s`} />
        )}
        {hasGhost && (
          <div className="rounded-lg border bg-card/90 p-3 flex flex-col gap-0.5 min-w-0 relative group">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 truncate">
                👻 vs PB ({ghostState?.targetWpm.toFixed(0)} WPM)
              </span>
              {onToggleGhost && (
                <button
                  type="button"
                  onClick={onToggleGhost}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-semibold transition-all flex items-center gap-1 cursor-pointer select-none shrink-0",
                    isGhostEnabled
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 hover:bg-purple-500/25"
                      : "bg-muted text-muted-foreground border border-transparent hover:bg-muted/80"
                  )}
                  title={isGhostEnabled ? "Ghost Pace: ON (Click to turn off)" : "Ghost Pace: OFF (Click to turn on)"}
                >
                  <span className={cn("size-1.5 rounded-full", isGhostEnabled ? "bg-purple-500 dark:bg-purple-400 animate-pulse" : "bg-muted-foreground/40")} />
                  {isGhostEnabled ? "ON" : "OFF"}
                </button>
              )}
            </div>
            <span
              className={cn(
                "text-lg font-bold tabular-nums transition-opacity duration-200",
                !isGhostEnabled && "opacity-40",
                (ghostState?.deltaWpm ?? 0) > 0
                  ? "text-emerald-500"
                  : (ghostState?.deltaWpm ?? 0) < 0
                    ? "text-rose-500"
                    : "text-muted-foreground",
              )}
            >
              {isGhostEnabled ? (
                (ghostState?.deltaWpm ?? 0) > 0
                  ? `+${ghostState?.deltaWpm.toFixed(1)}`
                  : `${ghostState?.deltaWpm.toFixed(1)}`
              ) : (
                "OFF"
              )}
            </span>
          </div>
        )}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-150 ease-out",
            progress > 0 && "bg-primary",
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
