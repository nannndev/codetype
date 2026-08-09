import { useMemo } from "react";
import { Code2, ExternalLink, FileCode2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/components/PreferencesProvider";
import type { CharState } from "@/types";

interface CodeDisplayProps {
  chars: CharState[];
  filename: string;
  language: string;
  source?: { repo: string; url: string };
  input: string;
  onClick: () => void;
}

type CursorPref = "block" | "underline" | "line";

function BlockCursor({ char }: { char: string }) {
  return (
    <span className="rounded-[2px] bg-primary text-primary-foreground">
      {char === "\n" ? "↵\n" : char}
    </span>
  );
}

function UnderlineCursor({ char }: { char: string }) {
  return (
    <span className="border-b-[3px] border-primary pb-0.5">
      {char === "\n" ? "↵\n" : char}
    </span>
  );
}

function LineCursor({ char }: { char: string }) {
  return (
    <span className="relative">
      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary animate-[blink_1s_step-end_infinite]" />
      <span className="pl-1">{char === "\n" ? "↵\n" : char}</span>
    </span>
  );
}

const CURSOR_COMPONENTS: Record<CursorPref, React.FC<{ char: string }>> = {
  block: BlockCursor,
  underline: UnderlineCursor,
  line: LineCursor,
};

export function CodeDisplay({ chars, filename, language, source, input, onClick }: CodeDisplayProps) {
  const { preferences } = usePreferences();
  const cursorStyle = preferences.cursorStyle as CursorPref;
  const CursorComponent = CURSOR_COMPONENTS[cursorStyle];

  const lines = useMemo(() => {
    const result: CharState[][] = [];
    let current: CharState[] = [];
    for (const c of chars) {
      current.push(c);
      if (c.char === "\n") {
        result.push(current);
        current = [];
      }
    }
    if (current.length > 0) result.push(current);
    return result;
  }, [chars]);

  const currentLineIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < chars.length; i++) {
      if (chars[i].isCurrent) return count;
      if (chars[i].char === "\n") count++;
    }
    return -1;
  }, [chars]);

  const cursorCol = useMemo(() => {
    let lastNewline = -1;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === "\n") lastNewline = i;
    }
    return input.length - lastNewline;
  }, [input]);

  return (
    <div
      className="code-window overflow-hidden rounded-2xl border bg-card shadow-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow duration-200"
      onClick={onClick}
      tabIndex={0}
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 select-none">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-yellow-400/70" />
          <span className="size-2.5 rounded-full bg-green-400/70" />
        </div>
        <FileCode2 aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {filename}
        </span>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {language}
        </Badge>
      </div>

      {/* Code area */}
      <div className="min-w-0 overflow-x-auto py-4">
        <div className="min-w-max">
          {lines.map((line, li) => (
            <div key={li} className={cn("code-row", li === currentLineIndex && "is-current-line")}>
              <span className={cn("code-line-number", li === currentLineIndex && "is-current")}>{li + 1}</span>
              <div className="whitespace-pre px-4">
                {line.map((c, ci) =>
                  c.isCurrent ? (
                    <CursorComponent key={`${li}-${ci}`} char={c.char} />
                  ) : (
                    <span
                      key={`${li}-${ci}`}
                      className={cn(
                        "transition-colors duration-100",
                        c.status === "correct" && "text-emerald-600 dark:text-emerald-400",
                        c.status === "incorrect" && "text-red-500 bg-red-500/10 underline decoration-red-500",
                        c.status === "pending" && "text-muted-foreground/60",
                      )}
                    >
                      {c.char}
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground select-none">
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1.5 hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <GitBranch aria-hidden="true" className="size-3" />
            <span className="truncate">{source.repo}</span>
            <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
          </a>
        ) : (
          <span className="flex items-center gap-1.5"><Code2 aria-hidden="true" className="size-3" /> Built-in snippet</span>
        )}
        <span className="shrink-0">
          Ln {currentLineIndex + 1}, Col {cursorCol}
        </span>
      </div>
    </div>
  );
}
