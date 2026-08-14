import { useState, useEffect, useMemo, useRef } from "react";
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
  FileCode2,
  Wifi,
  Radio,
} from "lucide-react";
import { getLanguages, getRandomSnippet } from "@/data";
import { computeWpm } from "@/utils/scoring";
import { useKeyboardSound } from "@/hooks/useKeyboardSound";
import { usePreferences } from "@/components/PreferencesProvider";
import { getDuelHistory, saveDuelRecord, getDuelStats, type DuelRecord } from "@/utils/duel-history";
import { tokenizeCode } from "@/utils/syntax";
import { cn } from "@/lib/utils";

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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
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
  function handleTypingChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
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

  const targetCode = snippet.code;
  const myProgressPercent = Math.min(100, Math.round((typedText.length / targetCode.length) * 100));
  const oppProgressPercent = Math.min(100, Math.round((opponent.cursorIndex / targetCode.length) * 100));
  const syntaxTokens = useMemo(() => tokenizeCode(targetCode), [targetCode]);
  const duelLines = useMemo(() => {
    const lines: Array<Array<{ char: string; index: number }>> = [];
    let current: Array<{ char: string; index: number }> = [];
    [...targetCode].forEach((char, index) => {
      current.push({ char, index });
      if (char === "\n") {
        lines.push(current);
        current = [];
      }
    });
    if (current.length > 0) lines.push(current);
    return lines;
  }, [targetCode]);

  useEffect(() => {
    if (duelState !== "racing") return;
    cursorRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [typedText.length, duelState]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/88 p-2 backdrop-blur-lg animate-fade-in sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="1v1 Live Real-time Code Race"
    >
      <div className="code-window w-full max-w-6xl max-h-[96vh] overflow-y-auto rounded-2xl border shadow-2xl animate-scale-in">
        {/* Header Navigation */}
        <div className="code-chrome sticky top-0 z-30 flex flex-col gap-3 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="editor-window-actions flex shrink-0 gap-1.5">
              <button type="button" onClick={() => { leaveDuel(); onClose(); }} className="editor-window-dot bg-red-400/80" aria-label="Close duel"><span>×</span></button>
              <span className="editor-window-dot bg-yellow-400/80" />
              <span className="editor-window-dot bg-green-400/80" />
            </div>
            <FileCode2 className="size-3.5 text-muted-foreground" />
            <div>
              <h3 className="font-mono text-xs font-bold tracking-tight text-foreground">duel://{roomCode || "new-session"}/{snippet.language.toLowerCase()}</h3>
              <p className="font-mono text-[9px] text-muted-foreground">peer session · shared snippet · first commit wins</p>
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

            <span className="hidden items-center gap-1.5 font-mono text-[9px] text-muted-foreground sm:flex"><Wifi className="size-3" /> {connectionStatus}</span>
            <button type="button" onClick={() => { leaveDuel(); onClose(); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">

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
              <div className="space-y-4">
                <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
                  {[
                    { label: `${playerName} / YOU`, wpm: myWpm, accuracy: myAcc, progress: myProgressPercent, tone: "amber" },
                    { label: opponent.name, wpm: opponent.wpm, accuracy: opponent.accuracy, progress: oppProgressPercent, tone: "sky" },
                  ].map((player) => (
                    <div key={player.label} className="bg-card/95 px-4 py-3">
                      <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px]">
                        <span className={player.tone === "amber" ? "text-amber-400" : "text-sky-400"}><Radio className="mr-1 inline size-3" />{player.label}</span>
                        <span className="tabular-nums text-muted-foreground"><b className="text-foreground">{player.wpm.toFixed(1)}</b> WPM · {player.accuracy}%</span>
                      </div>
                      <div className="h-1 overflow-hidden bg-muted"><div className={cn("h-full transition-[width] duration-150", player.tone === "amber" ? "bg-amber-400" : "bg-sky-400")} style={{ width: `${player.progress}%` }} /></div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border bg-background/70 shadow-xl" onClick={() => inputRef.current?.focus()}>
                  <div className="code-chrome flex items-center justify-between border-b px-4 py-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-2"><FileCode2 className="size-3" /> duel-snippet.{snippet.language.toLowerCase()}</span>
                    <span className="font-mono">{snippet.language} · {targetCode.length} chars</span>
                  </div>
                  <div className="max-h-[48vh] min-h-72 overflow-auto py-4" style={{ "--code-font-size": `${preferences.fontSize}px` } as React.CSSProperties}>
                    <div className="min-w-max">
                      {duelLines.map((line, lineIndex) => (
                        <div key={lineIndex} className={cn("code-row", line.some(({ index }) => index === typedText.length) && "is-current-line")}>
                          <span className={cn("code-line-number", line.some(({ index }) => index === typedText.length) && "is-current")}>{lineIndex + 1}</span>
                          <div className="whitespace-pre px-4">
                            {line.map(({ char, index }) => {
                              const typed = index < typedText.length;
                              const correct = typed && typedText[index] === char;
                              const isMine = index === typedText.length;
                              const isOpponent = index === opponent.cursorIndex;
                              return (
                                <span ref={isMine ? cursorRef : undefined} key={index} className={cn("syntax-char relative transition-colors duration-75", `syntax-${syntaxTokens[index] || "plain"}`, !typed && "is-pending", correct && "is-typed", typed && !correct && "is-error", isMine && "border-l-2 border-amber-400 pl-px")}>
                                  {isOpponent ? <span className="absolute -top-4 left-0 z-10 rounded-sm border border-sky-400/40 bg-sky-950/90 px-1 font-mono text-[7px] font-bold text-sky-300">P2</span> : null}
                                  {char}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="code-chrome flex items-center justify-between border-t px-4 py-2 font-mono text-[9px] text-muted-foreground">
                    <span>{myFinished ? "RUN COMPLETE" : "INSERT · typing broadcasts live"}</span>
                    <span>{typedText.length}/{targetCode.length} · {myProgressPercent}%</span>
                  </div>
                  <textarea
                    ref={inputRef}
                    value={typedText}
                    disabled={myFinished}
                    onChange={handleTypingChange}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (event.key === "Tab") {
                        event.preventDefault();
                        const nextValue = `${typedText}  `;
                        handleTypingChange({ target: { value: nextValue } } as React.ChangeEvent<HTMLTextAreaElement>);
                      }
                    }}
                    aria-label="Duel typing input"
                    className="sr-only"
                  />
                </div>

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
    </div>
  );
}
