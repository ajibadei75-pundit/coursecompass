export type JobHit = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  source: "Remotive" | "Arbeitnow" | "Jobicy";
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
  notice?: string;
};

/** Offline fallback: course slug fragment -> role keywords. */
export const COURSE_ROLE_HINTS: { match: string[]; roles: string[] }[] = [
  { match: ["computer", "software", "information technology", "cyber"], roles: ["software engineer", "frontend developer", "backend developer", "IT support", "cybersecurity analyst"] },
  { match: ["statistic", "mathemat", "actuar"], roles: ["data analyst", "data scientist", "business intelligence analyst", "risk analyst"] },
  { match: ["economic", "account", "banking", "finance"], roles: ["financial analyst", "accountant", "audit associate", "operations analyst"] },
  { match: ["mass communication", "english", "linguist", "yoruba", "hausa", "igbo", "history"], roles: ["content writer", "communications officer", "social media manager", "copywriter"] },
  { match: ["business", "management", "marketing"], roles: ["business development", "product manager", "marketing associate", "customer success"] },
  { match: ["physiolog", "anatom", "biochem", "microbio", "medical laboratory", "nursing", "public health"], roles: ["clinical research associate", "medical writer", "public health officer", "healthcare operations"] },
  { match: ["engineer"], roles: ["project engineer", "maintenance engineer", "technical analyst", "operations engineer"] },
  { match: ["law", "political", "sociolog", "psycholog"], roles: ["policy analyst", "legal associate", "people operations", "research assistant"] },
  { match: ["agric", "geolog", "environment"], roles: ["field officer", "sustainability analyst", "supply chain analyst", "research assistant"] },
];

export function fallbackRoles(course: string): string[] {
  const c = course.toLowerCase();
  const hit = COURSE_ROLE_HINTS.find((h) => h.match.some((m) => c.includes(m)));
  return hit ? hit.roles : ["graduate trainee", "analyst", "operations associate", "customer support"];
}

/** Deep links into Nigerian + global platforms we can't call by API. */
export function platformLinks(query: string, location: string) {
  const q = encodeURIComponent(query);
  const loc = encodeURIComponent(location || "Nigeria");
  return [
    { name: "Jobberman", url: `https://www.jobberman.com/jobs?q=${q}` },
    { name: "MyJobMag", url: `https://www.myjobmag.com/search/jobs?q=${q}` },
    { name: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}` },
    { name: "Indeed", url: `https://ng.indeed.com/jobs?q=${q}&l=${loc}` },
    { name: "Google Jobs", url: `https://www.google.com/search?q=${q}+jobs+${loc}&ibp=htl;jobs` },
  ];
}
