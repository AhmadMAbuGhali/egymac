/**
 * Lightweight in-memory rate limiter for public endpoints.
 * Resets on cold starts (serverless); still blocks basic abuse per instance.
 */

const buckets = new Map();

function pruneBucket(bucket, windowMs, now) {
  while (bucket.length && bucket[0] <= now - windowMs) bucket.shift();
}

export function createRateLimiter({ windowMs = 60_000, max = 30, keyFn } = {}) {
  const resolveKey = keyFn || ((req) => req.ip || req.socket?.remoteAddress || "unknown");

  return (req, res, next) => {
    const now = Date.now();
    const key = resolveKey(req);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }

    pruneBucket(bucket, windowMs, now);

    if (bucket.length >= max) {
      const retryAfter = Math.ceil((bucket[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(Math.max(retryAfter, 1)));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    bucket.push(now);
    next();
  };
}

/** Public inquiry form: 5 submissions per IP per 15 minutes. */
export const inquiryRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 5,
});
