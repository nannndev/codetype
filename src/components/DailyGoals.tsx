import { useEffect, useState } from "react";
import { ChevronDown, Cloud, Clock3, Keyboard, Target } from "lucide-react";
import { getDailyGoalProgress } from "@/utils/storage";
import { useAuth } from "@/components/AuthProvider";
import { getCloudDailyGoalProgress } from "@/lib/cloud";

function GoalRow({ icon: Icon, label, value, goal, suffix = "" }: { icon: typeof Target; label: string; value: number; goal: number; suffix?: string }) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 100;
  const displayValue = suffix === " min" ? Math.round(value * 10) / 10 : Math.round(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" />{label}</span>
        <span className="font-medium tabular-nums">{displayValue}{suffix} / {goal}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function DailyGoals({ refreshKey, compact = false }: { refreshKey?: number; compact?: boolean }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(getDailyGoalProgress);

  useEffect(() => {
    const local = getDailyGoalProgress();
    setProgress(local);
    if (!user) return;
    void getCloudDailyGoalProgress(user.$id)
      .then((cloud) => setProgress({ ...cloud, goals: getDailyGoalProgress().goals }))
      .catch(() => setProgress(local));
  }, [user, refreshKey]);
  const completed = [
    progress.runs >= progress.goals.runsPerDay,
    progress.minutes >= progress.goals.minutesPerDay,
    progress.chars >= progress.goals.charsPerDay,
  ].filter(Boolean).length;

  if (compact) return (
    <details className="group rounded-lg border bg-card/55">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[11px] text-muted-foreground marker:content-none">
        <span className="flex items-center gap-2"><Target className="size-3.5" /><strong className="text-foreground">Today</strong><span>{progress.runs}/{progress.goals.runsPerDay} runs · {Math.round(progress.minutes * 10) / 10}/{progress.goals.minutesPerDay} min · {progress.chars}/{progress.goals.charsPerDay} chars</span>{user && <Cloud className="size-3 text-muted-foreground" aria-label="Synced with Appwrite" />}</span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 border-t px-3 py-3 sm:grid-cols-3">
        <GoalRow icon={Target} label="Completed runs" value={progress.runs} goal={progress.goals.runsPerDay} />
        <GoalRow icon={Clock3} label="Practice time" value={progress.minutes} goal={progress.goals.minutesPerDay} suffix=" min" />
        <GoalRow icon={Keyboard} label="Characters typed" value={progress.chars} goal={progress.goals.charsPerDay} />
      </div>
    </details>
  );

  return (
    <section className="rounded-xl border bg-card/70 p-4 backdrop-blur-sm" aria-label="Today's goals">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold">Today&apos;s goals</p><p className="text-[10px] text-muted-foreground">{user ? "Synced with Appwrite" : "Local progress resets at midnight"}</p></div>
        <span className="rounded-full border px-2 py-1 text-[10px] font-medium tabular-nums">{completed}/3</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <GoalRow icon={Target} label="Completed runs" value={progress.runs} goal={progress.goals.runsPerDay} />
        <GoalRow icon={Clock3} label="Practice time" value={progress.minutes} goal={progress.goals.minutesPerDay} suffix=" min" />
        <GoalRow icon={Keyboard} label="Characters typed" value={progress.chars} goal={progress.goals.charsPerDay} />
      </div>
    </section>
  );
}
