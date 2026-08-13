import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Code2, Crown, Languages, LoaderCircle, Medal, Share2, ShieldAlert, Timer, Trophy, Zap } from "lucide-react";
import { Footer } from "@/components/Footer";
import { getLanguages } from "@/data";
import { listLeaderboard, listProfiles, type CloudProfile, type CloudRun } from "@/lib/cloud";
import type { TestMode } from "@/types";
import type { RunResult } from "@/types";
import type { ShareCardOptions } from "@/lib/share-result";
import { SharePreviewDialog } from "@/components/SharePreviewDialog";
import { useAuth } from "@/components/AuthProvider";

type Board = "global" | "mode" | "language";

function displayName(run: CloudRun, profiles: Map<string, CloudProfile>): string {
  const profile = profiles.get(run.userId);
  return profile?.displayName || profile?.githubUsername || `Typist ${run.userId.slice(0, 5)}`;
}

function bestRunPerUser(runs: CloudRun[]): CloudRun[] {
  const seen = new Set<string>();
  return runs.filter((run) => {
    if (seen.has(run.userId)) return false;
    seen.add(run.userId);
    return true;
  });
}

function cloudRunAsResult(run: CloudRun): RunResult {
  return {
    language: run.language, mode: run.mode, duration: run.mode === "timed" && run.durationSeconds ? run.durationSeconds * 1000 : run.durationMs, wpm: run.wpm, rawWpm: run.rawWpm,
    accuracy: run.accuracy, consistency: run.consistency, totalCorrect: run.correctChars, charsTyped: run.keystrokes,
    totalErrors: run.mistakes, snippetsCompleted: run.snippetsCompleted, timestamp: new Date(run.$createdAt).getTime(),
    perLineStats: [], errorPositions: [], sourceRepo: run.sourceRepo,
  };
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>("global");
  const [language, setLanguage] = useState("JavaScript");
  const [mode, setMode] = useState<TestMode>("snippet");
  const [duration, setDuration] = useState(30);
  const [runs, setRuns] = useState<CloudRun[]>([]);
  const [profiles, setProfiles] = useState<Map<string, CloudProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareOptions, setShareOptions] = useState<ShareCardOptions | null>(null);
  const languages = useMemo(() => getLanguages().filter((item) => item !== "All"), []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setErrorMessage("");
    void listLeaderboard({
      language: board === "language" ? language : undefined,
      mode: board === "mode" ? mode : undefined,
      durationSeconds: board === "mode" && mode === "timed" ? duration : undefined,
    }).then(async (nextRuns) => {
      const rankedRuns = bestRunPerUser(nextRuns);
      setRuns(rankedRuns);
      const nextProfiles = await listProfiles(rankedRuns.map((run) => run.userId));
      setProfiles(nextProfiles);
    }).catch((loadError) => {
      console.error("Unable to load leaderboard", loadError);
      setError(true);
      const message = loadError instanceof Error ? loadError.message : "";
      setErrorMessage(message.toLowerCase().includes("forbidden")
        ? `Appwrite has not allowed ${window.location.hostname} yet. Add this hostname as an Appwrite Web Platform.`
        : "Unable to load this leaderboard category. Try refreshing in a moment.");
    }).finally(() => setLoading(false));
  }, [board, language, mode, duration]);

  const boardTitle = board === "global" ? "Global WPM" : board === "mode" ? `${mode.charAt(0).toUpperCase()}${mode.slice(1)} ranking` : `${language} ranking`;
  const podium = runs.slice(0, 3);
  const remaining = runs.slice(3);
  const podiumOrder = [podium[1], podium[0], podium[2]];

  return (
    <div className="workspace-shell min-h-screen bg-background transition-colors duration-300">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Back to typing</Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Trophy className="size-3.5" /> Hall of speed</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">One best score per typist. No duplicate domination.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground"><ShieldAlert className="size-3.5" /> Community · unverified beta</div>
        </header>

        <nav className="mb-6 grid grid-cols-3 overflow-hidden rounded-xl border bg-card/65 p-1 backdrop-blur-sm" aria-label="Leaderboard category">
          {([
            ["global", "Global WPM", Zap],
            ["mode", "By mode", Timer],
            ["language", "By language", Languages],
          ] as const).map(([value, label, Icon]) => (
            <button key={value} type="button" onClick={() => setBoard(value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold transition-all active:scale-[.98] sm:text-sm ${board === value ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4" /> <span>{label}</span>
            </button>
          ))}
        </nav>

        {board !== "global" && (
          <section className="mb-6 flex flex-wrap items-center gap-3 border-b pb-5">
            <div className="mr-auto">
              <p className="text-sm font-bold">Choose {board}</p>
              <p className="text-xs text-muted-foreground">This board ranks a dedicated category.</p>
            </div>
            {board === "mode" ? (
              <div className="flex flex-wrap gap-1 rounded-lg border bg-card/70 p-1">
                {(["snippet", "timed", "zen"] as TestMode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-xs font-medium capitalize transition-colors ${mode === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{item}</button>)}
              </div>
            ) : (
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-10 min-w-44 rounded-lg border bg-card px-3 text-xs font-medium text-foreground">
                {languages.map((item) => <option key={item}>{item}</option>)}
              </select>
            )}
            {board === "mode" && mode === "timed" && (
              <div className="flex gap-1 rounded-lg border bg-card/70 p-1">
                {[15, 30, 60, 120].map((value) => <button key={value} type="button" onClick={() => setDuration(value)} className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${duration === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{value}s</button>)}
              </div>
            )}
          </section>
        )}

        <div className="mb-4 flex items-end justify-between">
          <div><h2 className="text-xl font-bold">{boardTitle}</h2><p className="text-xs text-muted-foreground">Ranked by highest WPM</p></div>
          <Code2 className="size-5 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70 px-5 text-center text-sm text-muted-foreground">{errorMessage}</div>
        ) : runs.length === 0 ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70 px-5 text-center text-sm text-muted-foreground">No scores on this board yet. Claim the first rank.</div>
        ) : (
          <main className="animate-fade-in-up">
            <section className="mb-5 grid grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Top three typists">
              {podiumOrder.map((run, position) => {
                if (!run) return <div key={`empty-${position}`} />;
                const actualRank = position === 0 ? 2 : position === 1 ? 1 : 3;
                const name = displayName(run, profiles);
                const profile = profiles.get(run.userId);
                const first = actualRank === 1;
                return (
                  <article key={run.$id} className={`relative overflow-hidden rounded-2xl border bg-card/85 px-2 pb-4 pt-5 text-center backdrop-blur-sm transition-transform hover:-translate-y-1 sm:px-4 ${first ? "min-h-64 border-foreground/35 shadow-[0_20px_70px_hsl(0_0%_100%/0.08)]" : "min-h-52"}`}>
                    {first && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-foreground to-transparent" />}
                    <Link to={`/profile/${run.userId}`} className="block">
                      <div className="mx-auto mb-3 grid size-9 place-items-center overflow-hidden rounded-full border bg-muted text-xs font-bold sm:size-12 sm:text-sm">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div>
                      {first ? <Crown className="mx-auto mb-2 size-6 fill-foreground text-foreground" /> : <Medal className="mx-auto mb-2 size-5 text-muted-foreground" />}
                      <p className="truncate text-xs font-bold sm:text-sm">{name}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{run.wpm.toFixed(1)}</p>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">WPM</p>
                      <div className="mt-3 text-[10px] text-muted-foreground">{run.language} · {run.mode}</div>
                    </Link>
                    {user?.$id === run.userId && <button type="button" onClick={() => setShareOptions({ result: cloudRunAsResult(run), username: profile?.githubUsername || name, heading: boardTitle, rank: actualRank })} className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full border bg-background/70 text-muted-foreground transition-colors hover:text-foreground" aria-label={`Share rank ${actualRank}`}><Share2 className="size-3" /></button>}
                    <div className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full border text-xs font-bold ${first ? "bg-foreground text-background" : "bg-background/60"}`}>{actualRank}</div>
                  </article>
                );
              })}
            </section>

            {remaining.length > 0 && (
              <section className="overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm">
                <div className="grid grid-cols-[48px_1fr_70px_70px_34px] gap-2 border-b bg-muted/45 px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground sm:grid-cols-[56px_1.4fr_1fr_90px_90px_34px]"><span>Rank</span><span>Typist</span><span className="hidden sm:block">Run</span><span className="text-right">WPM</span><span className="text-right">Accuracy</span><span /></div>
                {remaining.map((run, index) => {
                  const name = displayName(run, profiles);
                  const profile = profiles.get(run.userId);
                  const canShare = user?.$id === run.userId;
                  return <div key={run.$id} className="grid grid-cols-[48px_1fr_70px_70px_34px] items-center gap-2 border-b px-4 py-3 last:border-0 sm:grid-cols-[56px_1.4fr_1fr_90px_90px_34px]">
                    <span className="text-sm font-bold tabular-nums text-muted-foreground">#{index + 4}</span>
                    <Link to={`/profile/${run.userId}`} className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-70"><div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted text-xs font-bold">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="text-[10px] text-muted-foreground">View profile</p></div></Link>
                    <div className="hidden min-w-0 sm:block"><p className="truncate text-xs font-medium">{run.language}</p><p className="text-[10px] text-muted-foreground">{run.mode}{run.durationSeconds ? ` · ${run.durationSeconds}s` : ""}</p></div>
                    <div className="text-right"><p className="text-lg font-bold tabular-nums">{run.wpm.toFixed(1)}</p><p className="text-[9px] text-muted-foreground sm:hidden">{run.language}</p></div>
                    <span className="text-right text-sm font-medium tabular-nums">{run.accuracy.toFixed(1)}%</span>
                    {canShare ? <button type="button" onClick={() => setShareOptions({ result: cloudRunAsResult(run), username: profile?.githubUsername || name, heading: boardTitle, rank: index + 4 })} className="grid size-8 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Share rank ${index + 4}`}><Share2 className="size-3.5" /></button> : <span />}
                  </div>;
                })}
              </section>
            )}
          </main>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">Community scores are public and not anti-cheat verified yet.</p>
      </div>
      <Footer />
      <SharePreviewDialog options={shareOptions} onClose={() => setShareOptions(null)} />
    </div>
  );
}
