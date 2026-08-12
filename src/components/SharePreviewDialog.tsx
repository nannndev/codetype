import { useEffect, useState } from "react";
import { Check, Download, LoaderCircle, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createResultCard, type ShareCardOptions } from "@/lib/share-result";

interface SharePreviewDialogProps {
  options: ShareCardOptions | null;
  onClose: () => void;
}

export function SharePreviewDialog({ options, onClose }: SharePreviewDialogProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "shared" | "error">("loading");

  useEffect(() => {
    if (!options) return;
    let active = true;
    setStatus("loading");
    void createResultCard(options).then((nextBlob) => {
      if (!active) return;
      setBlob(nextBlob);
      setPreviewUrl(URL.createObjectURL(nextBlob));
      setStatus("ready");
    }).catch(() => active && setStatus("error"));
    return () => {
      active = false;
      setBlob(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    };
  }, [options]);

  useEffect(() => {
    if (!options) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [options, onClose]);

  if (!options) return null;
  const filename = `codetype-${Math.round(options.result.wpm)}wpm.png`;
  const canNativeShare = typeof navigator.share === "function";

  const download = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], filename, { type: "image/png" });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      download();
      return;
    }
    try {
      await navigator.share({ files: [file], title: "CodeType stats", text: `${options.result.wpm.toFixed(1)} WPM on ${options.result.language}` });
      setStatus("shared");
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "AbortError") setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Share image preview" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5"><div><h2 className="text-sm font-bold">Share preview</h2><p className="text-[11px] text-muted-foreground">Preview the exact PNG before sharing.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close preview"><X className="size-4" /></button></div>
        <div className="grid min-h-64 place-items-center bg-muted/35 p-3 sm:p-6">
          {status === "loading" ? <LoaderCircle className="size-7 animate-spin text-muted-foreground" /> : previewUrl ? <img src={previewUrl} alt="Generated CodeType statistics card" className="max-h-[65vh] w-full rounded-xl border object-contain shadow-xl" /> : <p className="text-sm text-muted-foreground">Unable to generate preview.</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={download} disabled={!blob}><Download data-icon="inline-start" /> Download PNG</Button>
          <Button type="button" onClick={() => void share()} disabled={!blob}>{status === "shared" ? <Check data-icon="inline-start" /> : <Share2 data-icon="inline-start" />}{status === "shared" ? "Shared" : canNativeShare ? "Share image" : "Download image"}</Button>
        </div>
      </div>
    </div>
  );
}
