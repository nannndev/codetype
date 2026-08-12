import { useRef, useState } from "react";
import { FileUp, LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLanguages } from "@/data";
import type { Snippet } from "@/types";

const EXTENSIONS: Record<string, string> = {
  ts: "TypeScript", tsx: "React", js: "JavaScript", jsx: "React", py: "Python", rs: "Rust", go: "Go",
  php: "PHP", dart: "Dart", kt: "Kotlin", swift: "Swift", c: "C", h: "C", css: "CSS", sql: "SQL",
  yml: "YAML", yaml: "YAML", sh: "Bash", ex: "Elixir", exs: "Elixir", lua: "Lua", zig: "Zig",
};

function detectLanguage(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS[extension] ?? "Plain Text";
}

export function CustomPractice({ onLoad }: { onLoad: (snippet: Snippet) => void }) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState("practice.txt");
  const [language, setLanguage] = useState("Plain Text");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const languages = ["Plain Text", ...getLanguages().filter((item) => item !== "All")];

  const readFile = async (file: File) => {
    if (file.size > 100 * 1024) {
      setError("Maximum file size is 100 KB.");
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    setLanguage(detectLanguage(file.name));
    setCode(text.replace(/\r\n/g, "\n").slice(0, 100_000));
    setError("");
  };

  const start = () => {
    if (code.trim().length < 20) {
      setError("Add at least 20 characters of code.");
      return;
    }
    onLoad({ id: `custom-${Date.now()}`, filename, language, code: code.trimEnd(), sourceType: "custom" });
    setOpen(false);
  };

  if (!open) return <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><FileUp data-icon="inline-start" /> Practice your code</Button>;

  return (
    <section className="rounded-xl border bg-card/85 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold">Local custom practice</h2><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole className="size-3" /> Never uploaded, synced, or ranked.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button></div>
      <input ref={inputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); }} />
      <div className="mb-3 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><FileUp data-icon="inline-start" /> Upload file</Button><select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-8 rounded-md border bg-background px-3 text-xs">{languages.map((item) => <option key={item}>{item}</option>)}</select><input value={filename} onChange={(event) => setFilename(event.target.value)} className="h-8 min-w-40 flex-1 rounded-md border bg-background px-3 text-xs" aria-label="Filename" /></div>
      <textarea value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste code here, or upload any text-based source file..." className="min-h-48 w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed outline-none focus:ring-1 focus:ring-ring" />
      <div className="mt-3 flex items-center justify-between gap-3"><span className={`text-[11px] ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || `${code.length.toLocaleString()} characters · 100 KB max`}</span><Button type="button" size="sm" onClick={start}>Start local practice</Button></div>
    </section>
  );
}
