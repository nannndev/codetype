import { Link } from "react-router-dom";
import { Heart, Star, Users } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="https://github.com/nannndev/codetype"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <GithubIcon className="size-4" />
            <span>Codey on GitHub</span>
          </a>
          <span className="text-border hidden sm:inline">&bull;</span>
          <Link
            to="/contributors"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Users className="size-3.5" />
            <span>Contributors</span>
          </Link>
          <span className="text-border hidden sm:inline">&bull;</span>
          <Link
            to="/donate"
            className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium transition-colors hover:text-amber-400"
          >
            <Heart className="size-3.5 fill-current" />
            <span>Donate</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/nannndev/codetype/stargazers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-amber-400/40"
          >
            <Star className="size-3.5" />
            <span>Star</span>
          </a>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Built by</span>
            <a
              href="https://github.com/nannndev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <img
                src="https://avatars.githubusercontent.com/u/72372613?v=4&s=40"
                alt="nannndev"
                className="size-5 rounded-full"
              />
              <span>nannndev</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
