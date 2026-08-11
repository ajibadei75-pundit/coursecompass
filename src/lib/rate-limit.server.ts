/**
 * Lightweight in-memory sliding-window rate limiter.
 * Keyed by client IP (falls back to a shared bucket when no IP header exists).
 * Protects the public AI endpoints from abuse / credit drain.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function clientIpFromRequest(request: Request | undefined | null): string {
  if (!request) return "unknown";
  const h = request.headers;
  const raw =
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") ?? "").split(",")[0] ||
    "";
  return raw.trim() || "unknown";
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) buckets.clear();

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function enforceRateLimit(
  request: Request | undefined | null,
  scope: string,
  opts: { limit: number; windowMs: number },
): void {
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `${scope}:${clientIpFromRequest(request)}`,
    opts,
  );
  if (!allowed) {
    throw new Error(
      `Too many requests. Please wait ${retryAfterSeconds}s and try again.`,
    );
  }
}
