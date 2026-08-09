import { useRef } from "react";
import {
  ChevronDown,
  CloudDownload,
  Code2,
  Database,
  LayoutGrid,
} from "lucide-react";
import {
  siC,
  siCss,
  siDart,
  siDocker,
  siElixir,
  siFlutter,
  siGnubash,
  siGo,
  siGraphql,
  siJavascript,
  siKotlin,
  siLua,
  siPhp,
  siPython,
  siReact,
  siRust,
  siSwift,
  siTerraform,
  siTypescript,
  siYaml,
  siZig,
  type SimpleIcon,
} from "simple-icons";
import { cn } from "@/lib/utils";

interface LanguagePickerProps {
  languages: string[];
  selected: string;
  onSelect: (lang: string) => void;
  disabled: boolean;
  loading?: boolean;
}

const LANGUAGE_ICONS: Record<string, SimpleIcon> = {
  Bash: siGnubash,
  C: siC,
  CSS: siCss,
  Dart: siDart,
  Dockerfile: siDocker,
  Elixir: siElixir,
  Flutter: siFlutter,
  Go: siGo,
  GraphQL: siGraphql,
  JavaScript: siJavascript,
  Kotlin: siKotlin,
  Lua: siLua,
  PHP: siPhp,
  Python: siPython,
  React: siReact,
  Rust: siRust,
  Swift: siSwift,
  Terraform: siTerraform,
  TypeScript: siTypescript,
  YAML: siYaml,
  Zig: siZig,
};

function LanguageIcon({ language, className }: { language: string; className?: string }) {
  if (language === "All") return <LayoutGrid aria-hidden="true" className={className} />;
  if (language === "SQL") return <Database aria-hidden="true" className={className} />;

  const icon = LANGUAGE_ICONS[language];
  if (!icon) return <Code2 aria-hidden="true" className={className} />;

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}

export function LanguagePicker({ languages, selected, onSelect, disabled, loading = false }: LanguagePickerProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const selectLanguage = (language: string) => {
    onSelect(language);
    detailsRef.current?.removeAttribute("open");
  };

  return (
    <div className="relative z-30 flex items-center justify-between gap-4 rounded-xl border bg-card/65 px-3 py-2.5 backdrop-blur-sm">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Practice source</div>
        <div className="truncate text-xs text-muted-foreground">Choose the code ecosystem for the next run</div>
      </div>

      <details ref={detailsRef} className="group relative shrink-0">
        <summary
          className={cn(
            "flex h-10 min-w-36 list-none items-center gap-2 rounded-lg border bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden",
            disabled && "pointer-events-none opacity-50",
          )}
          aria-disabled={disabled}
        >
          <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <LanguageIcon language={selected} className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{selected}</span>
          {loading ? (
            <CloudDownload aria-label="Fetching source code" className="size-3.5 animate-pulse" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
          )}
        </summary>

        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 grid max-h-72 w-64 grid-cols-2 gap-1 overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
          {languages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => selectLanguage(language)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                language === selected && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              <LanguageIcon language={language} className="size-3.5 shrink-0" />
              <span className="truncate">{language}</span>
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
