import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Rocket, Search, Compass, Brain, MessageSquare, Briefcase, ShieldCheck } from "lucide-react";
import { FEATURED_COURSES, slugify } from "@/lib/course-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CourseCompass — Understand Your Course, Build Your Future" },
      {
        name: "description",
        content:
          "Got placed in a course you didn't choose? Discover the real opportunities, salaries, skills and AI impact of every Nigerian university course.",
      },
      { property: "og:title", content: "CourseCompass" },
      {
        property: "og:description",
        content:
          "AI-powered Nigerian course intelligence: careers, salaries, skills, software, and roadmaps for every course.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <Featured />
      <SampleProfile />
      <HowItWorks />
      <FinalCta />
    </>
  );
}

const SCAN_STEPS = [
  "Locating course…",
  "Reading Nigerian job data…",
  "Mapping careers & salaries…",
  "Building your roadmap…",
];

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [launching, setLaunching] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!launching) return;
    const id = setInterval(() => setStep((s) => (s + 1) % SCAN_STEPS.length), 420);
    return () => clearInterval(id);
  }, [launching]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (launching) return;
    const slug = slugify(q);
    if (!slug) return;
    setStep(0);
    setLaunching(true);
    window.setTimeout(() => {
      navigate({ to: "/courses/$slug", params: { slug } });
    }, 1250);
  };

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="size-3.5" /> Built for Nigerian students
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-bold leading-[1.05]">
            Helping students understand their future{" "}
            <span className="text-primary">before it's too late.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            You didn't get Medicine — you got Physiology. Or MLS. Or Statistics. Or Yoruba.
            Before you panic or change school, understand what your course really offers in Nigeria
            and the world.
          </p>

          <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-3">
            <div
              className={`relative rounded-lg overflow-hidden transition-shadow ${
                launching ? "glow-ring" : ""
              }`}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 z-10 ${
                  launching ? "text-primary animate-pulse" : "text-muted-foreground"
                }`}
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={launching}
                placeholder="Type any course: e.g. Physiology, Statistics, Mass Comm..."
                className="w-full glass rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-70"
              />
              {launching && (
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 scan-sweep bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
              )}
            </div>

            <DragAnalyze
              busy={launching}
              disabled={!q.trim()}
              onComplete={startAnalysis}
            />
          </form>

          <div
            className={`mt-3 text-xs text-primary transition-all duration-300 ${
              launching ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 h-0"
            }`}
            aria-live="polite"
          >
            {launching ? SCAN_STEPS[step] : ""}
          </div>



          <div className="mt-4 flex flex-wrap gap-2">
            {["physiology", "medical-laboratory-science", "statistics", "mass-communication", "yoruba"].map(
              (s) => (
                <Link
                  key={s}
                  to="/courses/$slug"
                  params={{ slug: s }}
                  className="text-xs rounded-full border border-border/60 px-3 py-1 text-muted-foreground hover:text-foreground hover:border-primary/50"
                >
                  {s.replace(/-/g, " ")}
                </Link>
              ),
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <CtaCard to="/match" icon={<Brain className="size-4" />} title="Course Match Test" desc="20 questions → best-fit courses" />
            <CtaCard to="/chat" icon={<MessageSquare className="size-4" />} title="AI Career Chat" desc="Ask anything about your future" />
            <CtaCard to="/courses" icon={<Compass className="size-4" />} title="Browse Courses" desc="Every Nigerian degree, decoded" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaCard({ to, icon, title, desc }: { to: "/match" | "/chat" | "/courses"; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group glass rounded-xl p-4 hover:border-primary/60 transition flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground">{desc}</span>
      <ArrowRight className="size-4 mt-2 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
    </Link>
  );
}

function Featured() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Most misunderstood courses</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These courses are dismissed by students, parents and society. Their realities tell another story.
          </p>
        </div>
        <Link to="/courses" className="text-sm text-primary hover:underline hidden sm:inline">
          Browse all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {FEATURED_COURSES.map((c) => (
          <Link
            key={c.slug}
            to="/courses/$slug"
            params={{ slug: c.slug }}
            className="glass rounded-xl p-4 hover:border-primary/60 transition group"
          >
            <div className="text-[10px] uppercase tracking-wider text-gold/90">{c.tag}</div>
            <div className="mt-1 font-medium text-foreground group-hover:text-primary transition">
              {c.title}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Decode this course →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SampleProfile() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-gold">Sample profile preview</div>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold mt-1">Physiology</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              "I wanted Medicine but got Physiology" — here's what that actually means.
            </p>
          </div>
          <Link
            to="/courses/$slug"
            params={{ slug: "physiology" }}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Open full profile
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Mini icon={<Briefcase className="size-4" />} title="Career paths">
            Clinical research, biomedical sales, health-tech, public health, MSc & abroad routes.
          </Mini>
          <Mini icon={<ShieldCheck className="size-4" />} title="AI risk: Safe">
            Human biology research and clinical interpretation aren't easily automated.
          </Mini>
          <Mini icon={<Sparkles className="size-4" />} title="Salary (entry)">
            ₦80,000 – ₦180,000 / month in Nigeria; remote research roles pay in USD.
          </Mini>
        </div>
      </div>
    </section>
  );
}

function Mini({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 p-4 bg-surface-2/40">
      <div className="flex items-center gap-2 text-primary text-sm font-medium">
        {icon} {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Search any course", desc: "Get an AI-built profile with careers, salaries, skills and AI impact." },
    { n: "02", title: "Take the Match Test", desc: "20 quick questions reveal the courses that fit your mind, not the crowd." },
    { n: "03", title: "Ask the AI assistant", desc: "Empathetic, Nigeria-aware answers to every career question you have." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold">From confusion to clarity</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="glass rounded-xl p-5">
            <div className="text-gold font-display text-2xl">{s.n}</div>
            <div className="font-medium mt-1">{s.title}</div>
            <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="glass rounded-2xl p-8 sm:p-12 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold">
          Your course isn't a sentence. It's a starting point.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Discover the real opportunities inside your degree — before you waste four years assuming the worst.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/match" className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            Take the Match Test
          </Link>
          <Link to="/chat" className="rounded-md border border-border px-5 py-3 text-sm hover:border-primary/50">
            Talk to the AI Assistant
          </Link>
        </div>
      </div>
    </section>
  );
}
