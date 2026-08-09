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
}

function StatCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums", className)}>{value}</span>
    </div>
  );
}

export function StatsBar({ wpm, accuracy, elapsedSeconds, progress, mode, secondsRemaining, snippetsCompleted, totalChars }: StatsBarProps) {
  const isTimed = mode === 'timed';
  const isZen = mode === 'zen';
  const timeLow = isTimed && secondsRemaining <= 5;

  return (
    <div className="flex flex-col gap-3">
      <div className={cn("grid gap-2 sm:gap-3", isZen ? "grid-cols-4" : "grid-cols-3")}>
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
