import { useMemo } from "react";
import { Crosshair, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyseWeakKeys, describeChar, type WeakKey } from "@/utils/weak-keys";
import { buildDrillSnippet } from "@/utils/drill";
import { getHistory } from "@/utils/storage";
import type { Snippet } from "@/types";

/** How many weak keys to show, and at most how many to drill at once. */
const SHOWN = 4;

function KeyRow({ item, max }: { item: WeakKey; max: number }) {
  const width = max > 0 ? Math.max(6, (item.rate / max) * 100) : 0;
  const label = describeChar(item.char);
  const isNamed = label.length > 1;
  const confusion = item.confusions[0];

  return (
    <div className="flex items-center gap-2.5">
      <code className={`grid h-6 shrink-0 place-items-center rounded border bg-muted font-mono ${isNamed ? "w-auto px-1.5 text-[9px] uppercase tracking-wide" : "w-6 text-xs font-bold"}`}>
        {label}
      </code>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground/70 transition-[width] duration-500" style={{ width: `${width}%` }} />
        </div>
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{item.errors}x</span>
      {confusion ? (
        <span className="hidden shrink-0 items-center gap-1 text-[10px] text-muted-foreground sm:flex">
          →<code className="rounded border bg-background px-1 font-mono">{describeChar(confusion.typed)}</code>
        </span>
      ) : (
        // Keeps the row grid aligned when a character has no recorded substitute.
        <span className="hidden w-[38px] shrink-0 sm:block" aria-hidden="true" />
      )}
    </div>
  );
}

export function WeakKeys({ refreshKey, onDrill }: { refreshKey?: number; onDrill: (snippet: Snippet) => void }) {
  const report = useMemo(() => analyseWeakKeys(getHistory()), [refreshKey]);

  const top = report.keys.slice(0, SHOWN);
  const drill = useMemo(() => buildDrillSnippet(top.map((item) => item.char)), [top]);

  if (!report.hasEnoughData) {
    return (
      <section className="rounded-xl border bg-card/55 p-4">
        <div className="mb-2 flex items-center gap-2"><Crosshair className="size-4" /><p className="text-sm font-bold">Weak keys</p></div>
        <p className="text-[10px] text-muted-foreground">
          {report.runsAnalysed === 0
            ? "Finish a few runs and the characters you miss most will show up here."
            : `Not enough data yet — ${report.totalErrors} error${report.totalErrors === 1 ? "" : "s"} across ${report.runsAnalysed} run${report.runsAnalysed === 1 ? "" : "s"}. Keep typing.`}
        </p>
      </section>
    );
  }

  const max = top[0]?.rate ?? 0;

  return (
    <section className="space-y-3 rounded-xl border bg-card/55 p-4">
      <div className="flex items-start gap-2">
        <Crosshair className="mt-0.5 size-4" />
        <div>
          <p className="text-sm font-bold">Weak keys</p>
          <p className="text-[10px] text-muted-foreground">By error rate across your last {report.runsAnalysed} run{report.runsAnalysed === 1 ? "" : "s"}.</p>
        </div>
      </div>

      <div className="space-y-2">
        {top.map((item) => <KeyRow key={item.char} item={item} max={max} />)}
      </div>

      {drill ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onDrill(drill)}>
          <Play data-icon="inline-start" /> Drill {drill.code.split("\n").length} lines
        </Button>
      ) : (
        <p className="text-[10px] text-muted-foreground">No drill available for these characters yet.</p>
      )}
      <p className="text-[9px] text-muted-foreground">Drill runs stay out of your history and stats.</p>
    </section>
  );
}
