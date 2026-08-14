import { ArrowLeft, Command, Maximize2, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { usePreferences, DEFAULT_SOUND_TUNING, type AppShortcut, type FontSize, type FontFamily, type CursorStyle, type EditorTheme, type KeyboardSoundProfile, type KeyboardSoundTuning, type SoundBaseProfile } from "@/components/PreferencesProvider";
import { Footer } from "@/components/Footer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getSettings, saveSettings } from "@/utils/storage";
import { useAuth } from "@/components/AuthProvider";
import { saveCloudGoals } from "@/lib/cloud";
import { useKeyboardSound } from "@/hooks";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  ...(["12", "14", "16", "18", "20", "22", "24"] as FontSize[]).map((value) => ({ value, label: `${value}px` })),
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

const EDITOR_THEMES: { value: EditorTheme; label: string; tone: string }[] = [
  { value: "codey", label: "Codey Mono", tone: "Balanced monochrome" },
  { value: "tokyo", label: "Tokyo Night", tone: "Deep navy · electric blue" },
  { value: "catppuccin", label: "Catppuccin", tone: "Soft mocha · lavender" },
  { value: "github", label: "GitHub Light", tone: "Bright · high clarity" },
  { value: "dracula", label: "Dracula", tone: "Dark violet · vivid tokens" },
];

const SHORTCUT_OPTIONS: Array<{ value: AppShortcut; label: string }> = [
  { value: "mod+r", label: "⌘/Ctrl + R" },
  { value: "mod+shift+r", label: "⌘/Ctrl + Shift + R" },
  { value: "mod+f", label: "⌘/Ctrl + F" },
  { value: "mod+shift+f", label: "⌘/Ctrl + Shift + F" },
  { value: "mod+enter", label: "⌘/Ctrl + Enter" },
];

const SOUND_PROFILES: Array<{ value: KeyboardSoundProfile; label: string; tone: string }> = [
  { value: "linear", label: "Linear", tone: "Smooth and light" },
  { value: "tactile", label: "Tactile", tone: "Soft bump" },
  { value: "clicky", label: "Clicky", tone: "Sharp switch click" },
  { value: "thock", label: "Thock", tone: "Deep and damped" },
  { value: "custom", label: "Custom", tone: "Tune it yourself" },
];

const SOUND_BASES: Array<{ value: SoundBaseProfile; label: string }> = SOUND_PROFILES
  .filter((profile): profile is typeof profile & { value: SoundBaseProfile } => profile.value !== "custom")
  .map(({ value, label }) => ({ value, label }));

const SOUND_KNOBS: Array<{ key: keyof Omit<KeyboardSoundTuning, "base">; label: string; low: string; high: string }> = [
  { key: "tone", label: "Tone", low: "deep", high: "bright" },
  { key: "click", label: "Click", low: "none", high: "sharp" },
  { key: "damping", label: "Damping", low: "tight", high: "ringy" },
  { key: "upstroke", label: "Upstroke", low: "none", high: "loud" },
];

export default function Settings() {
  const { preferences, setPreference } = usePreferences();
  const { user } = useAuth();
  const [settings, setSettings] = useState(getSettings);
  const previewSound = useKeyboardSound(true, preferences.keyboardSoundProfile, preferences.keyboardSoundVolume, preferences.keyboardSoundTuning);

  const previewTimers = useRef<number[]>([]);

  useEffect(() => () => {
    previewTimers.current.forEach(window.clearTimeout);
  }, []);

  const playPreview = () => {
    previewTimers.current.forEach(window.clearTimeout);
    previewTimers.current = [];
    // Uneven gaps on purpose — a fixed interval reads as a machine, not a typist.
    const keys = ["c", "o", "d", "e", "y", " ", "f", "a", "s", "t", "Enter"];
    const gaps = [0, 88, 71, 96, 64, 132, 78, 61, 84, 69, 150];
    let at = 0;
    keys.forEach((key, index) => {
      at += gaps[index];
      previewTimers.current.push(window.setTimeout(() => previewSound(key, true), at));
    });
  };

  const tuning = preferences.keyboardSoundTuning;
  const isCustom = preferences.keyboardSoundProfile === "custom";
  const isTuned = SOUND_KNOBS.some((k) => tuning[k.key] !== DEFAULT_SOUND_TUNING[k.key]);

  const updateTuning = <K extends keyof KeyboardSoundTuning>(key: K, value: KeyboardSoundTuning[K]) => {
    setPreference("keyboardSoundTuning", { ...tuning, [key]: value });
  };

  const selectProfile = (value: KeyboardSoundProfile) => {
    setPreference("keyboardSoundProfile", value);
    // Single keypress rather than the full phrase: picking a profile is a browse
    // action, and an 11-key run on every click gets tiring fast.
    previewSound("d", true);
  };

  const updateGoal = (key: keyof typeof settings.goals, rawValue: string) => {
    const value = Math.max(1, Math.round(Number(rawValue) || 1));
    const next = { ...settings, goals: { ...settings.goals, [key]: value } };
    setSettings(next);
    saveSettings(next);
    if (user) void saveCloudGoals(next.goals).catch((error) => console.error("Unable to sync daily goals", error));
  };

  const updateShortcut = (key: "restartShortcut" | "focusShortcut", value: AppShortcut) => {
    const otherKey = key === "restartShortcut" ? "focusShortcut" : "restartShortcut";
    if (preferences[otherKey] === value) setPreference(otherKey, preferences[key]);
    setPreference(key, value);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="mt-1 text-xs text-muted-foreground">Tune the editor without losing your typing flow.</p></div>

        <div className="grid items-start gap-5 animate-fade-in-up lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-5">
          <div className="space-y-3">
            <div><label className="text-xs uppercase tracking-wider text-muted-foreground">Editor Theme</label><p className="mt-1 text-xs text-muted-foreground">Independent from the app theme.</p></div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              {EDITOR_THEMES.map((theme) => (
                <button key={theme.value} type="button" onClick={() => setPreference("editorTheme", theme.value)} className={`overflow-hidden rounded-xl border text-left transition-all ${preferences.editorTheme === theme.value ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/35"}`}>
                  <div className="editor-theme-preview p-3" data-preview-theme={theme.value}>
                    <code className="block truncate text-[10px]"><span className="preview-keyword">const</span> <span className="preview-function">codey</span> <span className="preview-operator">=</span> <span className="preview-string">"fast"</span></code>
                  </div>
                  <div className="bg-card px-3 py-2"><p className="text-xs font-bold">{theme.label}</p><p className="truncate text-[9px] text-muted-foreground">{theme.tone}</p></div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border bg-card/55 p-4 sm:grid-cols-2">
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
                  className="h-8 min-w-11 rounded-md px-2 text-[10px] transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cursor</label>
            <ToggleGroup type="single" value={preferences.cursorStyle} onValueChange={(v) => v && setPreference("cursorStyle", v as CursorStyle)} className="justify-start gap-1">
              {CURSOR_OPTIONS.map((opt) => <ToggleGroupItem key={opt.value} value={opt.value} className="h-8 rounded-md px-3 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{opt.label}</ToggleGroupItem>)}
            </ToggleGroup>
          </div>

          {/* Font Family */}
          <div className="space-y-2 rounded-xl border bg-card/55 p-4">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Font Family</label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreference("fontFamily", opt.value)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
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

          </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border bg-card/70 p-4">
              <div className="mb-3 flex items-center gap-2"><Command className="size-4" /><div><p className="text-sm font-bold">Keyboard shortcuts</p><p className="text-[10px] text-muted-foreground">Modifier keys keep typing characters conflict-free.</p></div></div>
              <div className="space-y-2">
                {([[
                  "restartShortcut", "Restart run", RotateCcw,
                ], ["focusShortcut", "Toggle Focus Mode", Maximize2]] as const).map(([key, label, Icon]) => (
                  <label key={key} className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
                    <Icon className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 text-xs font-medium">{label}</span>
                    <select value={preferences[key]} onChange={(event) => updateShortcut(key, event.target.value as AppShortcut)} className="h-8 rounded-md border bg-card px-2 text-[10px] font-medium">
                      {SHORTCUT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span className="rounded-md bg-muted px-2 py-1.5"><kbd>Esc</kbd> exit focus / restart</span><span className="rounded-md bg-muted px-2 py-1.5"><kbd>Tab</kbd> indent / stop Zen</span><span className="rounded-md bg-muted px-2 py-1.5"><kbd>Enter</kbd> newline / retry result</span><span className="rounded-md bg-muted px-2 py-1.5"><kbd>Backspace</kbd> correct input</span></div>
            </section>

            <section className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm">👻</span>
                  <div>
                    <p className="text-sm font-semibold">Ghost Runner (PB Race)</p>
                    <p className="text-[10px] text-muted-foreground">Show ghost caret & real-time WPM pace relative to your PB.</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.ghostRunner}
                  onClick={() => setPreference("ghostRunner", !preferences.ghostRunner)}
                  className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${preferences.ghostRunner ? "bg-foreground" : "bg-muted"}`}
                >
                  <span className={`absolute top-1 size-5 rounded-full bg-background shadow-sm transition-transform ${preferences.ghostRunner ? "translate-x-5" : "translate-x-1"}`} />
                  <span className="sr-only">Toggle ghost runner</span>
                </button>
              </div>
            </section>

            <section className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">{preferences.keyboardSound ? <Volume2 className="mt-0.5 size-4" /> : <VolumeX className="mt-0.5 size-4 text-muted-foreground" />}<div><p className="text-sm font-semibold">Mechanical sound</p><p className="text-[10px] text-muted-foreground">Each key has a slightly different pitch.</p></div></div>
                <button type="button" role="switch" aria-checked={preferences.keyboardSound} onClick={() => setPreference("keyboardSound", !preferences.keyboardSound)} className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${preferences.keyboardSound ? "bg-foreground" : "bg-muted"}`}><span className={`absolute top-1 size-5 rounded-full bg-background shadow-sm transition-transform ${preferences.keyboardSound ? "translate-x-5" : "translate-x-1"}`} /><span className="sr-only">Toggle keyboard sound</span></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SOUND_PROFILES.map((sound) => <button key={sound.value} type="button" onClick={() => selectProfile(sound.value)} className={`rounded-lg border px-3 py-2 text-left transition-colors ${preferences.keyboardSoundProfile === sound.value ? "border-foreground bg-foreground text-background" : "bg-background/50 hover:bg-muted"} ${sound.value === "custom" ? "col-span-2" : ""}`}><span className="block text-xs font-bold">{sound.label}</span><span className={`text-[9px] ${preferences.keyboardSoundProfile === sound.value ? "text-background/65" : "text-muted-foreground"}`}>{sound.tone}</span></button>)}
              </div>

              {isCustom && (
                <div className="space-y-3 rounded-lg border border-dashed bg-background/40 p-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="sound-base" className="flex-1 text-[10px] text-muted-foreground">Start from</label>
                    <select id="sound-base" value={tuning.base} onChange={(event) => updateTuning("base", event.target.value as SoundBaseProfile)} className="h-7 rounded-md border bg-card px-2 text-[10px] font-medium">
                      {SOUND_BASES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button type="button" onClick={() => setPreference("keyboardSoundTuning", { ...DEFAULT_SOUND_TUNING, base: tuning.base })} disabled={!isTuned} className="rounded-md border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-muted disabled:opacity-40">Reset</button>
                  </div>
                  {SOUND_KNOBS.map((control) => (
                    <label key={control.key} className="block">
                      <span className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground"><span className="font-medium text-foreground">{control.label}</span><span className="tabular-nums">{tuning[control.key]}</span></span>
                      <input type="range" min="0" max="100" step="5" value={tuning[control.key]} onChange={(event) => updateTuning(control.key, Number(event.target.value))} onMouseUp={() => previewSound("d", true)} onKeyUp={() => previewSound("d", true)} onTouchEnd={() => previewSound("d", true)} className="h-1.5 w-full cursor-pointer accent-foreground" aria-label={`${control.label}: ${control.low} to ${control.high}`} />
                      <span className="mt-0.5 flex items-center justify-between text-[9px] text-muted-foreground"><span>{control.low}</span><span>{control.high}</span></span>
                    </label>
                  ))}
                </div>
              )}
              <label className="block rounded-lg border bg-background/50 px-3 py-2">
                <span className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>Volume</span><strong className="text-foreground tabular-nums">{preferences.keyboardSoundVolume}%</strong></span>
                <input type="range" min="0" max="100" step="5" value={preferences.keyboardSoundVolume} onChange={(event) => setPreference("keyboardSoundVolume", Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-foreground" aria-label="Keyboard sound volume" />
              </label>
              <button type="button" onClick={playPreview} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-medium transition-colors hover:bg-muted"><Play className="size-3.5" /> Preview {isCustom ? `custom · ${tuning.base}` : preferences.keyboardSoundProfile}</button>
            </section>

            <div className="space-y-3 rounded-xl border bg-card/55 p-4">
              <div><label className="text-xs uppercase tracking-wider text-muted-foreground">Daily goals</label><p className="mt-1 text-[10px] text-muted-foreground">{user ? "Synced across devices." : "Local until you sign in."}</p></div>
              <div className="grid grid-cols-3 gap-2">
                {([["runsPerDay", "Runs", settings.goals.runsPerDay], ["minutesPerDay", "Minutes", settings.goals.minutesPerDay], ["charsPerDay", "Chars", settings.goals.charsPerDay]] as const).map(([key, label, value]) => <label key={key} className="text-[10px] text-muted-foreground">{label}<input type="number" min="1" value={value} onChange={(event) => updateGoal(key, event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-xs font-semibold text-foreground" /></label>)}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
