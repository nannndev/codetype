import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CornerDownLeft, IndentIncrease, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeDisplay } from "@/components/CodeDisplay";
import { StatsBar } from "@/components/StatsBar";
import { ResultsScreen } from "@/components/ResultsScreen";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ModeSelector } from "@/components/ModeSelector";
import { Header } from "@/components/Header";
import { useGame } from "@/hooks";
import { useSnippets } from "@/hooks/useSnippets";
import { getLanguages } from "@/data";
import {
  computeCharStates,
  computeWpm,
  computeRawWpm,
  computeConsistency,
  computePerLineStats,
  saveResult,
  updateStreak,
} from "@/utils";
import type { TestMode, TimedDuration, RunResult } from "@/types";

export default function App() {
  const [language, setLanguage] = useState("All");
  const [mode, setMode] = useState<TestMode>("snippet");
  const [duration, setDuration] = useState<TimedDuration | null>(null);
  const { getRandomSnippet, loading: isLoadingSource } = useSnippets(language);

  const config = useMemo(() => ({ mode, duration }), [mode, duration]);
  const {
    snippet,
    input,
    status,
    elapsedMs,
    wpmSnapshots,
    handleKey: engineHandleKey,
    reset,
    stop,
    snippetsCompleted,
    secondsRemaining,
    keystrokes,
    mistakes,
    errorHistory,
    completedCorrectChars,
  } = useGame({ config, getSnippet: getRandomSnippet });

  const [result, setResult] = useState<RunResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousSelectionRef = useRef({ language, mode, duration });

  const focusWorkspace = useCallback(() => {
    requestAnimationFrame(() => containerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    focusWorkspace();
  }, [focusWorkspace]);

  useEffect(() => {
    const previous = previousSelectionRef.current;
    const selectionChanged = previous.language !== language
      || previous.mode !== mode
      || previous.duration !== duration;

    previousSelectionRef.current = { language, mode, duration };
    if (selectionChanged && (status === "idle" || status === "finished")) {
      setResult(null);
      reset();
      focusWorkspace();
    }
  }, [language, mode, duration, status, reset, focusWorkspace]);

  useEffect(() => {
    if (status === "finished" && keystrokes > 0) {
      const currentCorrect = [...input].filter((c, i) => c === snippet.code[i]).length;
      const correct = completedCorrectChars + currentCorrect;
      const wpm = computeWpm(correct, elapsedMs);
      const acc = keystrokes === 0 ? 100 : Math.round(((keystrokes - mistakes) / keystrokes) * 1000) / 10;
      const rawWpm = computeRawWpm(keystrokes, elapsedMs);
      const consistency = computeConsistency(wpmSnapshots);
      const perLineStats = config.mode === "snippet"
        ? computePerLineStats(snippet.code, input, errorHistory)
        : [];

      const r: RunResult = {
        snippetId: snippet.id,
        filename: snippet.filename,
        sourceRepo: snippet.source?.repo,
        language: snippet.language,
        wpm,
        accuracy: acc,
        duration: Math.round(elapsedMs),
        charsTyped: keystrokes,
        timestamp: Date.now(),
        mode: config.mode,
        rawWpm: rawWpm,
        consistency,
        totalErrors: mistakes,
        totalCorrect: correct,
        perLineStats,
        errorPositions: errorHistory,
        snippetsCompleted,
        targetChars: snippet.code.length,
      };
      setResult(r);
      try {
        saveResult(r);
        updateStreak();
      } catch {
        // localStorage may be unavailable
      }
    }
  }, [status, snippet, input, elapsedMs, wpmSnapshots, config.mode, snippetsCompleted, keystrokes, mistakes, errorHistory, completedCorrectChars]);

  const handleRetry = useCallback(() => {
    setResult(null);
    reset();
    focusWorkspace();
  }, [reset, focusWorkspace]);

  const handleNextSnippet = useCallback(() => {
    setResult(null);
    reset();
    focusWorkspace();
  }, [reset, focusWorkspace]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      focusWorkspace();
    },
    [focusWorkspace],
  );

  const handleModeChange = useCallback(
    (newMode: TestMode, newDuration: TimedDuration | null) => {
      setMode(newMode);
      setDuration(newDuration);
      focusWorkspace();
    },
    [focusWorkspace],
  );

  const handleZenStop = useCallback(() => {
    if (mode === "zen" && status === "running") {
      stop();
    }
  }, [mode, status, stop]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleRetry();
        return;
      }

      if (status === "finished") {
        if (e.key === "Enter") {
          e.preventDefault();
          handleRetry();
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        engineHandleKey(e.key);
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        engineHandleKey("Backspace");
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (mode === "zen" && status === "running") {
          stop();
          return;
        }
        engineHandleKey(" ");
        engineHandleKey(" ");
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        engineHandleKey("\n");
      }
    },
    [status, mode, engineHandleKey, handleRetry, stop],
  );

  const charStates = useMemo(() => computeCharStates(snippet.code, input), [snippet.code, input]);
  const accuracy = useMemo(
    () => keystrokes === 0 ? 100 : Math.round(((keystrokes - mistakes) / keystrokes) * 1000) / 10,
    [keystrokes, mistakes],
  );
  const correctChars = useMemo(
    () => completedCorrectChars + [...input].filter((c, i) => c === snippet.code[i]).length,
    [completedCorrectChars, input, snippet.code],
  );
  const wpm = useMemo(() => computeWpm(correctChars, elapsedMs), [correctChars, elapsedMs]);
  const progress = useMemo(
    () => {
      if (mode === "timed" && duration) {
        return Math.min(100, Math.max(0, ((duration - secondsRemaining) / duration) * 100));
      }
      if (mode === "zen") return 100;
      return Math.min(100, (input.length / snippet.code.length) * 100);
    },
    [input.length, snippet.code.length, mode, duration, secondsRemaining],
  );

  const languages = useMemo(() => getLanguages(), []);

  return (
    <div
      ref={containerRef}
      className="workspace-shell min-h-screen bg-background transition-colors duration-300 outline-none"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14">
        <Header />

        {result ? (
          <ResultsScreen result={result} onRetry={handleRetry} onNext={handleNextSnippet} />
        ) : (
          <main className="mt-8 flex flex-col gap-6 animate-scale-in">
            <ModeSelector
              mode={mode}
              duration={duration}
              onSelect={handleModeChange}
              disabled={status === "running"}
              isRunningZen={mode === "zen" && status === "running"}
              onStopZen={handleZenStop}
            />

            <StatsBar
              wpm={wpm}
              accuracy={accuracy}
              elapsedSeconds={elapsedMs / 1000}
              progress={progress}
              mode={mode}
              secondsRemaining={secondsRemaining}
              snippetsCompleted={snippetsCompleted}
              totalChars={input.length}
            />

            <LanguagePicker
              languages={languages}
              selected={language}
              onSelect={handleLanguageChange}
              disabled={status === "running"}
              loading={isLoadingSource}
            />

            <CodeDisplay
              chars={charStates}
              filename={snippet.filename ?? "snippet"}
              language={snippet.language}
              source={snippet.source}
              input={input}
              onClick={() => containerRef.current?.focus()}
            />

            <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleRetry} className="h-7 px-2 text-[11px]">
                  <RotateCcw data-icon="inline-start" /> Restart
                </Button>
                <span>
                  {status === "idle"
                    ? "Start typing to begin"
                    : mode === "zen"
                      ? "Zen mode — Tab to stop"
                      : "Keep typing..."}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Esc</kbd>
                <span>restart</span>
                <IndentIncrease aria-hidden="true" className="size-3.5" />
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Tab</kbd>
                <span>{mode === "zen" ? "stop" : "indent"}</span>
                <CornerDownLeft aria-hidden="true" className="ml-1 size-3.5" />
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono ml-1">Enter</kbd>
                <span>newline</span>
              </span>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
