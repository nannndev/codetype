import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Braces, CloudDownload } from "lucide-react";

interface LanguagePickerProps {
  languages: string[];
  selected: string;
  onSelect: (lang: string) => void;
  disabled: boolean;
  loading?: boolean;
}

export function LanguagePicker({ languages, selected, onSelect, disabled, loading = false }: LanguagePickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Braces aria-hidden="true" className="size-3" />
        Language
        {loading ? <CloudDownload aria-label="Fetching source code" className="ml-1 size-3 animate-pulse text-primary" /> : null}
      </span>
      <ToggleGroup
        type="single"
        value={selected}
        onValueChange={(v) => v && onSelect(v)}
        disabled={disabled}
        className="flex-wrap justify-start gap-1.5"
      >
        {languages.map((lang) => (
          <ToggleGroupItem
            key={lang}
            value={lang}
            className="h-9 px-4 text-xs rounded-lg transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            {lang}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
