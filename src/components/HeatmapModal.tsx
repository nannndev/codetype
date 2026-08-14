import { Zap, X } from "lucide-react";
import { KeyboardHeatmap } from "@/components/KeyboardHeatmap";

interface HeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDrillKey?: (keyChar: string) => void;
}

export function HeatmapModal({ isOpen, onClose, onDrillKey }: HeatmapModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Heatmap & Finger Analytics"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <Zap className="size-5 text-amber-500" />
            <span>Keyboard Heatmap & Finger Accuracy</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <KeyboardHeatmap
          onDrillKey={(key) => {
            if (onDrillKey) onDrillKey(key);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
