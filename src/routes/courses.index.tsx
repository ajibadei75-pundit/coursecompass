import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { FEATURED_COURSES, slugify } from "@/lib/course-utils";
import { listCachedCourses } from "@/lib/courses.functions";

export const Route = createFileRoute("/courses/")({
  head: () => ({
    meta: [
      { title: "Browse Nigerian University Courses — CourseCompass" },
      {
        name: "description",
        content: "Search and explore AI-powered profiles of Nigerian university courses: careers, salaries, skills and AI impact.",
      },
      { property: "og:title", content: "Browse Courses — CourseCompass" },
      { property: "og:description", content: "Discover the truth about every Nigerian university course." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: recent } = useQuery({
    queryKey: ["cached-courses"],
    queryFn: () => listCachedCourses(),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(q);
    if (slug) navigate({ to: "/courses/$slug", params: { slug } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Browse courses</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Search any Nigerian university course. The first time it's requested, our AI generates a deep,
        Nigeria-specific profile — careers, salaries, skills, software, AI impact, and a 4-year roadmap.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Nursing, Microbiology, Marketing, Sociology..."
            className="w-full glass rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Open
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-xl">Featured courses</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURED_COURSES.map((c) => (
            <Link
              key={c.slug}
              to="/courses/$slug"
              params={{ slug: c.slug }}
              className="glass rounded-xl p-4 hover:border-primary/60 transition"
            >
              <div className="text-[10px] uppercase tracking-wider text-gold/90">{c.tag}</div>
              <div className="mt-1 font-medium">{c.title}</div>
            </Link>
          ))}
        </div>
      </section>

      {recent && recent.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl">Recently generated</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recent.map((c) => (
              <Link
                key={c.slug}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="glass rounded-xl p-4 hover:border-primary/60 transition"
              >
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-1">/{c.slug}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
