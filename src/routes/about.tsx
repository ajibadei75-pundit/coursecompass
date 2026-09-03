import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
       { title: "About — CourseandJobCompass" },
       { name: "description", content: "Why CourseandJobCompass helps Nigerian students connect education, skills and work." },
       { property: "og:title", content: "About — CourseandJobCompass" },
       { property: "og:description", content: "A practical course and career companion for Nigerian students." },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 prose prose-invert">
       <h1 className="font-display text-4xl font-semibold">About CourseandJobCompass</h1>
      <p className="text-muted-foreground mt-4 text-lg">
        Every year, millions of Nigerian students walk into universities feeling defeated. They wanted
        Medicine and got Physiology. They wanted Law and got Yoruba. They wanted Computer Science and got
        Statistics. Society told them their course was "useless." Most never recover from that lie.
      </p>
      <p className="text-muted-foreground mt-4">
         CourseandJobCompass exists to make education-to-work decisions clearer. We combine Nigeria-specific
         course intelligence, profession-based job matching, practical skills guidance and a research-aware
         assistant that understands JAMB, NYSC and the Nigerian job market.
      </p>
      <p className="text-muted-foreground mt-4">
         <span className="text-foreground font-medium">Our mission:</span> help every student move from
         "What can I do with this course?" to "I know my options, my skills gap and my next step."
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
