import { useMemo, useState } from "react";
import { Play, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyseWeakKeys, describeChar, type WeakKey } from "@/utils/weak-keys";
import { buildDrillSnippet, DRILL_PRESETS, buildPresetDrill } from "@/utils/drill";
import { getHistory } from "@/utils/storage";
import type { Snippet } from "@/types";

/** How many weak keys to show, and at most how many to drill at once. */
const SHOWN = 6;

function KeyRow({
  item,
  max,
  onDrillSingle,
}: {
  item: WeakKey;
  max: number;
  onDrillSingle: (char: string) => void;
}) {
  const width = max > 0 ? Math.max(8, (item.rate / max) * 100) : 0;
  const label = describeChar(item.char);
  const isNamed = label.length > 1;
  const confusion = item.confusions[0];

  return (
    <div className="flex items-center gap-2 group">
      <code className={`grid h-6 shrink-0 place-items-center rounded border bg-muted font-mono ${isNamed ? "w-auto px-1.5 text-[9px] uppercase tracking-wide" : "w-6 text-xs font-bold"}`}>
        {label}
      </code>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-purple-500/80 dark:bg-purple-400/80 transition-[width] duration-500" style={{ width: `${width}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{item.errors}x</span>
      {confusion ? (
        <span className="hidden shrink-0 items-center gap-1 text-[10px] text-muted-foreground sm:flex">
          →<code className="rounded border bg-background px-1 font-mono text-[10px]">{describeChar(confusion.typed)}</code>
        </span>
      ) : (
        <span className="hidden w-[38px] shrink-0 sm:block" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={() => onDrillSingle(item.char)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1 shrink-0"
        title={`Practice ONLY '${label}'`}
      >
        <Play className="size-2.5" /> Drill
      </button>
    </div>
  );
}

export function WeakKeys({ refreshKey, onDrill }: { refreshKey?: number; onDrill: (snippet: Snippet) => void }) {
  const report = useMemo(() => analyseWeakKeys(getHistory()), [refreshKey]);
  const [activeTab, setActiveTab] = useState<"auto" | "presets">("auto");

  const top = report.keys.slice(0, SHOWN);
  const mainDrill = useMemo(() => buildDrillSnippet(top.map((item) => item.char)), [top]);

  const handleDrillSingle = (char: string) => {
    const drill = buildDrillSnippet([char]);
    if (drill) onDrill(drill);
  };

  const handlePresetDrill = (presetId: string) => {
    const drill = buildPresetDrill(presetId);
    if (drill) onDrill(drill);
  };

  return (
    <section className="space-y-3.5 rounded-xl border bg-card/60 p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-purple-500" />
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5">
              Targeted Weak-Key Drill
              <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold text-purple-600 dark:text-purple-300">
                AI Match
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {report.runsAnalysed > 0
                ? `Analyzed error patterns from your last ${report.runsAnalysed} run${report.runsAnalysed === 1 ? "" : "s"}.`
                : "Complete runs to discover your weak keys automatically, or pick a preset below."}
            </p>
          </div>
        </div>

        <div className="flex rounded-md border bg-muted/60 p-0.5 text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            className={`rounded px-2.5 py-1 transition-colors ${activeTab === "auto" ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            My Weak Keys ({top.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`rounded px-2.5 py-1 transition-colors ${activeTab === "presets" ? "bg-background font-semibold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            Category Presets
          </button>
        </div>
      </div>

      {activeTab === "auto" ? (
        <div className="space-y-3">
          {top.length > 0 ? (
            <>
              <div className="space-y-2">
                {top.map((item) => (
                  <KeyRow key={item.char} item={item} max={top[0]?.rate ?? 0} onDrillSingle={handleDrillSingle} />
                ))}
              </div>

              {mainDrill && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  onClick={() => onDrill(mainDrill)}
                >
                  <Sparkles data-icon="inline-start" className="size-3.5" />
                  Drill Top {top.length} Weak Keys ({mainDrill.code.split("\n").length} lines)
                </Button>
              )}
            </>
          ) : (
            <div className="py-2 text-center text-xs text-muted-foreground">
              <p>No critical weak keys detected yet! Keep typing or practice a Category Preset.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DRILL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetDrill(preset.id)}
              className="flex flex-col gap-1 rounded-lg border bg-background/60 p-2.5 text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/5 group"
            >
              <div className="flex items-center justify-between">
                <code className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold group-hover:border-purple-500/40">
                  {preset.icon}
                </code>
                <Play className="size-3 text-muted-foreground group-hover:text-purple-500" />
              </div>
              <span className="text-xs font-semibold mt-1">{preset.name}</span>
              <span className="text-[9px] text-muted-foreground truncate">
                {preset.chars.join(" ")}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[9px] text-muted-foreground">
        Drill practice runs use real code syntax and stay out of history and stats.
      </p>
    </section>
  );
}
