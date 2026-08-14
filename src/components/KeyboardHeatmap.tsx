import { useState, useMemo } from "react";
import { KeyboardStatsMap, KeyStat, getStoredKeyStats } from "@/utils/keyboard-analytics";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardHeatmapProps {
  statsMap?: KeyboardStatsMap;
  onDrillKey?: (keyChar: string) => void;
}

const KEYBOARD_ROWS = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
  ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
  ["{", "}", "(", ")", "<", ">", "=", ";", ":", "$", "_"],
];

export function KeyboardHeatmap({ statsMap: externalStats, onDrillKey }: KeyboardHeatmapProps) {
  const stats = useMemo(() => externalStats || getStoredKeyStats(), [externalStats]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "code" | "weak">("all");

  const activeStat: KeyStat | null = selectedKey ? stats[selectedKey] || null : null;

  const keyList = useMemo(() => {
    return Object.values(stats).filter((s) => s.totalPresses > 0);
  }, [stats]);

  const weakKeys = useMemo(() => {
    return keyList.filter((s) => s.accuracy < 90).sort((a, b) => a.accuracy - b.accuracy);
  }, [keyList]);

  const codeSymbols = useMemo(() => {
    const symbolSet = new Set(["{", "}", "(", ")", "[", "]", "<", ">", "=", ";", ":", "$", "_", "-", "+", "/", "\\", "'", '"', "`"]);
    return keyList.filter((s) => symbolSet.has(s.key));
  }, [keyList]);

  function getKeyHeatStyle(keyChar: string) {
    const s = stats[keyChar];
    if (!s || s.totalPresses === 0) {
      return "border-border/40 bg-card/40 text-muted-foreground/50 opacity-60";
    }

    if (s.accuracy >= 95) {
      return "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:border-emerald-400";
    }

    if (s.accuracy >= 85) {
      return "border-amber-500/50 bg-amber-500/15 text-amber-400 font-bold hover:border-amber-400";
    }

    return "border-red-500/60 bg-red-500/20 text-red-400 font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse hover:border-red-400";
  }

  return (
    <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur-md shadow-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
            <Zap className="size-4 text-amber-500" />
            Interactive Keyboard Heatmap & Finger Accuracy
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time visual map of key accuracy and latency distribution across your typing runs.
          </p>
        </div>

        <div className="flex rounded-lg border bg-card/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${filterMode === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            All Keys
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("code")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${filterMode === "code" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            Code Symbols ({codeSymbols.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("weak")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${filterMode === "weak" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
          >
            Weak Keys ({weakKeys.length})
          </button>
        </div>
      </div>

      {/* Keyboard Grid Overlay */}
      <div className="space-y-2 overflow-x-auto pb-2 select-none">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5 min-w-[580px]">
            {row.map((char) => {
              const s = stats[char];
              const isSelected = selectedKey === char;
              const heatClass = getKeyHeatStyle(char);

              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => setSelectedKey(isSelected ? null : char)}
                  className={`relative flex size-10 flex-col items-center justify-center rounded-xl border text-xs transition-all duration-150 active:scale-95 sm:size-11 ${heatClass} ${
                    isSelected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105 z-10" : ""
                  }`}
                  title={`${char}: ${s ? `${s.accuracy}% accuracy (${s.totalPresses} presses)` : "No data"}`}
                >
                  <span className="font-mono text-sm">{char}</span>
                  {s && s.totalPresses > 0 && (
                    <span className="text-[9px] opacity-75 font-semibold">
                      {s.accuracy.toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-md bg-emerald-500/20 border border-emerald-500/50" />
            <span className="text-emerald-400 font-medium">≥ 95% High Accuracy</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-md bg-amber-500/20 border border-amber-500/50" />
            <span className="text-amber-400 font-medium">85% - 94% Moderate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-md bg-red-500/20 border border-red-500/50 animate-pulse" />
            <span className="text-red-400 font-medium">&lt; 85% Weak Key</span>
          </span>
        </div>

        {activeStat && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-foreground animate-fade-in">
            <div>
              <strong className="font-mono text-amber-400 text-sm">Key '{activeStat.key}'</strong>:{" "}
              <span>{activeStat.accuracy}% Accuracy</span> ·{" "}
              <span>{activeStat.totalPresses} Presses</span> ·{" "}
              <span>{activeStat.errors} Errors</span> ·{" "}
              <span>{activeStat.avgDelayMs}ms Avg Delay</span>
            </div>
            {onDrillKey && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDrillKey(activeStat.key)}
                className="h-7 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs"
              >
                Drill Key '{activeStat.key}'
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
