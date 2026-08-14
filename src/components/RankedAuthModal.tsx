import { ShieldAlert, GitBranch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

interface RankedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RankedAuthModal({ isOpen, onClose }: RankedAuthModalProps) {
  const { login, loading } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in required for Ranked Mode"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-card p-6 shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between gap-4">
          <div className="grid size-12 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <ShieldAlert className="size-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-bold text-foreground">Sign In Required for Ranked Mode</h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Ranked Matches require a GitHub account to record your score on the official <strong className="text-foreground">Ranked Leaderboard</strong>.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onClose();
              login();
            }}
            disabled={loading}
            className="bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400"
          >
            <GitBranch data-icon="inline-start" />
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
