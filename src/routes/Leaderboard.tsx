import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LoaderCircle, ShieldAlert, Trophy } from "lucide-react";
import { Footer } from "@/components/Footer";
import { getLanguages } from "@/data";
import { listLeaderboard, listProfiles, type CloudProfile, type CloudRun } from "@/lib/cloud";
import type { TestMode } from "@/types";

export default function Leaderboard() {
  const [language, setLanguage] = useState("All");
  const [mode, setMode] = useState<TestMode | "all">("all");
  const [duration, setDuration] = useState(30);
  const [runs, setRuns] = useState<CloudRun[]>([]);
  const [profiles, setProfiles] = useState<Map<string, CloudProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const languages = useMemo(() => ["All", ...getLanguages().filter((item) => item !== "All")], []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    void listLeaderboard({
      language: language === "All" ? undefined : language,
      mode: mode === "all" ? undefined : mode,
      durationSeconds: mode === "timed" ? duration : undefined,
    }).then(async (nextRuns) => {
      setRuns(nextRuns);
      setProfiles(await listProfiles(nextRuns.map((run) => run.userId)));
    }).catch((loadError) => {
      console.error("Unable to load leaderboard", loadError);
      setError(true);
    }).finally(() => setLoading(false));
  }, [language, mode, duration]);

  return (
    <div className="workspace-shell min-h-screen bg-background transition-colors duration-300">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Back to typing</Link>
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Trophy className="size-3.5" /> Community rankings</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Leaderboard</h1><p className="mt-1 text-sm text-muted-foreground">Fastest community runs across every language.</p></div>
          <div className="flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground"><ShieldAlert className="size-3.5" /> Unverified beta</div>
        </div>

        <section className="mb-5 flex flex-wrap gap-3 rounded-xl border bg-card/70 p-4 backdrop-blur-sm">
          <label className="grid gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-9 min-w-36 rounded-lg border bg-background px-3 text-xs normal-case text-foreground">{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">Mode<select value={mode} onChange={(event) => setMode(event.target.value as TestMode | "all")} className="h-9 min-w-32 rounded-lg border bg-background px-3 text-xs normal-case text-foreground"><option value="all">All modes</option><option value="snippet">Snippet</option><option value="timed">Timed</option><option value="zen">Zen</option></select></label>
          {mode === "timed" && <label className="grid gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">Duration<select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-9 rounded-lg border bg-background px-3 text-xs normal-case text-foreground">{[15, 30, 60, 120].map((value) => <option key={value} value={value}>{value}s</option>)}</select></label>}
        </section>

        <main className="animate-fade-in-up overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm">
          <div className="grid grid-cols-[48px_1fr_70px_70px] gap-2 border-b bg-muted/45 px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground sm:grid-cols-[56px_1.4fr_1fr_90px_90px]"><span>Rank</span><span>Typist</span><span className="hidden sm:block">Run</span><span className="text-right">WPM</span><span className="text-right">Accuracy</span></div>
          {loading ? <div className="grid h-64 place-items-center"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></div> : error ? <div className="grid h-64 place-items-center px-5 text-center text-sm text-muted-foreground">Leaderboard query failed. Check Appwrite indexes and collection read permissions.</div> : runs.length === 0 ? <div className="grid h-64 place-items-center px-5 text-center text-sm text-muted-foreground">No community runs match these filters yet. Be the first one.</div> : runs.map((run, index) => {
            const profile = profiles.get(run.userId);
            const name = profile?.displayName || profile?.githubUsername || `Typist ${run.userId.slice(0, 5)}`;
            return <div key={run.$id} className="grid grid-cols-[48px_1fr_70px_70px] items-center gap-2 border-b px-4 py-3 last:border-0 sm:grid-cols-[56px_1.4fr_1fr_90px_90px]">
              <span className={`text-sm font-bold tabular-nums ${index < 3 ? "text-foreground" : "text-muted-foreground"}`}>#{index + 1}</span>
              <div className="flex min-w-0 items-center gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg border bg-muted text-xs font-bold">{name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="text-[10px] text-muted-foreground">{run.verified ? "Verified" : "Community"}</p></div></div>
              <div className="hidden min-w-0 sm:block"><p className="truncate text-xs font-medium">{run.language}</p><p className="text-[10px] text-muted-foreground">{run.mode}{run.durationSeconds ? ` · ${run.durationSeconds}s` : ""}</p></div>
              <div className="text-right"><p className="text-lg font-bold tabular-nums">{run.wpm.toFixed(1)}</p><p className="text-[9px] text-muted-foreground sm:hidden">{run.language}</p></div>
              <span className="text-right text-sm font-medium tabular-nums">{run.accuracy.toFixed(1)}%</span>
            </div>;
          })}
        </main>
        <p className="mt-4 text-center text-xs text-muted-foreground">Community scores are public but not anti-cheat verified yet. Competitive verification comes in the server-side phase.</p>
      </div>
      <Footer />
    </div>
  );
}
