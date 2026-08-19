import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Heart, Pause, Play, RotateCcw, Sparkles, Timer, Trophy, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { usePreferences } from "@/components/PreferencesProvider";
import { useKeyboardSound } from "@/hooks";
import { scheduleKeyboardStatsSync } from "@/lib/keyboard-stats-cloud";
import { normalizePhysicalKey, recordPhysicalKeypressStats } from "@/utils/keyboard-analytics";

const LANES = ["A", "S", "D", "F", "J", "K", "L", ";"] as const;
const PATTERNS = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [0, 2, 1, 3, 4, 6, 5, 7],
  [0, 7, 1, 6, 2, 5, 3, 4],
  [0, 1, 0, 2, 3, 2, 4, 5, 4, 6, 7, 6],
] as const;

interface FallingKey {
  id: number;
  key: string;
  lane: number;
  spawnedAt: number;
  durationMs: number;
}

type GameState = "ready" | "running" | "paused" | "finished";

export default function Arcade() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const playSound = useKeyboardSound(preferences.keyboardSound, preferences.keyboardSoundProfile, preferences.keyboardSoundVolume, preferences.keyboardSoundTuning);
  const [gameState, setGameState] = useState<GameState>("ready");
  const [notes, setNotes] = useState<FallingKey[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [seconds, setSeconds] = useState(45);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(gameState);
  const notesRef = useRef<FallingKey[]>([]);
  const sequenceRef = useRef(0);
  const patternRef = useRef(0);
  const idRef = useRef(0);
  const lastKeyAtRef = useRef<number | null>(null);

  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => {
    if (gameState === "paused" || gameState === "finished") setNotes([]);
  }, [gameState]);

  const difficulty = useMemo(() => Math.min(4, 1 + Math.floor((45 - seconds) / 11)), [seconds]);

  const resetGame = useCallback(() => {
    setGameState("ready");
    setNotes([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(5);
    setSeconds(45);
    sequenceRef.current = 0;
    patternRef.current = Math.floor(Math.random() * PATTERNS.length);
    requestAnimationFrame(() => gameRef.current?.focus());
  }, []);

  const startGame = useCallback(() => {
    if (gameState === "paused") {
      setGameState("running");
      gameRef.current?.focus();
      return;
    }
    setNotes([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(5);
    setSeconds(45);
    sequenceRef.current = 0;
    patternRef.current = Math.floor(Math.random() * PATTERNS.length);
    setGameState("running");
    requestAnimationFrame(() => gameRef.current?.focus());
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "running") return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setGameState("finished");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "running") return;
    let spawnTimer = 0;
    let cancelled = false;
    const spawn = () => {
      if (cancelled || stateRef.current !== "running") return;
      const pattern = PATTERNS[patternRef.current];
      const lane = pattern[sequenceRef.current % pattern.length];
      sequenceRef.current += 1;
      if (sequenceRef.current % pattern.length === 0) patternRef.current = (patternRef.current + 1) % PATTERNS.length;
      const durationMs = Math.max(1750, 3400 - difficulty * 360);
      const note: FallingKey = { id: ++idRef.current, key: LANES[lane], lane, spawnedAt: performance.now(), durationMs };
      setNotes((current) => [...current, note]);
      window.setTimeout(() => {
        setNotes((current) => {
          if (!current.some((item) => item.id === note.id)) return current;
          setCombo(0);
          setLives((value) => {
            const next = value - 1;
            if (next <= 0) setGameState("finished");
            return Math.max(0, next);
          });
          setFlash("miss");
          window.setTimeout(() => setFlash(null), 130);
          return current.filter((item) => item.id !== note.id);
        });
      }, durationMs + 180);
      const beat = Math.max(260, 760 - difficulty * 105);
      spawnTimer = window.setTimeout(spawn, beat);
    };
    spawnTimer = window.setTimeout(spawn, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(spawnTimer);
    };
  }, [gameState, difficulty]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (gameState === "running") setGameState("paused");
      else if (gameState === "paused") setGameState("running");
      return;
    }
    if (event.key === "Enter" && (gameState === "ready" || gameState === "finished")) {
      startGame();
      return;
    }
    if (gameState !== "running") return;
    const pressed = event.key.toUpperCase();
    if (!LANES.includes(pressed as typeof LANES[number])) return;
    event.preventDefault();
    playSound(event.key);

    const now = performance.now();
    const candidate = [...notesRef.current]
      .filter((note) => note.key === pressed)
      .sort((a, b) => b.spawnedAt - a.spawnedAt)
      .find((note) => {
        const progress = (now - note.spawnedAt) / note.durationMs;
        return progress >= 0.68 && progress <= 1.08;
      });
    const isHit = Boolean(candidate);
    const physicalKey = normalizePhysicalKey(event.code, event.key, event.location);
    if (physicalKey) {
      recordPhysicalKeypressStats([{
        key: physicalKey,
        delayMs: lastKeyAtRef.current === null ? 0 : now - lastKeyAtRef.current,
        isError: !isHit,
      }], user?.$id);
      lastKeyAtRef.current = now;
      if (user?.$id) scheduleKeyboardStatsSync(user.$id, 2500);
    }

    if (!candidate) {
      setCombo(0);
      setScore((value) => Math.max(0, value - 25));
      setFlash("miss");
      window.setTimeout(() => setFlash(null), 130);
      return;
    }

    const progress = (now - candidate.spawnedAt) / candidate.durationMs;
    const precision = Math.max(0, 1 - Math.abs(0.9 - progress) * 3.5);
    setNotes((current) => current.filter((note) => note.id !== candidate.id));
    setCombo((value) => {
      const next = value + 1;
      setBestCombo((best) => Math.max(best, next));
      setScore((current) => current + Math.round(80 + precision * 70 + Math.min(next, 30) * 4));
      return next;
    });
    setFlash("hit");
    window.setTimeout(() => setFlash(null), 110);
  }, [gameState, playSound, startGame, user?.$id]);

  return (
    <div className="arcade-shell min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col px-4 py-5 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-70">
            <ArrowLeft className="size-4" /> Codey_
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Volume2 className="size-3.5" /> Sound follows keyboard preferences
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-5 lg:grid-cols-[180px_minmax(560px,1fr)_200px] xl:grid-cols-[200px_minmax(640px,1fr)_220px]">
          <aside className="order-2 grid grid-cols-3 gap-px border bg-border lg:order-1 lg:grid-cols-1 lg:self-start">
            {[
              ["Score", score.toLocaleString(), Trophy],
              ["Combo", `${combo}x`, Sparkles],
              ["Time", `${seconds}s`, Timer],
            ].map(([label, value, Icon]) => (
              <div key={String(label)} className="bg-background p-4 lg:p-5">
                <Icon className="mb-5 size-4 text-muted-foreground" />
                <p className="text-2xl font-black tabular-nums lg:text-3xl">{String(value)}</p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{String(label)}</p>
              </div>
            ))}
          </aside>

          <div
            ref={gameRef}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`arcade-stage order-1 relative min-h-[560px] overflow-hidden border outline-none lg:order-2 ${flash ? `is-${flash}` : ""}`}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
              <div><p className="text-sm font-black">CODE RAIN</p><p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Pattern engine · level {difficulty}</p></div>
              <div className="flex items-center gap-2">
                {gameState === "running" && <button type="button" onClick={() => setGameState("paused")} className="arcade-icon-button" aria-label="Pause arcade"><Pause className="size-4" /></button>}
                {(gameState === "paused" || gameState === "finished") && <button type="button" onClick={startGame} className="arcade-icon-button" aria-label="Resume arcade"><Play className="size-4" /></button>}
                <button type="button" onClick={resetGame} className="arcade-icon-button" aria-label="Reset arcade"><RotateCcw className="size-4" /></button>
              </div>
            </div>

            <div className="absolute inset-0 grid grid-cols-8 pt-16">
              {LANES.map((key) => <div key={key} className="border-r border-border/55 last:border-r-0" />)}
            </div>
            <div className="arcade-scanline" />
            {notes.map((note) => (
              <div
                key={note.id}
                className="arcade-note"
                style={{
                  left: `calc(${note.lane * 12.5}% + 6.25%)`,
                  animationDuration: `${note.durationMs}ms`,
                }}
              >
                <span>{note.key}</span>
              </div>
            ))}

            <div className="absolute inset-x-0 bottom-8 z-10 grid grid-cols-8 px-2">
              {LANES.map((key) => (
                <div key={key} className="mx-auto grid size-10 place-items-center border bg-background font-black shadow-[0_5px_0_var(--color-border)] sm:size-12">{key}</div>
              ))}
            </div>

            {gameState !== "running" && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-background/88 p-5 backdrop-blur-md">
                <div className="arcade-end-panel w-full max-w-xl border bg-background/92 p-6 shadow-[12px_12px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)] sm:p-8">
                  <div className="flex items-center justify-between border-b pb-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{gameState === "finished" ? "Session archived" : gameState === "paused" ? "System paused" : "Arcade protocol"}</p>
                    <span className="size-2 bg-foreground" />
                  </div>
                  <h1 className="mt-6 max-w-lg text-4xl font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl">{gameState === "finished" ? "Rain cleared." : "Catch the code rain."}</h1>
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {gameState === "finished"
                      ? "Run it again to chase a cleaner combo and faster patterns."
                      : "Strike falling keys inside the scan line. Patterns accelerate and mutate as your run develops."}
                  </p>
                  {gameState === "finished" && (
                    <div className="mt-7 grid grid-cols-2 border-y">
                      <div className="py-4"><p className="text-2xl font-black tabular-nums">{score.toLocaleString()}</p><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Final score</p></div>
                      <div className="border-l py-4 pl-5"><p className="text-2xl font-black tabular-nums">{bestCombo}x</p><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Best combo</p></div>
                    </div>
                  )}
                  <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={startGame} className="inline-flex items-center justify-center gap-2 border bg-foreground px-5 py-3 text-sm font-black text-background active:translate-y-px">
                      <Play className="size-4" /> {gameState === "paused" ? "Resume rain" : gameState === "finished" ? "Run again" : "Start arcade"}
                    </button>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">A S D F · J K L ;<br />Esc pauses · Enter starts</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="order-3 space-y-4 lg:self-start">
            <div className="border p-5">
              <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lives</span><span className="text-xs text-muted-foreground">miss limit</span></div>
              <div className="mt-4 flex gap-2">{Array.from({ length: 5 }, (_, index) => <Heart key={index} className={`size-5 ${index < lives ? "fill-foreground text-foreground" : "text-border"}`} />)}</div>
            </div>
            <div className="border p-5 text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">Private telemetry</p>
              <p className="mt-2">Arcade stays outside ranked WPM. Only physical-key accuracy contributes to your private heatmap.</p>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
