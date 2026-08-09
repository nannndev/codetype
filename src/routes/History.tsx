import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Flame, Gauge, Target, Activity, TrendingUp } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getHistory, getStreak, getPersonalBests } from "@/utils/storage";
import { Footer } from "@/components/Footer";
import type { RunResult, HistoryFilter, TestMode } from "@/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function filterResults(results: RunResult[], filter: HistoryFilter): RunResult[] {
  let filtered = results;

  if (filter.language !== "All") {
    filtered = filtered.filter((r) => r.language === filter.language);
  }
  if (filter.mode !== "all") {
    filtered = filtered.filter((r) => r.mode === filter.mode);
  }
  if (filter.timeRange !== "all") {
    const now = Date.now();
    const cutoff = filter.timeRange === "7d" ? 7 * 86400000 : 30 * 86400000;
    filtered = filtered.filter((r) => r.timestamp > now - cutoff);
  }

  return filtered;
}

/* ---- Charts (inline SVG, no deps) ---- */

function WpmTrendChart({ results }: { results: RunResult[] }) {
  const points = useMemo(() => {
    const recent = results.slice(-30);
    if (recent.length < 2) return null;
    const max = Math.max(...recent.map((r) => r.wpm), 1);
    return recent.map((r, i) => {
      const x = (i / (recent.length - 1)) * 100;
      const y = 92 - (r.wpm / max) * 78;
      return `${x},${y}`;
    }).join(" ");
  }, [results]);

  if (!points) {
    return <div className="grid h-44 place-items-center text-xs text-muted-foreground">Need 2+ runs for trend</div>;
  }

  return (
    <div className="h-44 overflow-hidden rounded-xl border bg-card/70 p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" role="img" aria-label="WPM trend">
        <defs>
          <linearGradient id="wpm-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#wpm-fill)" stroke="none" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function AccuracyTrendChart({ results }: { results: RunResult[] }) {
  const points = useMemo(() => {
    const recent = results.slice(-30);
    if (recent.length < 2) return null;
    return recent.map((r, i) => {
      const x = (i / (recent.length - 1)) * 100;
      const y = 92 - (r.accuracy / 100) * 78;
      return `${x},${y}`;
    }).join(" ");
  }, [results]);

  if (!points) {
    return <div className="grid h-44 place-items-center text-xs text-muted-foreground">Need 2+ runs for trend</div>;
  }

  return (
    <div className="h-44 overflow-hidden rounded-xl border bg-card/70 p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full" role="img" aria-label="Accuracy trend">
        <defs>
          <linearGradient id="acc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(142 76% 36%)" stopOpacity="0.25" />
            <stop offset="1" stopColor="hsl(142 76% 36%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#acc-fill)" stroke="none" />
        <polyline points={points} fill="none" stroke="hsl(142 76% 36%)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function RunsPerDayChart({ results }: { results: RunResult[] }) {
  const data = useMemo(() => {
    const toDate = (ts: number) => new Date(ts).toISOString().split("T")[0];
    const counts = new Map<string, number>();
    for (const r of results) {
      const d = toDate(r.timestamp);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000);
      return d.toISOString().split("T")[0];
    });
    return days.map((d) => ({ date: d, count: counts.get(d) ?? 0 }));
  }, [results]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-44 overflow-hidden rounded-xl border bg-card/70 p-4 pb-8">
      <svg viewBox="0 0 140 100" preserveAspectRatio="none" className="size-full" role="img" aria-label="Runs per day">
        {data.map((d, i) => {
          const barH = (d.count / maxCount) * 80;
          const x = (i / 13) * 130 + 3;
          const w = Math.max(3, 100 / 14 - 2);
          return (
            <rect
              key={d.date}
              x={x}
              y={95 - barH}
              width={w}
              height={barH}
              rx="1"
              fill="currentColor"
              opacity={d.count > 0 ? 0.45 : 0.1}
            />
          );
        })}
      </svg>
    </div>
  );
}

function LanguageDistribution({ results }: { results: RunResult[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [results]);

  const total = data.reduce((s, [, c]) => s + c, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {data.map(([lang, count]) => (
        <div key={lang} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] font-medium truncate">{lang}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Main Page ---- */

const ALL_LANGUAGES = "All";
const LANGUAGE_OPTIONS = (() => {
  const all = getHistory();
  const langs = new Set(all.map((r) => r.language));
  return [ALL_LANGUAGES, ...Array.from(langs).sort()];
})();

export default function History() {
  const [languageFilter, setLanguageFilter] = useState(ALL_LANGUAGES);
  const [modeFilter, setModeFilter] = useState<TestMode | "all">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "30d" | "7d">("all");

  const filter: HistoryFilter = useMemo(
    () => ({ language: languageFilter, mode: modeFilter, timeRange: timeFilter }),
    [languageFilter, modeFilter, timeFilter],
  );

  const allHistory = useMemo(() => [...getHistory()].sort((a, b) => a.timestamp - b.timestamp), []);
  const filtered = useMemo(() => filterResults(allHistory, filter), [allHistory, filter]);
  const streak = useMemo(() => getStreak(), []);
  const personalBests = useMemo(() => getPersonalBests(), []);

  const bestWpm = filtered.length > 0 ? Math.max(...filtered.map((r) => r.wpm)) : 0;
  const avgWpm = average(filtered.map((r) => r.wpm));
  const avgAcc = average(filtered.map((r) => r.accuracy));
  const recent = filtered.slice(-10).reverse();

  const summary = [
    { label: "Current streak", value: `${streak.current}d`, icon: Flame },
    { label: "Best WPM", value: bestWpm.toFixed(1), icon: Gauge },
    { label: "Avg. accuracy", value: `${avgAcc.toFixed(1)}%`, icon: Target },
    { label: "Total runs", value: String(filtered.length), icon: Activity },
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
          <p className="text-sm text-muted-foreground">Stored only in this browser. Avg WPM: {avgWpm.toFixed(1)}</p>
        </div>

        {/* Filters bar */}
        <div className="mb-6 flex flex-wrap items-end gap-4 animate-fade-in-up">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Language</span>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-9 rounded-lg border bg-card px-3 text-xs"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mode</span>
            <ToggleGroup type="single" value={modeFilter} onValueChange={(v) => v && setModeFilter(v as TestMode | "all")} className="gap-1">
              {(["all", "snippet", "timed", "zen"] as const).map((m) => (
                <ToggleGroupItem key={m} value={m} className="h-9 px-3 text-xs rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Range</span>
            <ToggleGroup type="single" value={timeFilter} onValueChange={(v) => v && setTimeFilter(v as "all" | "30d" | "7d")} className="gap-1">
              {(["all", "30d", "7d"] as const).map((t) => (
                <ToggleGroupItem key={t} value={t} className="h-9 px-3 text-xs rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  {t === "all" ? "All" : t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <main className="flex flex-col gap-8 animate-fade-in-up">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border bg-card/80 p-4 backdrop-blur-sm">
                <Icon className="mb-4 size-4 text-muted-foreground" />
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold">WPM trend</p>
                  <p className="text-[10px] text-muted-foreground">Last 30 runs</p>
                </div>
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
              <WpmTrendChart results={filtered} />
            </section>
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold">Accuracy trend</p>
                  <p className="text-[10px] text-muted-foreground">Last 30 runs</p>
                </div>
                <Target className="size-4 text-muted-foreground" />
              </div>
              <AccuracyTrendChart results={filtered} />
            </section>
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold">Runs per day</p>
                  <p className="text-[10px] text-muted-foreground">Last 14 days</p>
                </div>
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <RunsPerDayChart results={filtered} />
            </section>
            <section className="flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold">Languages</p>
                  <p className="text-[10px] text-muted-foreground">{filtered.length} total runs</p>
                </div>
              </div>
              <div className="rounded-xl border bg-card/70 p-4">
                <LanguageDistribution results={filtered} />
              </div>
            </section>
          </div>

          {/* Per-language bests table */}
          {personalBests.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="font-bold">Personal bests</h2>
                <p className="text-xs text-muted-foreground">Best WPM per language and mode</p>
              </div>
              <div className="overflow-hidden rounded-xl border bg-card/80">
                <div className="grid grid-cols-[1fr_80px_80px_60px] gap-2 border-b bg-muted/50 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Language / Mode</span>
                  <span className="text-right">WPM</span>
                  <span className="text-right">Accuracy</span>
                  <span className="text-right">Runs</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {personalBests
                    .sort((a, b) => b.bestWpm - a.bestWpm)
                    .map((pb) => (
                      <div
                        key={`${pb.language}-${pb.mode}-${pb.duration}`}
                        className="grid grid-cols-[1fr_80px_80px_60px] gap-2 items-center border-b px-4 py-2.5 last:border-b-0 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="truncate font-medium">{pb.language}</span>
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            {pb.mode}{pb.duration ? ` ${pb.duration}s` : ""}
                          </span>
                        </div>
                        <span className="text-right font-bold tabular-nums">{pb.bestWpm.toFixed(1)}</span>
                        <span className="text-right tabular-nums text-green-600 dark:text-green-400">{pb.bestAccuracy.toFixed(1)}%</span>
                        <span className="text-right tabular-nums text-muted-foreground">{pb.totalRuns}</span>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent runs */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-bold">Recent runs</h2>
              <p className="text-xs text-muted-foreground">Language, mode, speed, and accuracy</p>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card/80 backdrop-blur-sm">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No runs match the current filters.</div>
              ) : recent.map((run) => (
                <div key={run.id ?? run.timestamp} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b p-4 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{run.filename ?? run.language}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(run.timestamp).toLocaleDateString()} · {run.mode} · {run.language}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums">{run.wpm.toFixed(1)}</div>
                    <div className="text-[10px] text-muted-foreground">WPM</div>
                  </div>
                  <div className="w-16 text-right">
                    <div className="font-bold tabular-nums">{run.accuracy.toFixed(1)}%</div>
                    <div className="text-[10px] text-muted-foreground">accuracy</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}
