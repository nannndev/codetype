import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Cloud, CloudOff, Gauge, Keyboard, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { KeyboardHeatmap } from "@/components/KeyboardHeatmap";
import { useAuth } from "@/components/AuthProvider";
import { getCloudKeyboardStats } from "@/lib/keyboard-stats-cloud";
import {
  getPendingKeyboardStats,
  getVisibleKeyStats,
  mergeStatsMaps,
  type KeyboardStatsMap,
} from "@/utils/keyboard-analytics";

export default function KeyboardAnalytics() {
  const { user } = useAuth();
  const [cloudStats, setCloudStats] = useState<KeyboardStatsMap | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.$id) {
      setCloudStats(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getCloudKeyboardStats()
      .then((stats) => {
        if (!cancelled) setCloudStats(stats);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.$id]);

  const stats = useMemo(() => {
    const local = getVisibleKeyStats(user?.$id);
    if (!user?.$id || !cloudStats) return local;
    const pending = getPendingKeyboardStats(user.$id)?.stats || {};
    return Object.keys(cloudStats).length || Object.keys(pending).length
      ? mergeStatsMaps(cloudStats, pending)
      : local;
  }, [cloudStats, user?.$id]);

  const summary = useMemo(() => {
    const keys = Object.values(stats).filter((stat) => stat.totalPresses > 0);
    const presses = keys.reduce((sum, stat) => sum + stat.totalPresses, 0);
    const errors = keys.reduce((sum, stat) => sum + stat.errors, 0);
    const delayTotal = keys.reduce((sum, stat) => sum + stat.totalDelayMs, 0);
    return {
      tracked: keys.length,
      accuracy: presses ? ((presses - errors) / presses) * 100 : 100,
      latency: presses ? Math.round(delayTotal / presses) : 0,
    };
  }, [stats]);

  return (
    <div className="workspace-shell min-h-screen bg-background">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Header />
        <main className="mt-8 space-y-6 animate-fade-in-up">
          <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Back to workspace
              </Link>
              <h2 className="flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
                <Keyboard className="size-8" /> Keyboard telemetry
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A permanent workspace for physical-key accuracy, response time, and finger-zone analysis. No typed content or raw key sequence is uploaded.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card/75 px-3 py-1.5 text-xs text-muted-foreground">
              {user ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />}
              {loading ? "Reading cloud telemetry..." : user ? "Cloud + this device" : "This device only"}
            </div>
          </div>

          <section className="grid grid-cols-3 border-y bg-card/35">
            {[
              ["Tracked keys", String(summary.tracked), Keyboard],
              ["Global accuracy", `${summary.accuracy.toFixed(1)}%`, Target],
              ["Average latency", `${summary.latency}ms`, Gauge],
            ].map(([label, value, Icon], index) => (
              <div key={String(label)} className={`p-4 sm:p-5 ${index > 0 ? "border-l" : ""}`}>
                <Icon className="mb-4 size-4 text-muted-foreground" />
                <p className="text-xl font-black tabular-nums sm:text-3xl">{String(value)}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{String(label)}</p>
              </div>
            ))}
          </section>

          <KeyboardHeatmap statsMap={stats} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
