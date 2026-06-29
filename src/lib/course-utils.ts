export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const FEATURED_COURSES: { slug: string; title: string; tag: string }[] = [
  { slug: "physiology", title: "Physiology", tag: "Health Sciences" },
  { slug: "medical-laboratory-science", title: "Medical Laboratory Science", tag: "Health Sciences" },
  { slug: "biochemistry", title: "Biochemistry", tag: "Science" },
  { slug: "statistics", title: "Statistics", tag: "Science" },
  { slug: "computer-science", title: "Computer Science", tag: "Science" },
  { slug: "mass-communication", title: "Mass Communication", tag: "Arts" },
  { slug: "library-and-information-science", title: "Library and Information Science", tag: "Arts" },
  { slug: "industrial-chemistry", title: "Industrial Chemistry", tag: "Science" },
  { slug: "yoruba", title: "Yoruba", tag: "Arts" },
  { slug: "economics", title: "Economics", tag: "Social Sciences" },
  { slug: "business-administration", title: "Business Administration", tag: "Management" },
  { slug: "accounting", title: "Accounting", tag: "Management" },
];

export type CourseProfile = {
  title: string;
  faculty: string;
  degree: string;
  duration: string;
  tagline: string;
  overview: string;
  jamb_subjects: string[];
  olevel_requirements: string[];
  universities: string[];
  related_courses: string[];
  misconceptions: { myth: string; reality: string }[];
  career_opportunities: {
    traditional: string[];
    remote: string[];
    freelance: string[];
    entrepreneurship: string[];
  };
  salary: {
    entry_ngn: string;
    mid_ngn: string;
    senior_ngn: string;
    international_usd: string;
  };
  skills: {
    essential: string[];
    intermediate: string[];
    advanced: string[];
  };
  software: { name: string; importance: "Critical" | "Important" | "Useful" }[];
  ai_impact: {
    risk: "Very Safe" | "Safe" | "Medium" | "High Risk";
    summary: string;
    tools_to_learn: string[];
  };
  certifications: string[];
  youtube_channels: { name: string; focus: string }[];
  roadmap: {
    year_100: string[];
    year_200: string[];
    year_300: string[];
    year_400: string[];
    final_year: string[];
  };
  projects: string[];
  demand_index: {
    nigerian_demand: number;
    global_demand: number;
    salary_score: number;
    entrepreneurship: number;
    remote_friendly: number;
    ai_resistance: number;
    future_relevance: number;
  };
};
