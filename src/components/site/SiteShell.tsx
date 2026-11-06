import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const links = [
  { to: "/courses", label: "Courses" },
  { to: "/match", label: "Match Test" },
  { to: "/chat", label: "AI Assistant" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-16 sm:px-6 md:flex md:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2 group">
          <span className="size-8 rounded-lg grid place-items-center bg-primary/20 text-primary ring-1 ring-primary/40 group-hover:bg-primary/30 transition">
            <Compass className="size-4" />
          </span>
          <span className="truncate font-display text-base font-semibold sm:text-lg">
            CourseCompass
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
              activeProps={{ className: "rounded-md bg-accent px-3 py-2 text-sm font-medium text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/match">Find your course</Link>
          </Button>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-1.5 md:hidden">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="shrink-0 rounded-md px-3 py-2 text-xs text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            activeProps={{ className: "shrink-0 rounded-md bg-accent px-3 py-2 text-xs font-medium text-foreground" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-muted-foreground flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <span className="font-display text-foreground">CourseCompass</span> —
          helping students understand their future before it's too late.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/courses" className="hover:text-foreground">Courses</Link>
          <Link to="/chat" className="hover:text-foreground">AI Assistant</Link>
        </div>
      </div>
    </footer>
  );
}
