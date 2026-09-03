import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { analyzeMatchQuiz } from "@/lib/match.functions";

type Trait =
  | "analytical"
  | "creative"
  | "social"
  | "technical"
  | "entrepreneurial"
  | "leadership"
  | "communication"
  | "numerical";

type Question = { id: number; text: string; trait: Trait };

const QUESTIONS: Question[] = [
  { id: 1, text: "I enjoy solving puzzles and logical problems.", trait: "analytical" },
  { id: 2, text: "I often imagine new ideas, stories or designs.", trait: "creative" },
  { id: 3, text: "I feel energized after spending time with people.", trait: "social" },
  { id: 4, text: "I like understanding how machines, software or systems work.", trait: "technical" },
  { id: 5, text: "I dream of running my own business someday.", trait: "entrepreneurial" },
  { id: 6, text: "People naturally look to me to lead group work.", trait: "leadership" },
  { id: 7, text: "I can explain complicated things in simple words.", trait: "communication" },
  { id: 8, text: "I'm comfortable working with numbers, charts and data.", trait: "numerical" },
  { id: 9, text: "I'd rather analyse a problem deeply than guess quickly.", trait: "analytical" },
  { id: 10, text: "I love drawing, music, writing or making things look good.", trait: "creative" },
  { id: 11, text: "I genuinely care about helping people through their problems.", trait: "social" },
  { id: 12, text: "I enjoy taking things apart to learn how they work.", trait: "technical" },
  { id: 13, text: "I notice opportunities to make money where others don't.", trait: "entrepreneurial" },
  { id: 14, text: "I'm comfortable making decisions even when others disagree.", trait: "leadership" },
  { id: 15, text: "I'm confident speaking in front of a class or crowd.", trait: "communication" },
  { id: 16, text: "I enjoy mathematics and statistics.", trait: "numerical" },
  { id: 17, text: "I research carefully before forming an opinion.", trait: "analytical" },
  { id: 18, text: "I'd rather build something new than follow a template.", trait: "creative" },
  { id: 19, text: "I want a career where I directly impact people's lives.", trait: "social" },
  { id: 20, text: "I'd happily spend hours learning new tech tools.", trait: "technical" },
];

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Course Match Test — CourseandJobCompass" },
      { name: "description", content: "Discover the Nigerian university courses that truly match your mind and personality." },
      { property: "og:title", content: "Course Match Test — CourseandJobCompass" },
      { property: "og:description", content: "Take a 20-question quiz to find your best-fit Nigerian university course." },
    ],
  }),
  component: MatchPage,
});

function MatchPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [interests, setInterests] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const traits: Record<Trait, { sum: number; count: number }> = {
        analytical: { sum: 0, count: 0 },
        creative: { sum: 0, count: 0 },
        social: { sum: 0, count: 0 },
        technical: { sum: 0, count: 0 },
        entrepreneurial: { sum: 0, count: 0 },
        leadership: { sum: 0, count: 0 },
        communication: { sum: 0, count: 0 },
        numerical: { sum: 0, count: 0 },
      };
      for (const q of QUESTIONS) {
        const v = answers[q.id];
        if (!v) continue;
        traits[q.trait].sum += v;
        traits[q.trait].count += 1;
      }
      const normalized = Object.fromEntries(
        Object.entries(traits).map(([k, { sum, count }]) => [
          k,
          count > 0 ? Math.round(((sum / count - 1) / 4) * 100) : 50,
        ]),
      ) as Record<Trait, number>;
      return analyzeMatchQuiz({ data: { traits: normalized, interests } });
    },
  });

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);
  const canSubmit = answered === QUESTIONS.length && !mutation.isPending;

  if (mutation.data) {
    const r = mutation.data;
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <header className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-wider">
            <Sparkles className="size-3.5" /> Your match results
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2">{r.personality_type}</h1>
          <p className="text-muted-foreground mt-3 max-w-3xl leading-relaxed">{r.summary}</p>
        </header>

        <section>
          <h2 className="font-display text-xl mb-3">Best-fit courses</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.best_fit.map((c) => (
              <Link
                key={c.slug + c.course}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="glass rounded-xl p-4 hover:border-primary/60 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.course}</div>
                  <span className="text-xs rounded-full bg-primary/20 text-primary px-2 py-0.5">{c.fit_score}% fit</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{c.why}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Worth considering</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {r.consider.map((c) => (
              <Link key={c.slug + c.course} to="/courses/$slug" params={{ slug: c.slug }}
                className="rounded-xl border border-border/50 bg-surface-2/40 p-4 hover:border-primary/40 transition">
                <div className="font-medium">{c.course}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.why}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Probably not for you</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.avoid.map((c) => (
              <div key={c.course} className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                <div className="font-medium">{c.course}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.why}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Your next steps</h2>
          <ul className="space-y-2">
            {r.next_steps.map((s, i) => (
              <li key={i} className="glass rounded-lg p-3 text-sm">
                <span className="text-primary mr-2">{i + 1}.</span> {s}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => mutation.reset()}
            className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50"
          >
            Retake test
          </button>
          <Link to="/chat" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
            Discuss with AI assistant <ArrowRight className="inline size-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Course Match Test</h1>
      <p className="text-muted-foreground mt-2">
        20 quick questions. Rate how true each statement is for you. Honest answers give honest matches.
      </p>

      <div className="sticky top-16 z-30 mt-6 backdrop-blur-md bg-background/70 py-3">
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{answered} of {QUESTIONS.length} answered</div>
      </div>

      <ol className="mt-6 space-y-4">
        {QUESTIONS.map((q) => (
          <li key={q.id} className="glass rounded-xl p-4">
            <div className="text-sm font-medium">{q.id}. {q.text}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCALE.map((s) => {
                const selected = answers[q.id] === s.v;
                return (
                  <button
                    key={s.v}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: s.v }))}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs transition " +
                      (selected
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-surface-2/60 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <label className="text-sm font-medium">Anything else? (optional)</label>
        <textarea
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. I love biology and fixing computers, and I want to work abroad..."
          rows={3}
          maxLength={500}
          className="mt-2 w-full glass rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>

      {mutation.isError && (
        <p className="mt-4 text-sm text-rose-300">
          Something went wrong: {(mutation.error as Error).message}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          disabled={!canSubmit}
          onClick={() => mutation.mutate()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Analyzing…</>
          ) : (
            <>See my matches <ArrowRight className="size-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
