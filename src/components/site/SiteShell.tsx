import { Link } from "@tanstack/react-router";
import { Compass, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { to: "/courses", label: "Courses" },
  { to: "/jobs", label: "Job Match" },
  { to: "/match", label: "Match Test" },
  { to: "/chat", label: "AI Assistant" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cjc-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : prefersDark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cjc-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-background/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="size-8 rounded-lg grid place-items-center bg-primary/20 text-primary ring-1 ring-primary/40 group-hover:bg-primary/30 transition group-hover:rotate-12 duration-300">
            <Compass className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            CourseandJobCompass
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="relative px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-md story-link"
              activeProps={{ className: "px-3 py-2 text-sm text-foreground bg-surface-2/60 rounded-md" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme} className="grid size-9 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition" aria-label={dark ? "Use light theme" : "Use dark theme"}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link to="/jobs" className="hidden sm:inline-flex items-center rounded-md bg-gradient-brand px-3 py-2 text-sm font-medium text-primary-foreground transition hover:shadow-[0_10px_30px_-12px_var(--glow)]">
            Find jobs
          </Link>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} className="md:hidden grid size-9 place-items-center rounded-md border border-border/60 text-muted-foreground" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {menuOpen && <nav className="md:hidden border-t border-border/40 bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-1">
          {links.map((l) => <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground">{l.label}</Link>)}
        </div>
      </nav>}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-muted-foreground flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
           <span className="font-display text-foreground">CourseandJobCompass</span> —
           helping Nigerian students turn education into a practical career path.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/courses" className="hover:text-foreground">Courses</Link>
          <Link to="/jobs" className="hover:text-foreground">Job Match</Link>
          <Link to="/chat" className="hover:text-foreground">AI Assistant</Link>
        </div>
      </div>
    </footer>
  );
}
