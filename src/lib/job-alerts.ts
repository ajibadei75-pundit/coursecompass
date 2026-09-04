import type { JobHit } from "./jobs-utils";

export type AlertConfig = {
  course: string;
  profession?: string;
  skills: string[];
  country?: string;
  location: string;
  remoteOnly: boolean;
  minScore: number;
  enabled: boolean;
  seen: string[];
  lastRun?: string;
};

const KEY = "cc.job-alert.v1";
const SEARCH_KEY = "cc.job-search.v1";

export function loadAlert(): AlertConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AlertConfig) : null;
  } catch {
    return null;
  }
}

export function saveAlert(cfg: AlertConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...cfg, seen: cfg.seen.slice(-400) }));
  } catch {
    /* storage full / blocked */
  }
}

export function clearAlert() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function loadLastSearch(): Partial<AlertConfig> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SEARCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastSearch(v: {
  course: string;
  profession?: string;
  skills: string[];
  country?: string;
  location: string;
  remoteOnly: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notifyNewJobs(jobs: JobHit[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted" || jobs.length === 0) return;
  const top = jobs[0];
  const body =
    jobs.length === 1
      ? `${top.title} — ${top.company} (${top.score}% match)`
      : `${top.title} at ${top.company} + ${jobs.length - 1} more matches`;
  try {
    const n = new Notification("CourseandJobCompass · new job match", { body, tag: "cjc-jobs" });
    n.onclick = () => {
      window.focus();
      window.open(top.url, "_blank", "noopener");
    };
  } catch {
    /* ignore */
  }
}
