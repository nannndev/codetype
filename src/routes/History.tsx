import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, CalendarDays, Flame, Gauge, Target } from "lucide-react";
import { getHistory, getStreak } from "@/utils/storage";
import type { RunResult } from "@/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function TrendChart({ results }: { results: RunResult[] }) {
  const points = useMemo(() => {
    const recent = results.slice(-20);
    if (recent.length === 0) return "";
    const max = Math.max(...recent.map((result) => result.wpm), 1);
    return recent.map((result, index) => {
      const x = recent.length === 1 ? 50 : (index / (recent.length - 1)) * 100;
      const y = 92 - (result.wpm / max) * 78;
      return `${x},${y}`;
    }).join(" ");
  }, [results]);

  if (!points) {
    return <div className="grid h-44 place-items-center text-sm text-muted-foreground">Complete a run to start the graph.</div>;
  }

  return (
    <div className="h-44 overflow-hidden rounded-xl border bg-card/70 p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" role="img" aria-label="WPM trend from recent runs">
        <defs>
          <linearGradient id="history-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#history-fill)" stroke="none" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function History() {
  const history = useMemo(() => [...getHistory()].sort((a, b) => a.timestamp - b.timestamp), []);
  const streak = useMemo(() => getStreak(), []);
  const recent = history.slice(-10).reverse();
  const bestWpm = history.length > 0 ? Math.max(...history.map((result) => result.wpm)) : 0;
  const averageWpm = average(history.map((result) => result.wpm));
  const averageAccuracy = average(history.map((result) => result.accuracy));

  const summary = [
    { label: "Current streak", value: `${streak.current}d`, icon: Flame },
    { label: "Best WPM", value: bestWpm.toFixed(1), icon: Gauge },
    { label: "Avg. accuracy", value: `${averageAccuracy.toFixed(1)}%`, icon: Target },
    { label: "Total runs", value: String(history.length), icon: Activity },
  ];

  return (
    <div className="workspace-shell min-h-screen bg-background transition-colors duration-300">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to typing
        </Link>

        <div className="mb-8 flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <CalendarDays className="size-3.5" /> Local progress
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Typing history</h1>
          <p className="text-sm text-muted-foreground">Stored only in this browser. Average WPM: {averageWpm.toFixed(1)}</p>
        </div>

        <main className="flex flex-col gap-8 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border bg-card/80 p-4 backdrop-blur-sm">
                <Icon className="mb-4 size-4 text-muted-foreground" />
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-bold">WPM trend</h2>
                <p className="text-xs text-muted-foreground">Latest 20 completed runs</p>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">Best streak {streak.best}d</span>
            </div>
            <TrendChart results={history} />
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-bold">Recent runs</h2>
              <p className="text-xs text-muted-foreground">Language, mode, speed, and accuracy</p>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No runs saved yet.</div>
              ) : recent.map((result) => (
                <div key={result.id ?? result.timestamp} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b p-4 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{result.filename ?? result.language}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(result.timestamp).toLocaleDateString()} · {result.mode} · {result.language}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums">{result.wpm.toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">WPM</div>
                  </div>
                  <div className="w-16 text-right">
                    <div className="font-bold tabular-nums">{result.accuracy.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground">accuracy</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
