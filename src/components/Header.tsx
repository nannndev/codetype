import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Gamepad2, Heart, Keyboard, LogIn, LogOut, Palette, Settings, Swords, Trophy, UserRound, Users, Volume2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useAuth } from "./AuthProvider";
import { SoundPackModal } from "./SoundPackModal";
import { ThemeStudioModal } from "./ThemeStudioModal";

export function Header() {
  const { user, loading, configured, login, logout } = useAuth();
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="logo-mark" aria-hidden="true"><img src="/favicon.svg" alt="" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Codey<span className="text-primary">_</span></h1>
            <p className="text-sm text-muted-foreground mt-0.5">type real code, get faster</p>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <Link
          to="/duel"
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Open 1v1 Code Duel"
          title="1v1 Live Real-time Code Race"
        >
          <Swords className="size-[18px]" />
        </Link>
        <Link
          to="/arcade"
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Open Code Rain Arcade"
          title="Code Rain Arcade"
        >
          <Gamepad2 className="size-[18px]" />
        </Link>
        <button
          type="button"
          onClick={() => setShowThemeModal(true)}
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Open IDE Theme Studio"
          title="IDE Theme Studio & Syntax Highlighter"
        >
          <Palette className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={() => setShowSoundModal(true)}
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Open Sound Engine"
          title="Mechanical Switch Sound Engine"
        >
          <Volume2 className="size-[18px]" />
        </button>
        <Link
          to="/analytics/keyboard"
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Open keyboard analytics"
          title="Keyboard Analytics"
        >
          <Keyboard className="size-[18px]" />
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open leaderboard"
          title="Leaderboard"
        >
          <Trophy className="size-[18px] text-muted-foreground" />
        </Link>
        <Link
          to="/history"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open typing history"
          title="History"
        >
          <BarChart3 className="size-[18px] text-muted-foreground" />
        </Link>
        <Link
          to="/contributors"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="View contributors"
          title="Contributors"
        >
          <Users className="size-[18px] text-muted-foreground" />
        </Link>
        <Link
          to="/donate"
          className="rounded-md p-2 hover:bg-muted transition-colors text-amber-500 hover:text-amber-400"
          aria-label="Support & Donate"
          title="Donate / Support"
        >
          <Heart className="size-[18px] fill-current" />
        </Link>
        <Link
          to="/settings"
          className="rounded-md p-2 hover:bg-muted transition-colors"
          aria-label="Open settings"
          title="Settings"
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
      <SoundPackModal isOpen={showSoundModal} onClose={() => setShowSoundModal(false)} />
      <ThemeStudioModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
    </header>
  );
}
