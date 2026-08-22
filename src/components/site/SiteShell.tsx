import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

const links = [
  { to: "/courses", label: "Courses" },
  { to: "/jobs", label: "Job Match" },
  { to: "/match", label: "Match Test" },
  { to: "/chat", label: "AI Assistant" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-background/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="size-8 rounded-lg grid place-items-center bg-primary/20 text-primary ring-1 ring-primary/40 group-hover:bg-primary/30 transition group-hover:rotate-12 duration-300">
            <Compass className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            CourseCompass <span className="text-gold">NG</span>
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
        <Link
          to="/jobs"
          className="hidden sm:inline-flex items-center rounded-md bg-gradient-brand px-3 py-2 text-sm font-medium text-primary-foreground transition hover:shadow-[0_10px_30px_-12px_var(--glow)]"
        >
          Find jobs
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-muted-foreground flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <span className="font-display text-foreground">CourseCompass</span> —
          helping students understand their future before it's too late.
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
