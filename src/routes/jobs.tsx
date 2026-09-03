import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase, MapPin, Loader2, Sparkles, Search, X, Plus, Globe2,
  Building2, ArrowUpRight, Wifi, LocateFixed, Bell, BellRing, SlidersHorizontal,
  RefreshCw, Clock, Flame,
} from "lucide-react";
import { searchJobsForCourse } from "@/lib/jobs.functions";
import {
  platformLinks, postedLabel, daysAgo, ALL_SOURCES,
  type JobSearchResult, type JobSource, type JobHit,
} from "@/lib/jobs-utils";
import {
  loadAlert, saveAlert, clearAlert, loadLastSearch, saveLastSearch,
  requestNotifyPermission, notifyNewJobs,
} from "@/lib/job-alerts";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
       { title: "Nigeria Job Match & Alerts | CourseandJobCompass" },
      {
        name: "description",
         content:
           "Find Nigeria-first jobs matched to your profession, university course, skills and location, with alerts for new opportunities.",
      },
       { property: "og:title", content: "Nigeria Job Match & Alerts — CourseandJobCompass" },
      {
        property: "og:description",
        content: "Live matches from five job boards, ranked by course, skills and location, with real-time job alerts.",
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

type SortKey = "match" | "recent";
const POLL_MS = 5 * 60_000;

function JobsPage() {
  const [course, setCourse] = useState("");
  const [profession, setProfession] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [locating, setLocating] = useState(false);

  // Filters
  const [sort, setSort] = useState<SortKey>("match");
  const [minScore, setMinScore] = useState(0);
  const [maxAge, setMaxAge] = useState(0); // 0 = any
  const [activeSources, setActiveSources] = useState<JobSource[]>(ALL_SOURCES);
  const [showFilters, setShowFilters] = useState(false);

  // Alerts
  const [alertOn, setAlertOn] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const run = useServerFn(searchJobsForCourse);
  const mutation = useMutation({
    mutationFn: (): Promise<JobSearchResult> =>
      run({ data: { course, profession, skills, location, remoteOnly, quiet: false } }) as Promise<JobSearchResult>,
    onSuccess: (d) => {
      seenRef.current = new Set(d.jobs.map((j) => j.id));
      setNewIds([]);
      setLastCheck(d.fetchedAt);
    saveLastSearch({ course, skills, location, remoteOnly });
    },
  });

  // Restore last search + alert config
  useEffect(() => {
    const last = loadLastSearch();
    if (last) {
      if (last.course) setCourse((c) => c || last.course!);
      if (last.skills?.length) setSkills((s) => (s.length ? s : last.skills!));
      if (last.location) setLocation((l) => l || last.location!);
      if (last.remoteOnly) setRemoteOnly(true);
    }
    const a = loadAlert();
    if (a?.enabled) {
      setAlertOn(true);
      seenRef.current = new Set(a.seen ?? []);
      setLastCheck(a.lastRun ?? null);
    }
  }, []);

  const jobs = mutation.data?.jobs ?? [];

  const checkForNew = useCallback(async () => {
    if (!course.trim()) return;
    try {
      const res = (await run({
        data: { course, profession, skills, location, remoteOnly, quiet: true },
      })) as JobSearchResult;
      const fresh = res.jobs.filter((j) => !seenRef.current.has(j.id) && j.score >= Math.max(minScore, 25));
      if (fresh.length) {
        notifyNewJobs(fresh);
        setNewIds((p) => [...new Set([...p, ...fresh.map((j) => j.id)])]);
        mutation.reset();
        // merge new results into view
        mutation.mutate();
      }
      res.jobs.forEach((j) => seenRef.current.add(j.id));
      setLastCheck(res.fetchedAt);
      saveAlert({
        course, skills, location, remoteOnly, minScore,
        enabled: true, seen: [...seenRef.current], lastRun: res.fetchedAt,
      });
    } catch {
      /* silent — alerts are best-effort */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, profession, skills, location, remoteOnly, minScore, run]);

  // Polling while alerts are on
  useEffect(() => {
    if (!alertOn) return;
    const id = setInterval(checkForNew, POLL_MS);
    return () => clearInterval(id);
  }, [alertOn, checkForNew]);

  const toggleAlerts = async () => {
    if (alertOn) {
      setAlertOn(false);
      clearAlert();
      setAlertMsg("Job alerts turned off.");
      return;
    }
    if (!course.trim()) {
      setAlertMsg("Enter your course first, then switch alerts on.");
      return;
    }
    const perm = await requestNotifyPermission();
    setAlertOn(true);
    saveAlert({
      course, skills, location, remoteOnly, minScore,
      enabled: true, seen: [...seenRef.current], lastRun: new Date().toISOString(),
    });
    setAlertMsg(
      perm === "granted"
        ? "Alerts on — we'll check every 5 minutes and pop a notification for new matches."
        : "Alerts on — notifications are blocked in your browser, so new matches will be flagged here with a NEW badge instead.",
    );
  };

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

  const visible = useMemo(() => {
    let list = jobs.filter((j) => activeSources.includes(j.source) && j.score >= minScore);
    if (maxAge > 0) list = list.filter((j) => (daysAgo(j.postedAt) ?? 999) <= maxAge);
    if (sort === "recent") {
      list = [...list].sort(
        (a, b) => new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime(),
      );
    }
    return list;
  }, [jobs, activeSources, minScore, maxAge, sort]);

  const links = useMemo(
    () => platformLinks(profession || mutation.data?.roles?.[0] || course || "graduate", location),
    [mutation.data, course, location],
  );

  const canSearch = course.trim().length > 1 && !mutation.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <header className="max-w-2xl">
         <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
           <Briefcase className="size-3.5" /> Nigeria-first job intelligence
        </span>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold leading-tight">
           Your next opportunity, matched to{" "}
           <span className="text-gradient-brand">your profession</span>
        </h1>
        <p className="mt-4 text-muted-foreground">
           Start with the work you want to do. We prioritise roles in Nigeria, then use your course,
           additional skills and location to rank relevant listings from live job sources.
        </p>
      </header>

      {/* Search panel */}
      <section className="mt-8 glass rounded-2xl p-5 sm:p-6 animate-fade-in">
         <div className="grid gap-4 md:grid-cols-3">
          <Field label="Target profession">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && mutation.mutate()}
              placeholder="e.g. Data analyst, nurse, designer"
              className="input-field pl-10"
            />
          </Field>
          <Field label="Your course">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSearch && mutation.mutate()}
               placeholder="e.g. Statistics, Mass Communication"
              className="input-field pl-10"
            />
          </Field>

          <Field label="Location">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
               placeholder="Nigeria, Lagos"
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
             {mutation.isPending ? "Matching Nigeria jobs…" : "Find my jobs"}
          </button>

          <button
            onClick={toggleAlerts}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition ${
              alertOn
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50"
            }`}
          >
            {alertOn ? <BellRing className="size-4 animate-pulse" /> : <Bell className="size-4" />}
            {alertOn ? "Alerts on" : "Notify me of new jobs"}
          </button>

          {alertOn && (
            <button
              onClick={checkForNew}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <RefreshCw className="size-3.5" /> Check now
              {lastCheck && <span className="opacity-70">· last {new Date(lastCheck).toLocaleTimeString()}</span>}
            </button>
          )}
        </div>
        {alertMsg && <p className="mt-3 text-xs text-muted-foreground">{alertMsg}</p>}
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
                {visible.length} matched role{visible.length === 1 ? "" : "s"}
                {newIds.length > 0 && (
                  <span className="ml-2 align-middle rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-[11px] text-gold">
                    {newIds.length} new
                  </span>
                )}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mutation.data.roles.map((r) => (
                  <span key={r} className="rounded-full bg-surface-2/70 border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border/60 overflow-hidden text-xs">
                {(["match", "recent"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`px-3 py-2 transition ${sort === k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {k === "match" ? <Flame className="inline size-3.5 mr-1" /> : <Clock className="inline size-3.5 mr-1" />}
                    {k === "match" ? "Best match" : "Newest"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <SlidersHorizontal className="size-3.5" /> Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 glass rounded-xl p-4 grid gap-4 sm:grid-cols-3 animate-fade-in">
              <label className="text-xs">
                <span className="text-muted-foreground">Minimum match: {minScore}%</span>
                <input
                  type="range" min={0} max={90} step={5} value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--primary)]"
                />
              </label>
              <label className="text-xs">
                <span className="text-muted-foreground">Posted within</span>
                <select
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="mt-2 w-full rounded-md bg-surface-2/60 border border-border/60 px-2 py-2 text-xs"
                >
                  <option value={0}>Any time</option>
                  <option value={3}>Last 3 days</option>
                  <option value={7}>Last week</option>
                  <option value={30}>Last month</option>
                </select>
              </label>
              <div className="text-xs">
                <span className="text-muted-foreground">Sources</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ALL_SOURCES.map((s) => {
                    const on = activeSources.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() =>
                          setActiveSources((p) => (on ? p.filter((x) => x !== s) : [...p, s]))
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          on ? "border-primary/50 bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {mutation.data.notice && (
            <p className="mt-3 text-xs text-gold/90">{mutation.data.notice}</p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {visible.map((j, i) => (
              <JobCard key={j.id} job={j} index={i} isNew={newIds.includes(j.id)} />
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              No roles pass your current filters — loosen the minimum match or date range.
            </p>
          )}

          <div className="mt-10 glass rounded-2xl p-5">
             <div className="text-sm font-medium">More places to find Nigerian opportunities</div>
            <p className="text-xs text-muted-foreground mt-1">
               Pre-filled searches using your profession and location.
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
            <p className="mt-4 text-[11px] text-muted-foreground">
               Live listings are sourced from Remotive, Jobicy, Arbeitnow,{" "}
              <a className="story-link" href="https://remoteok.com" target="_blank" rel="noopener">Remote OK</a>{" "}
              and The Muse.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function JobCard({ job: j, index, isNew }: { job: JobHit; index: number; isNew: boolean }) {
  return (
    <a
      href={j.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      className={`group glass rounded-xl p-4 transition-all hover:-translate-y-0.5 animate-fade-in opacity-0 [animation-fill-mode:forwards] flex flex-col ${
        isNew ? "border-gold/60 shadow-[0_0_0_1px_var(--gold)]" : "hover:border-primary/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium group-hover:text-primary transition">
            {j.title}
            {isNew && (
              <span className="ml-2 rounded-full bg-gold/20 border border-gold/40 px-1.5 py-0.5 text-[10px] text-gold align-middle">
                NEW
              </span>
            )}
          </div>
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
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {postedLabel(j.postedAt)}
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
