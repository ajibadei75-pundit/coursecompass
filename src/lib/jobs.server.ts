import type { JobHit, JobSource } from "./jobs-utils";

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

/** Simple TTL memo so repeated searches stay fast and stay inside provider limits. */
const memo = new Map<string, { at: number; jobs: JobHit[] }>();
async function cached(key: string, ttlMs: number, fn: () => Promise<JobHit[]>): Promise<JobHit[]> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.jobs;
  const jobs = await fn();
  memo.set(key, { at: Date.now(), jobs });
  if (memo.size > 120) memo.delete(memo.keys().next().value as string);
  return jobs;
}

async function fromRemotive(term: string): Promise<JobHit[]> {
  const data = await safeJson(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}&limit=25`,
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
    matched: [] as string[],
  }));
}

async function fromJobicy(term: string): Promise<JobHit[]> {
  const data = await safeJson(
    `https://jobicy.com/api/v2/remote-jobs?count=25&tag=${encodeURIComponent(term)}`,
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
    matched: [] as string[],
  }));
}

async function fromArbeitnow(): Promise<JobHit[]> {
  return cached("arbeitnow", 10 * 60_000, async () => {
    const data = await safeJson("https://www.arbeitnow.com/api/job-board-api");
    const jobs: any[] = data?.data ?? [];
    return jobs.slice(0, 150).map((j) => ({
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
  });
}

/** Remote OK — attribution required by their API terms (we credit the source on each card). */
async function fromRemoteOk(): Promise<JobHit[]> {
  return cached("remoteok", 10 * 60_000, async () => {
    const data = await safeJson("https://remoteok.com/api");
    const jobs: any[] = Array.isArray(data) ? data.slice(1) : [];
    return jobs.map((j) => ({
      id: `remoteok-${j.id}`,
      title: j.position ?? j.title ?? "Role",
      company: j.company ?? "Company",
      location: j.location || "Remote",
      remote: true,
      source: "Remote OK" as const,
      url: j.url ?? `https://remoteok.com/remote-jobs/${j.slug}`,
      postedAt: j.date,
      salary:
        j.salary_min && j.salary_max
          ? `USD ${Math.round(j.salary_min / 1000)}k–${Math.round(j.salary_max / 1000)}k/yr`
          : undefined,
      tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
      excerpt: strip(j.description ?? ""),
      score: 0,
      matched: [] as string[],
    }));
  });
}

/** The Muse — on-site + hybrid roles worldwide, keyword-searchable. */
async function fromTheMuse(term: string, location: string): Promise<JobHit[]> {
  const locPart = location ? `&location=${encodeURIComponent(location)}` : "";
  const data = await safeJson(
    `https://www.themuse.com/api/public/jobs?page=0&descending=true&q=${encodeURIComponent(term)}${locPart}`,
  );
  const jobs: any[] = data?.results ?? [];
  return jobs.map((j) => {
    const locs = (j.locations ?? []).map((l: any) => l.name).filter(Boolean);
    return {
      id: `muse-${j.id}`,
      title: j.name ?? "Role",
      company: j.company?.name ?? "Company",
      location: locs.join(", ") || "Multiple locations",
      remote: locs.some((l: string) => /flexible|remote/i.test(l)),
      source: "The Muse" as const,
      url: j.refs?.landing_page ?? "https://www.themuse.com/jobs",
      postedAt: j.publication_date,
      tags: [
        ...(j.categories ?? []).map((c: any) => c.name),
        ...(j.levels ?? []).map((l: any) => l.name),
      ].slice(0, 5),
      excerpt: strip(j.contents ?? ""),
      score: 0,
      matched: [] as string[],
    };
  });
}

export async function aggregateJobs(
  roles: string[],
  _skills: string[],
  location = "",
): Promise<JobHit[]> {
  const terms = roles.slice(0, 3);
  const batches = await Promise.all([
    ...terms.map((t) => cached(`remotive:${t}`, 5 * 60_000, () => fromRemotive(t))),
    ...terms.slice(0, 2).map((t) => cached(`jobicy:${t}`, 5 * 60_000, () => fromJobicy(t.split(" ")[0]))),
    ...terms.slice(0, 2).map((t) =>
      cached(`muse:${t}:${location}`, 5 * 60_000, () => fromTheMuse(t, location)),
    ),
    fromArbeitnow(),
    fromRemoteOk(),
  ]);

  const seen = new Set<string>();
  const all: JobHit[] = [];
  for (const b of batches) {
    for (const j of b) {
      if (!j.url) continue;
      const key = `${j.title}::${j.company}`.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(j);
    }
  }
  return all;
}

const NG_CITIES = [
  "lagos", "abuja", "ibadan", "port harcourt", "kano", "benin", "enugu", "abeokuta",
  "ilorin", "kaduna", "jos", "uyo", "calabar", "owerri", "warri", "akure", "nigeria",
];

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
  const locTokens = loc.split(/[,\s]+/).filter((t) => t.length > 2);
  const wantsNigeria = NG_CITIES.some((c) => loc.includes(c));

  const scored = jobs.map((j) => {
    const title = j.title.toLowerCase();
    const hay = `${j.title} ${j.tags.join(" ")} ${j.excerpt}`.toLowerCase();
    const matched: string[] = [];
    let score = 0;

    // Exact / partial role title matching, weighted by role rank.
    roles.forEach((r, i) => {
      const rl = r.toLowerCase();
      if (title === rl) {
        score += 50 - i * 3;
        matched.push(r);
      } else if (title.includes(rl)) {
        score += 40 - i * 3;
        matched.push(r);
      }
    });
    for (const w of new Set(roleWords)) {
      if (title.includes(w)) score += 8;
      else if (hay.includes(w)) score += 4;
    }

    for (const s of skillList) {
      if (title.includes(s)) {
        score += 18;
        matched.push(s);
      } else if (hay.includes(s)) {
        score += 12;
        matched.push(s);
      }
    }

    // Location fit.
    const jl = `${j.location}`.toLowerCase();
    if (locTokens.some((t) => jl.includes(t))) {
      score += 22;
      matched.push(location);
    }
    if (wantsNigeria && /nigeria|africa|emea|worldwide|anywhere|global/i.test(jl)) score += 14;
    if (j.remote) score += 10;

    // Freshness.
    if (j.postedAt) {
      const days = (Date.now() - new Date(j.postedAt).getTime()) / 86_400_000;
      if (days < 3) score += 14;
      else if (days < 7) score += 9;
      else if (days < 30) score += 4;
      else if (days > 90) score -= 8;
    }

    // Signal quality.
    if (j.salary) score += 5;
    if (/senior|lead|principal|manager|director|head of|vp /.test(title)) score -= 6;
    if (/intern|graduate|junior|entry|trainee/.test(title)) score += 6;

    const normalised = Math.max(0, Math.min(100, Math.round(score)));
    return { ...j, score: normalised, matched: [...new Set(matched)].slice(0, 6) };
  });

  return scored
    .filter((j) => (remoteOnly ? j.remote : true))
    .filter((j) => j.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);
}
