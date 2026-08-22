import type { JobHit } from "./jobs-utils";

const UA = { "user-agent": "CourseCompass/1.0 (+https://coursecompassng.lovable.app)" };

function strip(html: string, max = 260) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function safeJson(url: string, timeoutMs = 12000): Promise<any | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { headers: UA, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fromRemotive(term: string): Promise<JobHit[]> {
  const data = await safeJson(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}&limit=20`,
  );
  const jobs: any[] = data?.jobs ?? [];
  return jobs.map((j) => ({
    id: `remotive-${j.id}`,
    title: j.title ?? "Role",
    company: j.company_name ?? "Company",
    location: j.candidate_required_location || "Remote",
    remote: true,
    source: "Remotive" as const,
    url: j.url,
    postedAt: j.publication_date,
    salary: j.salary || undefined,
    tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
    excerpt: strip(j.description ?? ""),
    score: 0,
    matched: [],
  }));
}

async function fromJobicy(term: string): Promise<JobHit[]> {
  const data = await safeJson(
    `https://jobicy.com/api/v2/remote-jobs?count=20&tag=${encodeURIComponent(term)}`,
  );
  const jobs: any[] = data?.jobs ?? [];
  return jobs.map((j) => ({
    id: `jobicy-${j.id}`,
    title: j.jobTitle ?? "Role",
    company: j.companyName ?? "Company",
    location: (Array.isArray(j.jobGeo) ? j.jobGeo.join(", ") : j.jobGeo) || "Anywhere",
    remote: true,
    source: "Jobicy" as const,
    url: j.url,
    postedAt: j.pubDate,
    salary:
      j.annualSalaryMin && j.annualSalaryMax
        ? `${j.salaryCurrency ?? "USD"} ${j.annualSalaryMin}–${j.annualSalaryMax}/yr`
        : undefined,
    tags: Array.isArray(j.jobIndustry) ? j.jobIndustry.slice(0, 4) : [],
    excerpt: strip(j.jobExcerpt ?? j.jobDescription ?? ""),
    score: 0,
    matched: [],
  }));
}

let arbeitnowCache: { at: number; jobs: JobHit[] } | null = null;
async function fromArbeitnow(): Promise<JobHit[]> {
  if (arbeitnowCache && Date.now() - arbeitnowCache.at < 10 * 60_000) return arbeitnowCache.jobs;
  const data = await safeJson("https://www.arbeitnow.com/api/job-board-api");
  const jobs: any[] = data?.data ?? [];
  const mapped = jobs.slice(0, 120).map((j) => ({
    id: `arbeitnow-${j.slug}`,
    title: j.title ?? "Role",
    company: j.company_name ?? "Company",
    location: j.location || (j.remote ? "Remote" : "On-site"),
    remote: Boolean(j.remote),
    source: "Arbeitnow" as const,
    url: j.url,
    postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
    tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
    excerpt: strip(j.description ?? ""),
    score: 0,
    matched: [] as string[],
  }));
  arbeitnowCache = { at: Date.now(), jobs: mapped };
  return mapped;
}

export async function aggregateJobs(roles: string[], skills: string[]): Promise<JobHit[]> {
  const terms = roles.slice(0, 3);
  const batches = await Promise.all([
    ...terms.map((t) => fromRemotive(t)),
    ...terms.slice(0, 2).map((t) => fromJobicy(t.split(" ")[0])),
    fromArbeitnow(),
  ]);

  const seen = new Set<string>();
  const all: JobHit[] = [];
  for (const b of batches) {
    for (const j of b) {
      const key = `${j.title}::${j.company}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(j);
    }
  }
  return all;
}

export function scoreJobs(
  jobs: JobHit[],
  roles: string[],
  skills: string[],
  location: string,
  remoteOnly: boolean,
): JobHit[] {
  const roleWords = roles.flatMap((r) => r.toLowerCase().split(/\s+/)).filter((w) => w.length > 3);
  const skillList = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);
  const loc = location.toLowerCase().trim();

  const scored = jobs.map((j) => {
    const hay = `${j.title} ${j.tags.join(" ")} ${j.excerpt}`.toLowerCase();
    const matched: string[] = [];
    let score = 0;

    for (const r of roles) {
      if (j.title.toLowerCase().includes(r.toLowerCase())) {
        score += 45;
        matched.push(r);
        break;
      }
    }
    for (const w of new Set(roleWords)) if (hay.includes(w)) score += 6;
    for (const s of skillList) {
      if (hay.includes(s)) {
        score += 14;
        matched.push(s);
      }
    }
    if (j.remote) score += 8;
    if (loc && `${j.location}`.toLowerCase().includes(loc)) {
      score += 20;
      matched.push(location);
    }
    if (loc && /nigeria|africa|worldwide|anywhere/i.test(j.location)) score += 10;
    if (j.postedAt) {
      const days = (Date.now() - new Date(j.postedAt).getTime()) / 86_400_000;
      if (days < 7) score += 10;
      else if (days < 30) score += 4;
    }
    return { ...j, score: Math.max(0, Math.min(100, Math.round(score))), matched: [...new Set(matched)].slice(0, 5) };
  });

  return scored
    .filter((j) => (remoteOnly ? j.remote : true))
    .filter((j) => j.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}
