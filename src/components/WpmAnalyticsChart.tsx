import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import type { CloudRun } from "@/lib/cloud";

interface WpmAnalyticsChartProps {
  runs: CloudRun[];
}

export function WpmAnalyticsChart({ runs }: WpmAnalyticsChartProps) {
  const sortedRuns = useMemo(() => {
    return [...runs].sort((a, b) => new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime());
  }, [runs]);

  const recentRuns = useMemo(() => sortedRuns.slice(-20), [sortedRuns]);

  const maxWpm = useMemo(() => {
    return recentRuns.length ? Math.max(...recentRuns.map((r) => r.wpm), 100) : 100;
  }, [recentRuns]);

  const minWpm = useMemo(() => {
    return recentRuns.length ? Math.min(...recentRuns.map((r) => r.wpm), 0) : 0;
  }, [recentRuns]);

  const avgWpm = useMemo(() => {
    if (!recentRuns.length) return 0;
    return recentRuns.reduce((sum, r) => sum + r.wpm, 0) / recentRuns.length;
  }, [recentRuns]);

  const avgAccuracy = useMemo(() => {
    if (!recentRuns.length) return 0;
    return recentRuns.reduce((sum, r) => sum + r.accuracy, 0) / recentRuns.length;
  }, [recentRuns]);

  // SVG Chart Dimensions
  const height = 180;
  const width = 600;
  const padding = 20;

  const points = useMemo(() => {
    if (recentRuns.length <= 1) return "";
    return recentRuns
      .map((run, i) => {
        const x = padding + (i / (recentRuns.length - 1)) * (width - padding * 2);
        const y = height - padding - ((run.wpm - minWpm) / (maxWpm - minWpm || 1)) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [recentRuns, maxWpm, minWpm]);

  return (
    <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
            <TrendingUp className="size-4 text-emerald-500" />
            WPM Performance Trajectory & Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Speed progression across your recent verified typing runs.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-xl border bg-background/50 px-3 py-1.5 text-center">
            <span className="text-[10px] text-muted-foreground block uppercase font-mono">Avg Speed</span>
            <strong className="text-sm font-bold text-foreground tabular-nums">{avgWpm.toFixed(1)} WPM</strong>
          </div>
          <div className="rounded-xl border bg-background/50 px-3 py-1.5 text-center">
            <span className="text-[10px] text-muted-foreground block uppercase font-mono">Avg Accuracy</span>
            <strong className="text-sm font-bold text-emerald-400 tabular-nums">{avgAccuracy.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {recentRuns.length < 2 ? (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed text-xs text-muted-foreground">
          Complete at least 2 typing runs to render your WPM speed curve chart.
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border bg-background/40 p-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio) => {
              const y = height - padding - ratio * (height - padding * 2);
              const value = (minWpm + ratio * (maxWpm - minWpm)).toFixed(0);
              return (
                <g key={ratio}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4 4" />
                  <text x={padding - 5} y={y + 3} fill="currentColor" opacity={0.4} fontSize={9} textAnchor="end">
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area Fill */}
            <defs>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {points && (
              <polygon
                points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                fill="url(#wpmGradient)"
              />
            )}

            {/* WPM Trend Line */}
            {points && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            )}

            {/* Data Points */}
            {recentRuns.map((run, i) => {
              const x = padding + (i / (recentRuns.length - 1)) * (width - padding * 2);
              const y = height - padding - ((run.wpm - minWpm) / (maxWpm - minWpm || 1)) * (height - padding * 2);
              return (
                <g key={run.$id || i} className="group cursor-pointer">
                  <circle cx={x} cy={y} r={4} fill="#10b981" stroke="#09090b" strokeWidth={2} />
                  <circle cx={x} cy={y} r={7} fill="#10b981" opacity={0.2} className="group-hover:opacity-60 transition-opacity" />
                  <title>{`${run.language} · ${run.wpm.toFixed(1)} WPM (${run.accuracy.toFixed(1)}%)`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
