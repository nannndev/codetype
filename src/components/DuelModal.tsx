import { useState, useEffect, useRef } from "react";
import { usePeerDuel } from "@/hooks/usePeerDuel";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Users,
  Copy,
  Check,
  Play,
  RotateCcw,
  X,
  Swords,
  History,
  Trophy,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getLanguages, getRandomSnippet } from "@/data";
import { computeWpm } from "@/utils/scoring";
import { useKeyboardSound } from "@/hooks/useKeyboardSound";
import { usePreferences } from "@/components/PreferencesProvider";
import { getDuelHistory, saveDuelRecord, getDuelStats, type DuelRecord } from "@/utils/duel-history";

interface DuelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuelModal({ isOpen, onClose }: DuelModalProps) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const playerName = user?.name || "Typist";
  
  const [activeTab, setActiveTab] = useState<"arena" | "history">("arena");
  const [history, setHistory] = useState<DuelRecord[]>([]);
  const [stats, setStats] = useState(getDuelStats());
  const savedRecordRef = useRef<boolean>(false);

  const playSound = useKeyboardSound(
    preferences.keyboardSound,
    preferences.keyboardSoundProfile,
    preferences.keyboardSoundVolume,
    preferences.keyboardSoundTuning
  );

  const {
    duelState,
    isHost,
    roomCode,
    connectionStatus,
    snippet,
    setSnippet,
    isReady,
    opponentReady,
    countdownSeconds,
    opponent,
    createRoom,
    joinRoom,
    toggleReady,
    startMatch,
    sendProgress,
    requestRematch,
    leaveDuel,
  } = usePeerDuel(playerName);

  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [myWpm, setMyWpm] = useState(0);
  const [myAcc, setMyAcc] = useState(100);
  const [myFinished, setMyFinished] = useState(false);
  const [myFinishTimeMs, setMyFinishTimeMs] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const languages = getLanguages();

  // Load history when modal opens
  useEffect(() => {
    if (isOpen) {
      setHistory(getDuelHistory());
      setStats(getDuelStats());
    }
  }, [isOpen]);

  // Reset local typing state when race starts
  useEffect(() => {
    if (duelState === "racing") {
      setTypedText("");
      setStartTime(Date.now());
      setMyWpm(0);
      setMyAcc(100);
      setMyFinished(false);
      setMyFinishTimeMs(null);
      savedRecordRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [duelState]);

  const isIWinner = myFinished && (!opponent.completed || (myFinishTimeMs && opponent.finishTimeMs && myFinishTimeMs < opponent.finishTimeMs));

  // Automatically save match result when completed
  useEffect(() => {
    if ((myFinished || opponent.completed) && !savedRecordRef.current && (myWpm > 0 || opponent.wpm > 0)) {
      savedRecordRef.current = true;
      const outcome = isIWinner ? "victory" : "defeat";
      const record: DuelRecord = {
        id: `duel-${Date.now()}`,
        timestamp: Date.now(),
        opponentName: opponent.name,
        myWpm,
        oppWpm: opponent.wpm,
        myAccuracy: myAcc,
        oppAccuracy: opponent.accuracy,
        language: snippet.language,
        outcome,
      };
      const updated = saveDuelRecord(record);
      setHistory(updated);
      setStats(getDuelStats());
    }
  }, [myFinished, opponent.completed, isIWinner, myWpm, opponent.wpm, myAcc, opponent.accuracy, snippet.language, opponent.name]);

  // Handle typing input
  function handleTypingChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (duelState !== "racing" || myFinished) return;

    const val = e.target.value;
    setTypedText(val);

    // Calculate metrics
    const elapsedMs = startTime ? Math.max(1000, Date.now() - startTime) : 1000;
    let correctCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === snippet.code[i]) correctCount++;
    }

    const currentWpm = computeWpm(correctCount, elapsedMs);
    const currentAcc = val.length === 0 ? 100 : Math.round((correctCount / val.length) * 100);
    const isCompleted = val === snippet.code;

    setMyWpm(currentWpm);
    setMyAcc(currentAcc);

    if (isCompleted && !myFinished) {
      setMyFinished(true);
      setMyFinishTimeMs(elapsedMs);
    }

    // Send real-time progress to opponent
    sendProgress({
      cursorIndex: val.length,
      wpm: currentWpm,
      accuracy: currentAcc,
      completed: isCompleted,
      finishTimeMs: isCompleted ? elapsedMs : undefined,
    });

    playSound(val.slice(-1) || "key");
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOpen) return null;

  const targetCode = snippet.code;
  const myProgressPercent = Math.min(100, Math.round((typedText.length / targetCode.length) * 100));
  const oppProgressPercent = Math.min(100, Math.round((opponent.cursorIndex / targetCode.length) * 100));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-lg animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="1v1 Live Real-time Code Race"
    >
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-card p-6 shadow-2xl space-y-6 animate-scale-in">
        {/* Header Navigation */}
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-amber-500 text-zinc-950 font-black text-xl shadow-lg">
              🤼
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight text-foreground flex items-center gap-2">
                1v1 REAL-TIME CODE RACE
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-500/30">P2P WEBRTC</span>
              </h3>
              <p className="text-xs text-muted-foreground">Compete live against a friend with zero-latency peer-to-peer connection.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border bg-card/70 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("arena")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${activeTab === "arena" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Swords className="size-3.5" /> Race Arena
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${activeTab === "history" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                <History className="size-3.5" /> History ({stats.total})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                leaveDuel();
                onClose();
              }}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ──── TAB 2: MATCH HISTORY & STATS ──── */}
        {activeTab === "history" && (
          <div className="space-y-5 animate-fade-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-card/60 p-4">
                <Trophy className="mb-2 size-4 text-amber-400" />
                <div className="text-2xl font-bold tabular-nums">{stats.wins} <span className="text-xs font-normal text-muted-foreground">/ {stats.total} W</span></div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Win Rate {stats.winRate}%</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4">
                <Flame className="mb-2 size-4 text-amber-500 animate-pulse" />
                <div className="text-2xl font-bold tabular-nums">{stats.currentStreak} 🔥</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Win Streak</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4">
                <Zap className="mb-2 size-4 text-sky-400" />
                <div className="text-2xl font-bold tabular-nums">{stats.bestWpm.toFixed(1)}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Best Duel WPM</div>
              </div>
              <div className="rounded-xl border bg-card/60 p-4">
                <Swords className="mb-2 size-4 text-purple-400" />
                <div className="text-2xl font-bold tabular-nums">{stats.losses}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Losses</div>
              </div>
            </div>

            {/* Past Matches List */}
            <div className="rounded-2xl border bg-card/80 overflow-hidden">
              <div className="border-b px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Head-to-Head Duel Match Log
              </div>
              {history.length === 0 ? (
                <div className="grid h-36 place-items-center text-xs text-muted-foreground">
                  No 1v1 duel history recorded yet. Create or join a race room to compete!
                </div>
              ) : (
                <div className="divide-y max-h-80 overflow-y-auto">
                  {history.map((record) => {
                    const isWin = record.outcome === "victory";
                    const wpmDiff = (record.myWpm - record.oppWpm).toFixed(1);
                    return (
                      <div key={record.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-xs">
                        <div className={`flex items-center gap-1 font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                          {isWin ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                          <span className="uppercase text-[11px] font-black">{record.outcome}</span>
                        </div>

                        <div>
                          <p className="font-bold text-foreground">vs {record.opponentName}</p>
                          <p className="text-[10px] text-muted-foreground">{record.language} · {new Date(record.timestamp).toLocaleDateString()}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-bold text-foreground tabular-nums">{record.myWpm.toFixed(1)} WPM</p>
                          <p className="text-[10px] text-muted-foreground">vs {record.oppWpm.toFixed(1)} WPM</p>
                        </div>

                        <div className={`text-right font-mono font-bold text-xs ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                          {isWin ? `+${wpmDiff}` : wpmDiff} WPM
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──── TAB 1: RACE ARENA ──── */}
        {activeTab === "arena" && (
          <>
            {/* ──── SCREEN 1: IDLE (JOIN OR CREATE) ──── */}
            {duelState === "idle" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center space-y-4">
                  <Swords className="size-12 text-amber-400 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-base text-foreground">Create Race Room</h4>
                    <p className="text-xs text-muted-foreground mt-1">Host a new race room and invite your opponent with a room code.</p>
                  </div>
                  <Button type="button" size="lg" onClick={() => void createRoom()} className="w-full font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950">
                    <Play data-icon="inline-start" /> Create Room
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl border bg-card/60 p-8 text-center space-y-4">
                  <Users className="size-12 text-sky-400" />
                  <div>
                    <h4 className="font-extrabold text-base text-foreground">Join Existing Race</h4>
                    <p className="text-xs text-muted-foreground mt-1">Enter your friend's 6-character room code to join the duel.</p>
                  </div>
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      placeholder="e.g. CODE-892"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter" && inputCode.trim()) {
                          void joinRoom(inputCode);
                        }
                      }}
                      className="flex-1 rounded-xl border bg-background px-3.5 text-center text-sm font-mono font-bold uppercase"
                    />
                    <Button
                      type="button"
                      size="lg"
                      disabled={!inputCode.trim()}
                      onClick={() => void joinRoom(inputCode)}
                      className="font-bold"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ──── SCREEN 2: LOBBY ──── */}
            {duelState === "lobby" && (
              <div className="space-y-6">
                {/* Room Link Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-amber-400 font-bold block">Room Code</span>
                    <span className="text-2xl font-black font-mono tracking-widest text-foreground">{roomCode}</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopyCode} className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                </div>

                {/* Language Selection (Host only) */}
                {isHost && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground">Select Language:</span>
                    <select
                      value={snippet.language}
                      onChange={(e) => {
                        const next = getRandomSnippet(e.target.value);
                        if (next) setSnippet(next);
                      }}
                      className="rounded-xl border bg-card px-3 py-1.5 text-xs font-bold text-foreground"
                    >
                      {languages.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Matchup Players Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-5 text-center space-y-3 ${isReady ? "border-emerald-500/60 bg-emerald-500/10" : "border-border"}`}>
                    <div className="grid size-14 place-items-center mx-auto rounded-2xl bg-amber-500 text-zinc-950 font-bold text-xl">
                      {playerName.slice(0, 1).toUpperCase()}
                    </div>
                    <h4 className="font-bold text-sm">{playerName} (You)</h4>
                    <Button type="button" variant={isReady ? "default" : "outline"} size="sm" onClick={toggleReady} className="w-full">
                      {isReady ? "READY ✓" : "Set Ready"}
                    </Button>
                  </div>

                  <div className={`rounded-2xl border p-5 text-center space-y-3 ${opponentReady ? "border-emerald-500/60 bg-emerald-500/10" : "border-border"}`}>
                    <div className="grid size-14 place-items-center mx-auto rounded-2xl bg-sky-500 text-zinc-950 font-bold text-xl">
                      {opponent.name.slice(0, 1).toUpperCase()}
                    </div>
                    <h4 className="font-bold text-sm">{opponent.name}</h4>
                    <div className={`text-xs font-bold py-1.5 rounded-lg border ${opponentReady ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/15" : "border-border text-muted-foreground"}`}>
                      {connectionStatus === "connected" ? (opponentReady ? "READY ✓" : "Waiting for ready...") : "Waiting for player..."}
                    </div>
                  </div>
                </div>

                {/* Start Race Button (Host only) */}
                {isHost && (
                  <Button
                    type="button"
                    size="lg"
                    disabled={!isReady || !opponentReady}
                    onClick={startMatch}
                    className="w-full font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 text-base"
                  >
                    <Play data-icon="inline-start" /> START 1v1 RACE NOW
                  </Button>
                )}
              </div>
            )}

            {/* ──── SCREEN 3: COUNTDOWN ──── */}
            {duelState === "countdown" && (
              <div className="grid h-64 place-items-center text-center space-y-3 animate-fade-in">
                <span className="text-7xl font-black text-amber-400 animate-ping">{countdownSeconds}</span>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">GET READY TO TYPE!</p>
              </div>
            )}

            {/* ──── SCREEN 4: RACING & RESULTS ──── */}
            {(duelState === "racing" || myFinished || opponent.completed) && (
              <div className="space-y-5">
                {/* Live Progress Bars */}
                <div className="space-y-3 rounded-2xl border bg-card/70 p-4">
                  {/* My Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-amber-400">🏎️ {playerName} (You)</span>
                      <span className="font-mono tabular-nums">{myWpm.toFixed(1)} WPM · {myAcc}% ACC</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-150" style={{ width: `${myProgressPercent}%` }} />
                    </div>
                  </div>

                  {/* Opponent Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-sky-400">🏎️ {opponent.name}</span>
                      <span className="font-mono tabular-nums">{opponent.wpm.toFixed(1)} WPM · {opponent.accuracy}% ACC</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full transition-all duration-150" style={{ width: `${oppProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* Target Snippet Display */}
                <div className="rounded-2xl border bg-background/60 p-4 font-mono text-sm leading-relaxed overflow-x-auto select-none">
                  {targetCode.split("").map((char, index) => {
                    let colorClass = "text-muted-foreground/40";
                    if (index < typedText.length) {
                      colorClass = typedText[index] === char ? "text-emerald-400 font-bold" : "text-red-500 bg-red-500/20 font-bold";
                    }
                    const isOpponentHere = index === opponent.cursorIndex;
                    return (
                      <span key={index} className={`relative ${colorClass}`}>
                        {char}
                        {isOpponentHere && <span className="absolute -top-3 left-0 text-[9px] text-sky-400 font-bold">▼</span>}
                      </span>
                    );
                  })}
                </div>

                {/* Typing Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={typedText}
                  disabled={myFinished}
                  onChange={handleTypingChange}
                  placeholder={myFinished ? "Race completed!" : "Type snippet code here..."}
                  className="w-full rounded-2xl border-2 border-amber-500/60 bg-background px-4 py-3 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Result Winner Banner */}
                {(myFinished || opponent.completed) && (
                  <div className={`rounded-2xl border p-5 text-center space-y-3 animate-scale-in ${isIWinner ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : "border-red-500/60 bg-red-500/15 text-red-400"}`}>
                    <h3 className="text-3xl font-black">{isIWinner ? "🏆 VICTORY!" : "💀 DEFEAT!"}</h3>
                    <p className="text-sm font-bold text-foreground">
                      Your Speed: <strong className="text-amber-400">{myWpm.toFixed(1)} WPM</strong> vs Opponent Speed: <strong className="text-sky-400">{opponent.wpm.toFixed(1)} WPM</strong>
                    </p>
                    <Button type="button" size="lg" onClick={requestRematch} className="font-bold bg-foreground text-background">
                      <RotateCcw data-icon="inline-start" /> Rematch
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
