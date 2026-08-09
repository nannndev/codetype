import { Link } from "react-router-dom";
import { BarChart3, Braces, Settings, Trophy } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        <div className="logo-mark" aria-hidden="true"><Braces /></div>
        <div>
        <h1 className="text-2xl font-bold tracking-tight">CodeType<span className="text-primary">_</span></h1>
        <p className="text-sm text-muted-foreground mt-0.5">type real code, get faster</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Link
          to="/leaderboard"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open leaderboard"
        >
          <Trophy className="size-[18px] text-muted-foreground" />
        </Link>
        <Link
          to="/history"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open typing history"
        >
          <BarChart3 className="size-[18px] text-muted-foreground" />
        </Link>
        <Link
          to="/settings"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open settings"
        >
          <Settings className="size-[18px] text-muted-foreground" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
