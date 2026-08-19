import { useState, useMemo } from "react";
import { KeyboardStatsMap, KeyStat, getStoredKeyStats, FINGER_MAP } from "@/utils/keyboard-analytics";
import { Zap, Flame, Hand, Gauge, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardHeatmapProps {
  statsMap?: KeyboardStatsMap;
  onDrillKey?: (keyChar: string) => void;
}

export function KeyboardHeatmap({ statsMap: externalStats, onDrillKey }: KeyboardHeatmapProps) {
  const stats = useMemo(() => externalStats || getStoredKeyStats(), [externalStats]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"accuracy" | "speed" | "finger">("accuracy");

  const activeStat: KeyStat | null = selectedKey ? stats[selectedKey] || null : null;

  const keyList = useMemo(() => {
    return Object.values(stats).filter((s) => s.totalPresses > 0);
  }, [stats]);

  const weakKeys = useMemo(() => {
    return keyList.filter((s) => s.accuracy < 92).sort((a, b) => a.accuracy - b.accuracy);
  }, [keyList]);

  // Color generator based on selected View Mode
  function getKeyStyle(keyChar: string) {
    const s = stats[keyChar];
    const fingerInfo = FINGER_MAP[keyChar];

    if (viewMode === "finger" && fingerInfo) {
      return {
        style: { backgroundColor: `${fingerInfo.color}25`, borderColor: fingerInfo.color, color: fingerInfo.color },
        text: fingerInfo.name.split(" ")[1] || fingerInfo.name,
      };
    }

    if (!s || s.totalPresses === 0) {
      return {
        className: "border-border/30 bg-card/30 text-muted-foreground/40 opacity-50",
        text: "-",
      };
    }

    if (viewMode === "speed") {
      if (s.avgDelayMs <= 100) {
        return {
          className: "border-cyan-500/60 bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]",
          text: `${s.avgDelayMs}ms`,
        };
      }
      if (s.avgDelayMs <= 160) {
        return {
          className: "border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold",
          text: `${s.avgDelayMs}ms`,
        };
      }
      return {
        className: "border-rose-500/60 bg-rose-500/20 text-rose-300 font-extrabold shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse",
        text: `${s.avgDelayMs}ms`,
      };
    }

    // Default: Accuracy view mode
    if (s.accuracy >= 95) {
      return {
        className: "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]",
        text: `${s.accuracy.toFixed(0)}%`,
      };
    }
    if (s.accuracy >= 85) {
      return {
        className: "border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold",
        text: `${s.accuracy.toFixed(0)}%`,
      };
    }
    return {
      className: "border-red-500/60 bg-red-500/25 text-red-300 font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse",
      text: `${s.accuracy.toFixed(0)}%`,
    };
  }

  return (
    <div className="rounded-3xl border bg-card/90 p-6 backdrop-blur-lg shadow-2xl space-y-6">
      {/* Header & Mode Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h3 className="flex items-center gap-2.5 text-lg font-black tracking-tight text-foreground">
            <Zap className="size-5 text-amber-500" />
            Interactive Keyboard Heatmap & Finger Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time physical key accuracy, speed latency (ms), and finger placement map.
          </p>
        </div>

        <div className="flex rounded-xl border bg-card/70 p-1 text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("accuracy")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "accuracy" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Target className="size-3.5 text-emerald-400" /> Accuracy Map
          </button>
          <button
            type="button"
            onClick={() => setViewMode("speed")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "speed" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Gauge className="size-3.5 text-cyan-400" /> Speed Latency
          </button>
          <button
            type="button"
            onClick={() => setViewMode("finger")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${viewMode === "finger" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Hand className="size-3.5 text-purple-400" /> Finger Zones
          </button>
        </div>
      </div>

      {/* Main Physical Keyboard Display */}
      <div className="space-y-2 overflow-x-auto pb-2 select-none">
        {/* Row 1: Numbers */}
        <div className="flex justify-center gap-1.5 min-w-[660px]">
          {["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="].map((char) => renderKeyTile(char))}
          {renderSpecialKeyTile("BACKSPACE", "Backspace", "w-16")}
        </div>

        {/* Row 2: QWERTY */}
        <div className="flex justify-center gap-1.5 min-w-[660px]">
          {renderSpecialKeyTile("TAB", "Tab ⇥", "w-12")}
          {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"].map((char) => renderKeyTile(char))}
        </div>

        {/* Row 3: ASDFGH */}
        <div className="flex justify-center gap-1.5 min-w-[660px]">
          {renderSpecialKeyTile("CAPS", "Caps", "w-14")}
          {["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"].map((char) => renderKeyTile(char))}
          {renderSpecialKeyTile("ENTER", "Enter ↵", "w-20")}
        </div>

        {/* Row 4: ZXCVBN */}
        <div className="flex justify-center gap-1.5 min-w-[660px]">
          {renderSpecialKeyTile("SHIFT_L", "Shift", "w-16")}
          {["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"].map((char) => renderKeyTile(char))}
          {renderSpecialKeyTile("SHIFT_R", "Shift", "w-20")}
        </div>

        {/* Row 5: Spacebar */}
        <div className="flex justify-center gap-1.5 min-w-[660px]">
          {renderSpecialKeyTile("CTRL_L", "Ctrl", "w-12")}
          {renderSpecialKeyTile("ALT_L", "Alt", "w-12")}
          {renderSpecialKeyTile("SPACE", "Spacebar", "w-64")}
          {renderSpecialKeyTile("ALT_R", "Alt", "w-12")}
          {renderSpecialKeyTile("CTRL_R", "Ctrl", "w-12")}
        </div>
      </div>

      {/* Weakest Keys & Detailed Stat Display Card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t pt-5">
        {/* Weak Keys Drill Panel */}
        <div className="rounded-2xl border bg-card/60 p-4 space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Flame className="size-4 text-amber-500" /> Keys Needing Practice ({weakKeys.length})
          </h4>
          {weakKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No weak keys detected! All pressed keys have $\ge 92\%$ accuracy.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakKeys.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onDrillKey?.(s.key)}
                  className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 font-bold hover:bg-red-500/20 transition-all"
                >
                  <span className="font-mono text-sm">{s.key}</span>
                  <span className="text-[10px] text-muted-foreground">{s.accuracy}% Acc</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Key Detail Card */}
        <div className="rounded-2xl border bg-card/60 p-4 space-y-2">
          {activeStat ? (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-mono font-black text-amber-400 text-lg">Key '{activeStat.key}'</span>
                {FINGER_MAP[activeStat.key] && (
                  <span className="rounded-md border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: FINGER_MAP[activeStat.key].color, color: FINGER_MAP[activeStat.key].color }}>
                    {FINGER_MAP[activeStat.key].name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border bg-muted/30 p-2">
                  <span className="block font-bold text-foreground">{activeStat.accuracy}%</span>
                  <span className="text-[10px] text-muted-foreground">Accuracy</span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2">
                  <span className="block font-bold text-foreground">{activeStat.avgDelayMs}ms</span>
                  <span className="text-[10px] text-muted-foreground">Avg Delay</span>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2">
                  <span className="block font-bold text-foreground">{activeStat.totalPresses}</span>
                  <span className="text-[10px] text-muted-foreground">Total Strikes</span>
                </div>
              </div>
              {onDrillKey && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onDrillKey(activeStat.key)}
                  className="w-full h-8 font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 text-xs mt-2"
                >
                  <Sparkles className="size-3.5" /> Launch Practice Drill for '{activeStat.key}'
                </Button>
              )}
            </div>
          ) : (
            <div className="grid h-28 place-items-center text-center text-xs text-muted-foreground">
              Click any key on the physical keyboard map above to inspect its accuracy, delay, and finger assignment.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderKeyTile(char: string) {
    const isSelected = selectedKey === char;
    const keyInfo = getKeyStyle(char);

    return (
      <button
        key={char}
        type="button"
        onClick={() => setSelectedKey(isSelected ? null : char)}
        style={keyInfo.style}
        className={`relative flex size-11 flex-col items-center justify-center rounded-xl border text-xs transition-all duration-150 active:scale-95 shadow-sm ${keyInfo.className || ""} ${
          isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background scale-105 z-10" : ""
        }`}
      >
        <span className="font-mono text-sm font-bold">{char}</span>
        {keyInfo.text && <span className="text-[9px] opacity-80 font-semibold">{keyInfo.text}</span>}
      </button>
    );
  }

  function renderSpecialKeyTile(keyId: string, label: string, widthClass: string) {
    const isSelected = selectedKey === keyId;
    const keyInfo = getKeyStyle(keyId);

    return (
      <button
        key={keyId}
        type="button"
        onClick={() => setSelectedKey(isSelected ? null : keyId)}
        style={keyInfo.style}
        className={`relative flex h-11 ${widthClass} flex-col items-center justify-center rounded-xl border text-[11px] font-bold transition-all duration-150 active:scale-95 shadow-sm ${keyInfo.className || "border-border/40 bg-card/40 text-muted-foreground/60"} ${
          isSelected ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background scale-105 z-10" : ""
        }`}
      >
        <span>{label}</span>
        {keyInfo.text && <span className="text-[8px] leading-none opacity-80 font-semibold">{keyInfo.text}</span>}
      </button>
    );
  }
}
