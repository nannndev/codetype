import { useMemo } from "react";
import { getDivisionInfo, calculateCodeIndex, type DivisionInfo } from "@/utils/division";
import { Braces, Crown, Flame, Gem, Shield, Sparkles } from "lucide-react";

interface DivisionBadgeProps {
  codeIndex?: number;
  bestWpm?: number;
  avgAccuracy?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function DivisionBadge({ codeIndex: explicitIndex, bestWpm, avgAccuracy, size = "md", showProgress = false }: DivisionBadgeProps) {
  const codeIndex = useMemo(() => {
    if (explicitIndex !== undefined) return explicitIndex;
    return calculateCodeIndex(bestWpm || 0, avgAccuracy || 0);
  }, [explicitIndex, bestWpm, avgAccuracy]);

  const info: DivisionInfo = useMemo(() => getDivisionInfo(codeIndex), [codeIndex]);

  const DivisionIcon = info.tier === "Legend"
    ? Flame
    : info.tier === "Diamond"
      ? Gem
      : info.tier === "Platinum"
        ? Shield
        : info.tier === "Gold"
          ? Crown
          : Braces;

  if (size === "sm") {
    return (
      <span className="division-plate" data-tier={info.tier.toLowerCase()} title={`${info.subRank} · ${info.codeIndex} Code Index Points`}>
        <span className="division-plate__icon"><DivisionIcon /></span>
        <span className="division-plate__copy"><b>{info.tier}</b><i>{info.subRank.replace(info.tier, "").trim()}</i></span>
      </span>
    );
  }

  if (size === "md") {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-xl border bg-gradient-to-r px-3 py-1 text-xs font-black shadow-md ${info.gradientClass}`}>
          <span className="text-sm">{info.badgeIcon}</span>
          <span>{info.subRank}</span>
        </span>
        <span className="text-xs font-bold text-muted-foreground font-mono tabular-nums">
          {info.codeIndex} Code Index
        </span>
      </div>
    );
  }

  // Large (Full Division Badge with Progress Bar)
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/80 p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`grid size-14 place-items-center rounded-2xl border bg-gradient-to-br text-2xl shadow-lg ${info.gradientClass}`}>
            {info.badgeIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Developer Division</span>
              <Sparkles className="size-3.5 text-amber-400" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground">{info.subRank}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              <strong className="text-foreground font-bold">{info.codeIndex}</strong> Code Index Points
            </p>
          </div>
        </div>

        {info.nextTier && showProgress && (
          <div className="w-full max-w-xs text-right sm:w-48">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5 font-semibold">
              <span>Next: {info.nextTier}</span>
              <span>{info.progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${info.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
