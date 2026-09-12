import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CourseCompass" },
      { name: "description", content: "Why CourseCompass exists: turning course confusion into career clarity for Nigerian students." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 prose prose-invert">
      <h1 className="font-display text-4xl font-semibold">About CourseCompass</h1>
      <p className="text-muted-foreground mt-4 text-lg">
        Every year, millions of Nigerian students walk into universities feeling defeated. They wanted
        Medicine and got Physiology. They wanted Law and got Yoruba. They wanted Computer Science and got
        Statistics. Society told them their course was "useless." Most never recover from that lie.
      </p>
      <p className="text-muted-foreground mt-4">
        CourseCompass exists to end course confusion. We use AI to generate deep, Nigeria-specific
        intelligence on every university course — the real careers, real salaries, real skills, real
        software, real AI impact, and a real 4-year roadmap. Then we let students chat with an empathetic
        AI assistant that actually understands JAMB, NYSC and the Nigerian job market.
      </p>
      <p className="text-muted-foreground mt-4">
        <span className="text-foreground font-medium">Our mission:</span> transform "I got a course I don't
        want" into "I now understand my course, know the opportunities, know the skills, and have a clear
        roadmap to success."
      </p>

      <div className="mt-8 flex gap-3 not-prose">
        <Link to="/match" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Take the Match Test
        </Link>
        <Link to="/courses" className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
          Browse courses
        </Link>
      </div>
    </div>
  );
}
