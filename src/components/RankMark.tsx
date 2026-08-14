import { Award, Crown, Medal, Trophy } from "lucide-react";

interface RankMarkProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export function RankMark({ rank, size = "md" }: RankMarkProps) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  const isTopTen = rank > 3 && rank <= 10;

  const sizeClasses =
    size === "sm"
      ? "h-5.5 px-1.5 text-[10px] gap-1 rounded-md"
      : size === "md"
        ? "h-7 px-2.5 text-xs gap-1.5 rounded-lg"
        : "h-9 px-3.5 text-sm gap-1.5 rounded-xl";

  const iconSizes =
    size === "sm" ? "size-3" : size === "md" ? "size-3.5" : "size-4";

  if (isFirst) {
    return (
      <span
        className={`inline-flex items-center justify-center font-black tracking-tight bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-zinc-950 shadow-[0_0_16px_rgba(245,158,11,0.45)] border border-amber-200/90 transition-transform hover:scale-105 select-none ${sizeClasses}`}
        aria-label="Rank 1 Gold"
        title="Rank 1 Gold"
      >
        <Crown className={`${iconSizes} fill-current text-zinc-950`} />
        <span>1</span>
      </span>
    );
  }

  if (isSecond) {
    return (
      <span
        className={`inline-flex items-center justify-center font-black tracking-tight bg-gradient-to-br from-slate-100 via-slate-300 to-slate-450 text-slate-950 shadow-[0_0_14px_rgba(148,163,184,0.35)] border border-slate-100/90 transition-transform hover:scale-105 select-none ${sizeClasses}`}
        aria-label="Rank 2 Silver"
        title="Rank 2 Silver"
      >
        <Medal className={`${iconSizes} fill-current text-slate-950`} />
        <span>2</span>
      </span>
    );
  }

  if (isThird) {
    return (
      <span
        className={`inline-flex items-center justify-center font-black tracking-tight bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 shadow-[0_0_12px_rgba(217,119,6,0.35)] border border-amber-500/60 transition-transform hover:scale-105 select-none ${sizeClasses}`}
        aria-label="Rank 3 Bronze"
        title="Rank 3 Bronze"
      >
        <Award className={`${iconSizes} fill-current text-amber-200`} />
        <span>3</span>
      </span>
    );
  }

  if (isTopTen) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold tracking-tight bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 select-none ${sizeClasses}`}
        aria-label={`Rank ${rank}`}
      >
        <Trophy className={`${iconSizes} text-purple-500`} />
        <span>{rank}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-bold tracking-tight bg-muted/80 text-muted-foreground border border-border/50 select-none ${sizeClasses}`}
      aria-label={`Rank ${rank}`}
    >
      <span>#{rank}</span>
    </span>
  );
}
