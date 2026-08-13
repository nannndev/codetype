import { useEffect, useMemo, useRef } from "react";
import { Code2, ExternalLink, FileCode2, GitBranch, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/components/PreferencesProvider";
import type { CharState } from "@/types";
import { tokenizeCode, type SyntaxToken } from "@/utils/syntax";

interface CodeDisplayProps {
  chars: CharState[];
  filename: string;
  language: string;
  source?: { repo: string; url: string };
  input: string;
  onClick: () => void;
}

type CursorPref = "block" | "underline" | "line";

function BlockCursor({ char, syntax }: { char: string; syntax: SyntaxToken }) {
  return (
    <span className={cn("rounded-[2px] bg-primary text-primary-foreground", `syntax-${syntax}`)}>
      {char === "\n" ? "↵\n" : char}
    </span>
  );
}

function UnderlineCursor({ char, syntax }: { char: string; syntax: SyntaxToken }) {
  return (
    <span className={cn("border-b-[3px] border-primary pb-0.5", `syntax-${syntax}`)}>
      {char === "\n" ? "↵\n" : char}
    </span>
  );
}

function LineCursor({ char, syntax }: { char: string; syntax: SyntaxToken }) {
  return (
    <span className="relative">
      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary animate-[blink_1s_step-end_infinite]" />
      <span className={cn("pl-1", `syntax-${syntax}`)}>{char === "\n" ? "↵\n" : char}</span>
    </span>
  );
}

const CURSOR_COMPONENTS: Record<CursorPref, React.FC<{ char: string; syntax: SyntaxToken }>> = {
  block: BlockCursor,
  underline: UnderlineCursor,
  line: LineCursor,
};

export function CodeDisplay({ chars, filename, language, source, input, onClick }: CodeDisplayProps) {
  const { preferences, setPreference } = usePreferences();
  const cursorStyle = preferences.cursorStyle as CursorPref;
  const CursorComponent = CURSOR_COMPONENTS[cursorStyle];
  const fontSizes = ["12", "14", "16", "18", "20", "22", "24"] as const;
  const fontIndex = fontSizes.indexOf(preferences.fontSize);
  const syntaxTokens = useMemo(() => tokenizeCode(chars.map((char) => char.char).join("")), [chars]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const lines = useMemo(() => {
    const result: Array<Array<{ state: CharState; syntax: SyntaxToken }>> = [];
    let current: Array<{ state: CharState; syntax: SyntaxToken }> = [];
    chars.forEach((state, index) => {
      current.push({ state, syntax: syntaxTokens[index] });
      if (state.char === "\n") {
        result.push(current);
        current = [];
      }
    });
    if (current.length > 0) result.push(current);
    return result;
  }, [chars, syntaxTokens]);

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

  useEffect(() => {
    const viewport = viewportRef.current;
    const cursor = cursorRef.current;
    if (!viewport || !cursor) return;

    const viewportRect = viewport.getBoundingClientRect();
    const cursorRect = cursor.getBoundingClientRect();
    const verticalPadding = Math.min(120, viewport.clientHeight * 0.32);
    const horizontalPadding = Math.min(180, viewport.clientWidth * 0.25);

    let top = viewport.scrollTop;
    let left = viewport.scrollLeft;
    if (cursorRect.top < viewportRect.top + verticalPadding) {
      top -= viewportRect.top + verticalPadding - cursorRect.top;
    } else if (cursorRect.bottom > viewportRect.bottom - verticalPadding) {
      top += cursorRect.bottom - (viewportRect.bottom - verticalPadding);
    }
    if (cursorRect.left < viewportRect.left + horizontalPadding) {
      left -= viewportRect.left + horizontalPadding - cursorRect.left;
    } else if (cursorRect.right > viewportRect.right - horizontalPadding) {
      left += cursorRect.right - (viewportRect.right - horizontalPadding);
    }

    viewport.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior: "instant" });
  }, [input, preferences.fontSize]);

  return (
    <div
      className="code-window overflow-hidden rounded-2xl border shadow-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow duration-200"
      onClick={onClick}
      tabIndex={0}
    >
      {/* Title bar */}
      <div className="code-chrome flex items-center gap-3 border-b px-4 py-2.5 select-none">
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
      <div ref={viewportRef} className="code-viewport min-w-0 overflow-auto py-4">
        <div className="min-w-max">
          {lines.map((line, li) => (
            <div key={li} className={cn("code-row", li === currentLineIndex && "is-current-line")}>
              <span className={cn("code-line-number", li === currentLineIndex && "is-current")}>{li + 1}</span>
              <div className="whitespace-pre px-4">
                {line.map(({ state: c, syntax }, ci) =>
                  c.isCurrent ? (
                    <span ref={cursorRef} className="inline-block"><CursorComponent key={`${li}-${ci}`} char={c.char} syntax={syntax} /></span>
                  ) : (
                    <span
                      key={`${li}-${ci}`}
                      className={cn(
                        "syntax-char transition-all duration-100",
                        `syntax-${syntax}`,
                        c.status === "correct" && "is-typed",
                        c.status === "incorrect" && "is-error",
                        c.status === "pending" && "is-pending",
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
      <div className="code-chrome flex items-center justify-between gap-4 border-t px-4 py-2 text-[10px] text-muted-foreground select-none">
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
        <div className="flex shrink-0 items-center gap-3">
          <span>Ln {currentLineIndex + 1}, Col {cursorCol}</span>
          <span className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <button type="button" disabled={fontIndex <= 0} onClick={() => setPreference("fontSize", fontSizes[fontIndex - 1])} className="grid size-6 place-items-center rounded hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Decrease editor font size"><Minus className="size-3" /></button>
            <span className="w-9 text-center font-bold text-foreground">{preferences.fontSize}px</span>
            <button type="button" disabled={fontIndex >= fontSizes.length - 1} onClick={() => setPreference("fontSize", fontSizes[fontIndex + 1])} className="grid size-6 place-items-center rounded hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Increase editor font size"><Plus className="size-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
