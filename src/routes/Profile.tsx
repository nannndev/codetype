import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, Cloud, CloudOff, ExternalLink, Flame, Gauge, GitBranch, LoaderCircle, Share2, Target, UserRound } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { githubUsernameFromUser, useAuth } from "@/components/AuthProvider";
import { getProfile, listUserRuns, type CloudProfile, type CloudRun } from "@/lib/cloud";
import { getStreak } from "@/utils/storage";
import type { ShareCardOptions } from "@/lib/share-result";
import { SharePreviewDialog } from "@/components/SharePreviewDialog";
import type { RunResult } from "@/types";

function cloudRunAsResult(run: CloudRun): RunResult {
  return {
    language: run.language,
    mode: run.mode,
    duration: run.mode === "timed" && run.durationSeconds ? run.durationSeconds * 1000 : run.durationMs,
    wpm: run.wpm,
    rawWpm: run.rawWpm,
    accuracy: run.accuracy,
    consistency: run.consistency,
    totalCorrect: run.correctChars,
    charsTyped: run.keystrokes,
    totalErrors: run.mistakes,
    snippetsCompleted: run.snippetsCompleted,
    timestamp: new Date(run.$createdAt).getTime(),
    perLineStats: [],
    errorPositions: [],
    sourceRepo: run.sourceRepo,
  };
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export default function Profile() {
  const { user, loading, configured, login, syncStatus } = useAuth();
  const { userId } = useParams();
  const viewedUserId = userId || user?.$id;
  const isOwnProfile = Boolean(user && viewedUserId === user.$id);
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [runs, setRuns] = useState<CloudRun[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareCardOptions | null>(null);
  const streak = useMemo(() => getStreak(), []);

  useEffect(() => {
    if (!viewedUserId) {
      setProfile(null);
      setRuns([]);
      return;
    }
    setDataLoading(true);
    void Promise.all([getProfile(viewedUserId), listUserRuns(viewedUserId)])
      .then(([nextProfile, nextRuns]) => {
        setProfile(nextProfile);
        setRuns(nextRuns);
      })
      .catch((error) => console.error("Unable to load cloud profile", error))
      .finally(() => setDataLoading(false));
  }, [viewedUserId, syncStatus]);

  const resolvedGithubUsername = profile?.githubUsername || (isOwnProfile && user ? githubUsernameFromUser(user) : undefined);

  const bestWpm = runs.length ? Math.max(...runs.map((run) => run.wpm)) : 0;
  const avgWpm = average(runs.map((run) => run.wpm));
  const avgAccuracy = average(runs.map((run) => run.accuracy));
  const favoriteLanguage = useMemo(() => {
    const counts = new Map<string, number>();
    runs.forEach((run) => counts.set(run.language, (counts.get(run.language) ?? 0) + 1));
    return Array.from(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [runs]);
  const bestRun = useMemo(() => [...runs].sort((a, b) => b.wpm - a.wpm)[0], [runs]);

  const syncLabel = syncStatus === "syncing" ? "Syncing local history" : syncStatus === "error" ? "Sync needs retry" : "Cloud history synced";
  const SyncIcon = syncStatus === "syncing" ? LoaderCircle : syncStatus === "error" ? CloudOff : Cloud;

  return (
    <div className="workspace-shell min-h-screen bg-background transition-colors duration-300">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to typing
        </Link>

        {!viewedUserId ? (
          <main className="mx-auto grid max-w-lg place-items-center rounded-2xl border bg-card/80 p-10 text-center backdrop-blur-sm">
            <div className="mb-5 grid size-16 place-items-center rounded-2xl border bg-muted/60"><UserRound className="size-7" /></div>
            <h1 className="text-2xl font-bold">Your Codey profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in with GitHub to sync this browser's history and enter the community leaderboard.</p>
            {configured && <Button className="mt-6" onClick={login} disabled={loading}><GitBranch data-icon="inline-start" /> Continue with GitHub</Button>}
          </main>
        ) : (
          <main className="animate-fade-in-up space-y-7">
            <section className="overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm">
              <div className="h-24 bg-gradient-to-r from-foreground/5 via-foreground/15 to-transparent" />
              <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="-mt-9 flex items-end gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-foreground text-2xl font-bold text-background">
                    {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="size-full object-cover" /> : (profile?.displayName || user?.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="pb-1">
                    <h1 className="text-2xl font-bold">{profile?.displayName || user?.name || "Code typist"}</h1>
                    {resolvedGithubUsername ? (
                      <a
                        href={`https://github.com/${resolvedGithubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
                      >
                        @{resolvedGithubUsername}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">{isOwnProfile ? user?.email : "Community typist"}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwnProfile && (
                    <div className="flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                      <SyncIcon className={`size-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} /> {syncLabel}
                    </div>
                  )}
                  {resolvedGithubUsername && (
                    <a
                      href={`https://github.com/${resolvedGithubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-full border bg-background/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <GitBranch className="size-3.5 text-foreground" />
                      <span>GitHub Profile</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  {bestRun && <button type="button" onClick={() => setShareOptions({ result: cloudRunAsResult(bestRun), username: resolvedGithubUsername || profile?.displayName || undefined, heading: "Codey profile highlight" })} className="flex items-center gap-2 rounded-full border bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-85"><Share2 className="size-3.5" /> Share profile stats</button>}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Best WPM", bestWpm.toFixed(1), Gauge],
                ["Avg. WPM", avgWpm.toFixed(1), Activity],
                ["Accuracy", `${avgAccuracy.toFixed(1)}%`, Target],
                ["Current streak", `${isOwnProfile ? Math.max(profile?.currentStreak ?? 0, streak.current) : profile?.currentStreak ?? 0}d`, Flame],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-xl border bg-card/80 p-4">
                  <Icon className="mb-4 size-4 text-muted-foreground" />
                  <div className="text-2xl font-bold tabular-nums">{String(value)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{String(label)}</div>
                </div>
              ))}
            </section>

            <div className="grid gap-4 md:grid-cols-[1fr_1.7fr]">
              <section className="rounded-xl border bg-card/80 p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cloud overview</p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Total runs</dt><dd className="font-bold tabular-nums">{runs.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Favorite language</dt><dd className="font-bold">{favoriteLanguage}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Best streak</dt><dd className="font-bold tabular-nums">{isOwnProfile ? Math.max(profile?.bestStreak ?? 0, streak.best) : profile?.bestStreak ?? 0} days</dd></div>
                  {resolvedGithubUsername && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">GitHub</dt>
                      <dd>
                        <a
                          href={`https://github.com/${resolvedGithubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-foreground transition-colors hover:underline"
                        >
                          @{resolvedGithubUsername}
                          <ExternalLink className="size-3" />
                        </a>
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between"><dt className="text-muted-foreground">Leaderboard status</dt><dd className="font-bold">Community</dd></div>
                </dl>
              </section>

              <section className="overflow-hidden rounded-xl border bg-card/80">
                <div className="border-b px-5 py-4"><h2 className="font-bold">Recent cloud runs</h2><p className="text-xs text-muted-foreground">Latest synced results</p></div>
                {dataLoading ? <div className="grid h-44 place-items-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div> : runs.length === 0 ? (
                  <div className="grid h-44 place-items-center px-6 text-center text-sm text-muted-foreground">No cloud runs yet. Finish a typing run or wait for local sync.</div>
                ) : runs.slice(0, 8).map((run) => (
                  <div key={run.$id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-5 py-3 last:border-0">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{run.language}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{run.mode} · {new Date(run.$createdAt).toLocaleDateString()}</p></div>
                    <div className="text-right"><p className="font-bold tabular-nums">{run.wpm.toFixed(1)}</p><p className="text-[10px] text-muted-foreground">WPM</p></div>
                    <div className="w-16 text-right"><p className="font-bold tabular-nums">{run.accuracy.toFixed(1)}%</p><p className="text-[10px] text-muted-foreground">ACC</p></div>
                  </div>
                ))}
              </section>
            </div>
          </main>
        )}
      </div>
      <Footer />
      <SharePreviewDialog options={shareOptions} onClose={() => setShareOptions(null)} />
    </div>
  );
}
