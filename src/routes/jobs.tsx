import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase, MapPin, Loader2, Sparkles, Search, X, Plus, Globe2,
  Building2, ArrowUpRight, Wifi, LocateFixed,
} from "lucide-react";
import { searchJobsForCourse } from "@/lib/jobs.functions";
import { platformLinks, type JobSearchResult } from "@/lib/jobs-utils";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Job Match — Find Jobs For Your Course | CourseCompass" },
      {
        name: "description",
        content:
          "Search live jobs across multiple platforms matched to your Nigerian university course, your extra skills and your location — remote and on-site.",
      },
      { property: "og:title", content: "Job Match — Jobs For Your Course" },
      {
        property: "og:description",
        content: "Live job matches from several job boards, ranked by your course, skills and location.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

const SKILL_SUGGESTIONS = [
  "Excel", "SQL", "Python", "Graphic Design", "Content Writing", "Data Analysis",
  "Customer Support", "Digital Marketing", "Project Management", "Figma",
];

function JobsPage() {
  const [course, setCourse] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [locating, setLocating] = useState(false);

  const run = useServerFn(searchJobsForCourse);
  const mutation = useMutation({
    mutationFn: (): Promise<JobSearchResult> =>
      run({ data: { course, skills, location, remoteOnly } }) as Promise<JobSearchResult>,
  });

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s || skills.length >= 15 || skills.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    setSkills((p) => [...p, s]);
    setSkillDraft("");
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`,
          );
          const d = await r.json();
          setLocation([d.city || d.locality, d.countryName].filter(Boolean).join(", "));
        } catch {
          setLocation("");
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  const links = useMemo(
    () => platformLinks(mutation.data?.roles?.[0] || course || "graduate", location),
    [mutation.data, course, location],
  );

  const canSearch = course.trim().length > 1 && !mutation.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
          <Briefcase className="size-3.5" /> Live job matching
        </span>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight">
          Jobs that actually fit{" "}
          <span className="text-gradient-brand">your course and skills</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
          We pull live roles from several job platforms, then rank them against your degree, the extra
          skills you've picked up, and where you want to work.
        </p>
      </header>

      {/* Search panel */}
      <section className="mt-8 glass rounded-2xl p-5 sm:p-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Your course">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Statistics, Mass Communication…"
              className="input-field pl-10"
            />
          </Field>

          <Field label="Location">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos, Nigeria"
              className="input-field pl-10 pr-32"
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20 transition"
            >
              {locating ? <Loader2 className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5" />}
              Use my location
            </button>
          </Field>
        </div>

        {/* Skills */}
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Other skills you have
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="group inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs text-foreground animate-scale-in"
              >
                {s}
                <button onClick={() => setSkills((p) => p.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                  <X className="size-3 text-muted-foreground group-hover:text-destructive transition" />
                </button>
              </span>
            ))}
            <div className="relative">
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill(skillDraft);
                  }
                }}
                placeholder="Add a skill + Enter"
                className="rounded-full bg-surface-2/60 border border-border/60 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 w-44"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition hover-scale"
              >
                <Plus className="size-3" /> {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Remote only
          </label>
          <button
            onClick={() => canSearch && mutation.mutate()}
            disabled={!canSearch}
            className="relative overflow-hidden inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 transition hover:shadow-[0_10px_40px_-12px_var(--glow)]"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {mutation.isPending ? "Matching jobs…" : "Find my jobs"}
          </button>
        </div>
      </section>

      {/* Results */}
      {mutation.isPending && <SkeletonGrid />}

      {mutation.isError && (
        <p className="mt-6 text-sm text-destructive">
          Job search failed. Please wait a moment and try again.
        </p>
      )}

      {mutation.data && !mutation.isPending && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                {mutation.data.jobs.length} matched role{mutation.data.jobs.length === 1 ? "" : "s"}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mutation.data.roles.map((r) => (
                  <span key={r} className="rounded-full bg-surface-2/70 border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {mutation.data.notice && (
            <p className="mt-3 text-xs text-gold/90">{mutation.data.notice}</p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {mutation.data.jobs.map((j, i) => (
              <a
                key={j.id}
                href={j.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
                className="group glass rounded-xl p-4 hover:border-primary/60 transition-all hover:-translate-y-0.5 animate-fade-in opacity-0 [animation-fill-mode:forwards] flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium group-hover:text-primary transition">{j.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="size-3.5" /> {j.company}
                    </div>
                  </div>
                  <MatchRing score={j.score} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {j.remote ? <Wifi className="size-3.5 text-primary" /> : <MapPin className="size-3.5" />}
                    {j.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="size-3.5" /> {j.source}
                  </span>
                  {j.salary && <span className="text-gold">{j.salary}</span>}
                </div>

                <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{j.excerpt}</p>

                {j.matched.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {j.matched.map((m) => (
                      <span key={m} className="rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] text-gold">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs text-primary">
                  View & apply <ArrowUpRight className="size-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10 glass rounded-2xl p-5">
            <div className="text-sm font-medium">Keep searching on Nigerian & global platforms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-filled searches using your best-fit role and location.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.name}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs hover:border-primary/60 hover:text-primary transition hover-scale"
                >
                  {l.name} <ArrowUpRight className="size-3" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="relative mt-2">{children}</div>
    </label>
  );
}

function MatchRing({ score }: { score: number }) {
  return (
    <div
      className="relative size-11 shrink-0 rounded-full grid place-items-center text-[11px] font-semibold"
      style={{
        background: `conic-gradient(var(--primary) ${score * 3.6}deg, color-mix(in oklab, var(--surface-2) 80%, transparent) 0deg)`,
      }}
      title={`${score}% match`}
    >
      <span className="absolute inset-[3px] rounded-full bg-surface grid place-items-center">{score}</span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 shimmer h-36" />
      ))}
    </div>
  );
}
