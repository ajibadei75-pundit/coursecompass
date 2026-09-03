import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck, AlertTriangle, Briefcase, Code2, GraduationCap, Sparkles, Wallet } from "lucide-react";
import { getCourseProfile } from "@/lib/courses.functions";
import { titleFromSlug, type CourseProfile } from "@/lib/course-utils";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ params }) => {
    const name = titleFromSlug(params.slug);
    return {
      meta: [
         { title: `${name} — Course Profile · CourseandJobCompass` },
        {
          name: "description",
          content: `Careers, salaries, skills, software and AI impact for ${name} in Nigeria. AI-generated career intelligence for students.`,
        },
         { property: "og:title", content: `${name} — CourseandJobCompass` },
        {
          property: "og:description",
          content: `Real opportunities, salaries and skills for ${name} in Nigeria.`,
        },
      ],
    };
  },
  component: CourseProfilePage,
});

function CourseProfilePage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => getCourseProfile({ data: { slug } }),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
        <Loader2 className="size-8 animate-spin text-primary mx-auto" />
        <h1 className="font-display text-2xl mt-6">Generating your course profile…</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Our AI is building the full career intelligence for <strong>{titleFromSlug(slug)}</strong>.
          This takes 10–30 seconds the first time. Future visits are instant.
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <AlertTriangle className="size-8 text-destructive mx-auto" />
        <h1 className="font-display text-2xl mt-4">We couldn't generate this profile</h1>
        <p className="text-muted-foreground text-sm mt-2">{(error as Error)?.message ?? "Try again in a moment."}</p>
        <Link to="/courses" className="mt-6 inline-block text-sm text-primary hover:underline">← Back to all courses</Link>
      </div>
    );
  }

  return <Profile slug={slug} title={data.title} p={data.profile} />;
}

const RISK_COLOR: Record<string, string> = {
  "Very Safe": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "Safe": "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  "Medium": "text-amber-300 bg-amber-500/10 border-amber-500/30",
  "High Risk": "text-rose-300 bg-rose-500/10 border-rose-500/30",
};

function Profile({ slug, title, p }: { slug: string; title: string; p: CourseProfile }) {
  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
      <header className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/20 text-primary px-2 py-0.5">{p.faculty}</span>
          <span className="rounded-full bg-surface-2/60 px-2 py-0.5 text-muted-foreground">{p.degree}</span>
          <span className="rounded-full bg-surface-2/60 px-2 py-0.5 text-muted-foreground">{p.duration}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold mt-3">{title}</h1>
        <p className="text-gold mt-2 italic">{p.tagline}</p>
        <p className="text-muted-foreground mt-4 max-w-3xl leading-relaxed">{p.overview}</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Fact label="JAMB subjects" value={p.jamb_subjects.join(", ")} />
          <Fact label="O'Level requirements" value={p.olevel_requirements.join(", ")} />
          <Fact label="Universities offering" value={p.universities.slice(0, 6).join(", ")} />
        </div>
      </header>

      <Section icon={<AlertTriangle className="size-4" />} title="Misconceptions vs Reality">
        <div className="grid gap-3">
          {p.misconceptions.map((m, i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-rose-300/80">Myth</div>
                <p className="text-sm mt-1">{m.myth}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-emerald-300/80">Reality</div>
                <p className="text-sm mt-1">{m.reality}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Briefcase className="size-4" />} title="Career opportunities">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CareerCol title="Traditional jobs" items={p.career_opportunities.traditional} />
          <CareerCol title="Remote / global" items={p.career_opportunities.remote} />
          <CareerCol title="Freelance" items={p.career_opportunities.freelance} />
          <CareerCol title="Entrepreneurship" items={p.career_opportunities.entrepreneurship} />
        </div>
      </Section>

      <Section icon={<Wallet className="size-4" />} title="Salary intelligence">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Entry (NG)" value={p.salary.entry_ngn} />
          <Stat label="Mid (NG)" value={p.salary.mid_ngn} />
          <Stat label="Senior (NG)" value={p.salary.senior_ngn} />
          <Stat label="International" value={p.salary.international_usd} highlight />
        </div>
      </Section>

      <Section icon={<Code2 className="size-4" />} title="Skills & software to master">
        <div className="grid sm:grid-cols-3 gap-3">
          <SkillCol title="Essential" items={p.skills.essential} />
          <SkillCol title="Intermediate" items={p.skills.intermediate} />
          <SkillCol title="Advanced" items={p.skills.advanced} />
        </div>
        <div className="mt-5">
          <div className="text-sm font-medium mb-2">Software stack</div>
          <div className="flex flex-wrap gap-2">
            {p.software.map((s) => (
              <span
                key={s.name}
                className={
                  "text-xs rounded-full border px-3 py-1 " +
                  (s.importance === "Critical"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : s.importance === "Important"
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border bg-surface-2/60 text-muted-foreground")
                }
              >
                {s.name} · {s.importance}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={<ShieldCheck className="size-4" />} title="AI impact">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-sm font-medium rounded-full border px-3 py-1 ${RISK_COLOR[p.ai_impact.risk] ?? "border-border"}`}>
            {p.ai_impact.risk}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">{p.ai_impact.summary}</p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">AI tools to learn</div>
          <div className="flex flex-wrap gap-2">
            {p.ai_impact.tools_to_learn.map((t) => (
              <span key={t} className="text-xs rounded-full bg-surface-2/70 px-3 py-1 border border-border/50">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={<GraduationCap className="size-4" />} title="4-Year roadmap">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {([
            ["100L", p.roadmap.year_100],
            ["200L", p.roadmap.year_200],
            ["300L", p.roadmap.year_300],
            ["400L", p.roadmap.year_400],
            ["Final", p.roadmap.final_year],
          ] as const).map(([label, items]) => (
            <div key={label} className="glass rounded-xl p-4">
              <div className="text-gold font-display">{label}</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {items.map((i, idx) => (
                  <li key={idx}>• {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Sparkles className="size-4" />} title="Industry demand index">
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(p.demand_index).map(([k, v]) => (
            <Bar key={k} label={k.replace(/_/g, " ")} value={Number(v)} />
          ))}
        </div>
      </Section>

      <Section icon={<GraduationCap className="size-4" />} title="Learning resources">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-2">Certifications</div>
            <div className="flex flex-wrap gap-2">
              {p.certifications.map((c) => (
                <span key={c} className="text-xs rounded-full border border-border bg-surface-2/60 px-3 py-1">{c}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">YouTube channels</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {p.youtube_channels.map((c) => (
                <li key={c.name}>
                  <span className="text-foreground">{c.name}</span> — {c.focus}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5">
          <div className="text-sm font-medium mb-2">Projects to build</div>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            {p.projects.map((pr, i) => <li key={i}>• {pr}</li>)}
          </ul>
        </div>
      </Section>

      {p.related_courses?.length > 0 && (
        <Section title="Related courses">
          <div className="flex flex-wrap gap-2">
            {p.related_courses.map((c) => (
              <Link
                key={c}
                to="/courses/$slug"
                params={{ slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }}
                className="text-xs rounded-full border border-border bg-surface-2/60 px-3 py-1 hover:border-primary/60"
              >
                {c}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </article>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl flex items-center gap-2 mb-4">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-2/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-gold/40 bg-gold/5" : "border-border/50 bg-surface-2/40"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-1 ${highlight ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}

function CareerCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-sm font-medium text-primary">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((i) => <li key={i}>• {i}</li>)}
      </ul>
    </div>
  );
}

function SkillCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {items.map((i) => <li key={i}>• {i}</li>)}
      </ul>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1 capitalize">
        <span>{label}</span><span>{v}/100</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-gold" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

// Avoid unused-import warning
void notFound;
