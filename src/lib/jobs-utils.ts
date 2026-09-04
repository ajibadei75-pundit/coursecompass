export type JobSource = "Remotive" | "Arbeitnow" | "Jobicy" | "Remote OK" | "The Muse";

export type JobHit = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  source: JobSource;
  url: string;
  postedAt?: string;
  salary?: string;
  tags: string[];
  excerpt: string;
  score: number;
  matched: string[];
};

export type JobSearchResult = {
  keywords: string[];
  roles: string[];
  jobs: JobHit[];
  fetchedAt: string;
  sources: { name: JobSource; count: number }[];
  notice?: string;
};

export const ALL_SOURCES: JobSource[] = [
  "Remotive",
  "Jobicy",
  "Arbeitnow",
  "Remote OK",
  "The Muse",
];

export const JOB_MARKETS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Other country",
] as const;

/** Offline fallback: course slug fragment -> role keywords. */
export const COURSE_ROLE_HINTS: { match: string[]; roles: string[] }[] = [
  {
    match: ["computer", "software", "information technology", "cyber"],
    roles: [
      "software engineer",
      "frontend developer",
      "backend developer",
      "IT support",
      "cybersecurity analyst",
    ],
  },
  {
    match: ["statistic", "mathemat", "actuar"],
    roles: ["data analyst", "data scientist", "business intelligence analyst", "risk analyst"],
  },
  {
    match: ["economic", "account", "banking", "finance"],
    roles: ["financial analyst", "accountant", "audit associate", "operations analyst"],
  },
  {
    match: ["mass communication", "english", "linguist", "yoruba", "hausa", "igbo", "history"],
    roles: ["content writer", "communications officer", "social media manager", "copywriter"],
  },
  {
    match: ["business", "management", "marketing"],
    roles: ["business development", "product manager", "marketing associate", "customer success"],
  },
  {
    match: [
      "physiolog",
      "anatom",
      "biochem",
      "microbio",
      "medical laboratory",
      "nursing",
      "public health",
    ],
    roles: [
      "clinical research associate",
      "medical writer",
      "public health officer",
      "healthcare operations",
    ],
  },
  {
    match: ["engineer"],
    roles: ["project engineer", "maintenance engineer", "technical analyst", "operations engineer"],
  },
  {
    match: ["law", "political", "sociolog", "psycholog"],
    roles: ["policy analyst", "legal associate", "people operations", "research assistant"],
  },
  {
    match: ["agric", "geolog", "environment"],
    roles: [
      "field officer",
      "sustainability analyst",
      "supply chain analyst",
      "research assistant",
    ],
  },
];

export function fallbackRoles(course: string): string[] {
  const c = course.toLowerCase();
  const roles = COURSE_ROLE_HINTS.filter((h) => h.match.some((m) => c.includes(m))).flatMap(
    (h) => h.roles,
  );
  return roles.length
    ? [...new Set(roles)].slice(0, 8)
    : ["graduate trainee", "analyst", "operations associate", "customer support"];
}

export function daysAgo(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function postedLabel(iso?: string): string {
  const d = daysAgo(iso);
  if (d === null) return "Recently";
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/** Deep links into Nigerian + global platforms we can't call by API. */
export function platformLinks(query: string, location: string, country = "Nigeria") {
  const q = encodeURIComponent(query);
  const loc = encodeURIComponent(location || country || "Nigeria");
  return [
    { name: "Jobberman", url: `https://www.jobberman.com/jobs?q=${q}` },
    { name: "MyJobMag", url: `https://www.myjobmag.com/search/jobs?q=${q}` },
    { name: "Hot Nigerian Jobs", url: `https://www.hotnigerianjobs.com/search.php?q=${q}` },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`,
    },
    { name: "Indeed", url: `https://ng.indeed.com/jobs?q=${q}&l=${loc}` },
    { name: "Google Jobs", url: `https://www.google.com/search?q=${q}+jobs+${loc}&ibp=htl;jobs` },
  ];
}
