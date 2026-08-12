import { Link } from "react-router-dom";
import { BarChart3, LogIn, LogOut, Settings, Trophy, UserRound } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useAuth } from "./AuthProvider";

export function Header() {
  const { user, loading, configured, login, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        <div className="logo-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></div>
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
        {configured ? (
          user ? (
            <div className="flex items-center gap-1">
              <Button asChild type="button" variant="ghost" size="sm">
                <Link to="/profile" aria-label="Open profile">
                  <UserRound data-icon="inline-start" />
                  <span className="max-w-24 truncate">{user.name || "Profile"}</span>
                </Link>
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => void logout()} aria-label="Sign out" title="Sign out">
                <LogOut />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={login} disabled={loading}>
              <LogIn data-icon="inline-start" />
              {loading ? "Checking" : "GitHub"}
            </Button>
          )
        ) : null}
      </div>
    </header>
  );
}
