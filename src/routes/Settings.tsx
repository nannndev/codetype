import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePreferences, type FontSize, type FontFamily, type CursorStyle } from "@/components/PreferencesProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
];

const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string; preview: string }[] = [
  { value: "jetbrains", label: "JetBrains Mono", preview: "const fn = () => {}" },
  { value: "fira", label: "Fira Code", preview: "const fn = () => {}" },
  { value: "cascadia", label: "Cascadia Code", preview: "const fn = () => {}" },
  { value: "source", label: "Source Code Pro", preview: "const fn = () => {}" },
];

const CURSOR_OPTIONS: { value: CursorStyle; label: string }[] = [
  { value: "block", label: "Block" },
  { value: "underline", label: "Underline" },
  { value: "line", label: "Line" },
];

export default function Settings() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-8">Settings</h1>

        <div className="space-y-8 animate-fade-in-up">
          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Font Size</label>
            <ToggleGroup
              type="single"
              value={preferences.fontSize}
              onValueChange={(v) => v && setPreference("fontSize", v as FontSize)}
              className="justify-start gap-1.5"
            >
              {FONT_SIZE_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-10 w-14 rounded-lg text-sm transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Font Family</label>
            <div className="space-y-1.5">
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreference("fontFamily", opt.value)}
                  className={`w-full text-left rounded-lg border p-4 transition-all duration-150 ${
                    preferences.fontFamily === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span
                    className="block text-xs text-muted-foreground mt-1"
                    style={{
                      fontFamily: `"${opt.label}", monospace`,
                      fontSize: "var(--code-font-size)",
                    }}
                  >
                    {opt.preview}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Style */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cursor Style</label>
            <ToggleGroup
              type="single"
              value={preferences.cursorStyle}
              onValueChange={(v) => v && setPreference("cursorStyle", v as CursorStyle)}
              className="justify-start gap-1.5"
            >
              {CURSOR_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-10 px-5 rounded-lg text-sm transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
