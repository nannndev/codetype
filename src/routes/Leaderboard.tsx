import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Code2, LoaderCircle, Share2, Timer, Trophy, Zap } from "lucide-react";
import { Footer } from "@/components/Footer";
import { getLanguages } from "@/data";
import { listLeaderboard, listProfiles, type CloudProfile, type CloudRun } from "@/lib/cloud";
import type { SnippetLength } from "@/types";
import type { RunResult } from "@/types";
import type { ShareCardOptions } from "@/lib/share-result";
import { SharePreviewDialog } from "@/components/SharePreviewDialog";
import { useAuth } from "@/components/AuthProvider";
import { RankMark } from "@/components/RankMark";
import { MIN_RANKED_ACCURACY } from "@/utils/ranking";

type Board = "snippet" | "timed";

function displayName(run: CloudRun, profiles: Map<string, CloudProfile>): string {
  const profile = profiles.get(run.userId);
  return profile?.displayName || profile?.githubUsername || `Typist ${run.userId.slice(0, 5)}`;
}

function cloudRunAsResult(run: CloudRun): RunResult {
  return {
    language: run.language, mode: run.mode, duration: run.mode === "timed" && run.durationSeconds ? run.durationSeconds * 1000 : run.durationMs, wpm: run.wpm, rawWpm: run.rawWpm,
    accuracy: run.accuracy, consistency: run.consistency, totalCorrect: run.correctChars, charsTyped: run.keystrokes,
    totalErrors: run.mistakes, snippetsCompleted: run.snippetsCompleted, timestamp: new Date(run.$createdAt).getTime(),
    perLineStats: [], errorPositions: [], sourceRepo: run.sourceRepo, snippetLength: run.snippetLength,
  };
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>("snippet");
  const [language, setLanguage] = useState("All");
  const [snippetLength, setSnippetLength] = useState<SnippetLength>("medium");
  const [duration, setDuration] = useState(30);
  const [runs, setRuns] = useState<CloudRun[]>([]);
  const [profiles, setProfiles] = useState<Map<string, CloudProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareOptions, setShareOptions] = useState<ShareCardOptions | null>(null);
  const languages = useMemo(() => getLanguages(), []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setErrorMessage("");
    void listLeaderboard({
      language,
      mode: board,
      snippetLength: board === "snippet" ? snippetLength : undefined,
      durationSeconds: board === "timed" ? duration : undefined,
      verifiedOnly: true,
    }).then(async (nextRuns) => {
      setRuns(nextRuns);
      const nextProfiles = await listProfiles(nextRuns.map((run) => run.userId));
      setProfiles(nextProfiles);
    }).catch((loadError) => {
      console.error("Unable to load leaderboard", loadError);
      setError(true);
      const message = loadError instanceof Error ? loadError.message : "";
      setErrorMessage(message.toLowerCase().includes("forbidden")
        ? `Appwrite has not allowed ${window.location.hostname} yet. Add this hostname as an Appwrite Web Platform.`
        : "Unable to load this leaderboard category. Try refreshing in a moment.");
    }).finally(() => setLoading(false));
  }, [board, language, snippetLength, duration]);

  const formatLabel = board === "snippet"
    ? `${snippetLength.charAt(0).toUpperCase()}${snippetLength.slice(1)} snippet`
    : `${duration}s timed`;
  const boardTitle = language === "All" ? `All Languages · ${formatLabel} ranking` : `${language} · ${formatLabel} ranking`;
  const podium = runs.slice(0, 3);
  const remaining = runs.slice(3);
  const podiumOrder = podium.length === 1 ? [podium[0]] : podium.length === 2 ? [podium[1], podium[0]] : [podium[1], podium[0], podium[2]];

  return (
    <div className="workspace-shell min-h-screen bg-background transition-colors duration-300">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Back to typing</Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Trophy className="size-3.5 text-amber-500" /> Hall of Speed</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">One best score per typist, per language and format.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-amber-500" />
            <span>Ranked Runs</span>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl border bg-card/65 p-1 backdrop-blur-sm" aria-label="Leaderboard category">
          {([
            ["snippet", "Snippet", Zap],
            ["timed", "Timed", Timer],
          ] as const).map(([value, label, Icon]) => (
            <button key={value} type="button" onClick={() => setBoard(value)} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold transition-all active:scale-[.98] sm:text-sm ${board === value ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4" /> <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="mb-6 flex flex-wrap items-center gap-3 border-b pb-5">
            <div className="mr-auto">
              <p className="text-sm font-bold">Choose category</p>
              <p className="text-xs text-muted-foreground">Scores only compete within the same language and format.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-10 min-w-44 rounded-lg border bg-card px-3 text-xs font-medium text-foreground" aria-label="Language">
                {languages.map((item) => <option key={item}>{item}</option>)}
              </select>
              <div className="flex flex-wrap gap-1 rounded-lg border bg-card/70 p-1">
                {board === "snippet"
                  ? (["short", "medium", "long"] as SnippetLength[]).map((item) => <button key={item} type="button" onClick={() => setSnippetLength(item)} className={`rounded-md px-3 py-2 text-xs font-medium capitalize transition-colors ${snippetLength === item ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{item}</button>)
                  : [15, 30, 60, 120].map((value) => <button key={value} type="button" onClick={() => setDuration(value)} className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${duration === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{value}s</button>)}
              </div>
            </div>
          </section>

        <div className="mb-4 flex items-end justify-between">
          <div><h2 className="text-xl font-bold">{boardTitle}</h2><p className="text-xs text-muted-foreground">Ranked by highest WPM · {MIN_RANKED_ACCURACY}% accuracy minimum</p></div>
          <Code2 className="size-5 text-muted-foreground" />
        </div>

        {loading ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70 px-5 text-center text-sm text-muted-foreground">{errorMessage}</div>
        ) : runs.length === 0 ? (
          <div className="grid h-80 place-items-center rounded-2xl border bg-card/70 px-5 text-center text-sm text-muted-foreground">No scores for {language} on this format yet. Claim the first rank.</div>
        ) : (
          <main className="animate-fade-in-up">
            <section className={`leaderboard-arena mb-6 grid items-end gap-3 px-3 pb-0 pt-12 sm:gap-5 sm:px-8 sm:pt-16 ${podiumOrder.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : podiumOrder.length === 2 ? "grid-cols-2 max-w-4xl mx-auto" : "grid-cols-3"}`} aria-label="Top three typists">
              <div className="leaderboard-arena-glyphs" aria-hidden="true"><span>{"{ 01 }"}</span><span>const top = speed;</span><span>⌁</span></div>
              {podiumOrder.map((run, position) => {
                const actualRank = podiumOrder.length === 1 ? 1 : podiumOrder.length === 2 ? (position === 0 ? 2 : 1) : (position === 0 ? 2 : position === 1 ? 1 : 3);
                const name = displayName(run, profiles);
                const profile = profiles.get(run.userId);
                const first = actualRank === 1;
                return (
                  <article key={run.$id} className={`podium-entry podium-rank-${actualRank} relative text-center ${first ? "is-champion" : ""}`}>
                    <div className="podium-beam" aria-hidden="true" />
                    <Link to={`/profile/${run.userId}`} className="podium-card relative block overflow-hidden rounded-2xl border backdrop-blur-sm">
                      <div className="podium-terminal flex items-center justify-between border-b px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><span>{first ? "// champion" : `// rank_0${actualRank}`}</span><span className="size-1.5 rounded-full bg-current opacity-50" /></div>
                      <div className="px-3 pb-5 pt-4 sm:px-5 sm:pt-5">
                        <div className="podium-avatar mx-auto mb-3 grid place-items-center overflow-hidden rounded-full bg-muted font-bold"><div className="size-full overflow-hidden rounded-full">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center">{name.slice(0, 1).toUpperCase()}</span>}</div></div>
                        <div className="mb-1 flex justify-center"><RankMark rank={actualRank} size="lg" /></div>
                        <p className="truncate text-xs font-bold sm:text-sm">{name}</p>
                        <div className="podium-speed mt-3 flex items-baseline justify-center gap-1.5"><strong className="tabular-nums">{run.wpm.toFixed(1)}</strong><span>WPM</span></div>
                        <div className="mx-auto mt-3 grid max-w-52 grid-cols-2 divide-x rounded-lg border bg-background/25 py-2 text-[9px] uppercase tracking-wider text-muted-foreground"><span><b className="block text-xs text-foreground">{run.accuracy.toFixed(1)}%</b>accuracy</span><span><b className="block truncate px-1 text-xs capitalize text-foreground">{run.language}</b>{run.snippetLength ?? (run.durationSeconds ? `${run.durationSeconds}s` : run.mode)}</span></div>
                      </div>
                    </Link>
                    {user?.$id === run.userId && <button type="button" onClick={() => setShareOptions({ result: cloudRunAsResult(run), username: profile?.githubUsername || name, heading: boardTitle, rank: actualRank })} className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full border bg-background/70 text-muted-foreground transition-colors hover:text-foreground" aria-label={`Share rank ${actualRank}`}><Share2 className="size-3" /></button>}
                    <div className="podium-base" aria-hidden="true"><span>0{actualRank}</span></div>
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
                    <span className="flex items-center"><RankMark rank={index + 4} size="sm" /></span>
                    <Link to={`/profile/${run.userId}`} className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-70"><div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted text-xs font-bold">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="text-[10px] text-muted-foreground">View profile</p></div></Link>
                    <div className="hidden min-w-0 sm:block"><p className="truncate text-xs font-medium">{run.language}</p><p className="text-[10px] text-muted-foreground">{run.snippetLength ?? run.mode}{run.durationSeconds ? ` · ${run.durationSeconds}s` : ""}</p></div>
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
