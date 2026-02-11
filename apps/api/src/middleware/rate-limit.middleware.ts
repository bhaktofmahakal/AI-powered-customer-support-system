import { Context, Next } from 'hono';
import { AppError } from './error.middleware';

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per IP and per user)
const ipStore = new Map<string, RateLimitRecord>();
const userStore = new Map<string, RateLimitRecord>();

// Per-user hourly limiter
const USER_HOURLY_MAX = 100;
const USER_HOURLY_WINDOW = 60 * 60 * 1000; // 1 hour

// Cleanup stale entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

export function startRateLimitCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetTime) ipStore.delete(key);
    }
    for (const [key, record] of userStore.entries()) {
      if (now > record.resetTime) userStore.delete(key);
    }
  }, 60 * 1000); // every minute
}

export function stopRateLimitCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  ipStore.clear();
  userStore.clear();
}

// Start cleanup by default
startRateLimitCleanup();

function checkLimit(
  store: Map<string, RateLimitRecord>,
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }

  record.count++;
  store.set(key, record);

  return {
    allowed: record.count <= max,
    remaining: Math.max(0, max - record.count),
    resetTime: record.resetTime,
  };
}

export const rateLimit = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    let ip = 'anonymous';
    const xForwardedFor = c.req.header('x-forwarded-for');
    if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim();
    } else {
      ip = (c.req.raw as any).socket?.remoteAddress || (c.req as any).ip || 'anonymous';
    }

    // Check IP-based rate limit (per minute)
    const ipResult = checkLimit(ipStore, ip, config.max, config.windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', config.max.toString());
    c.header('X-RateLimit-Remaining', ipResult.remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(ipResult.resetTime / 1000).toString());

    if (!ipResult.allowed) {
      const retryAfter = Math.ceil((ipResult.resetTime - Date.now()) / 1000);
      c.header('Retry-After', Math.max(1, retryAfter).toString());
      throw new AppError(429, 'Too many requests - Please try again later');
    }

    // Check per-user hourly limit (if userId is set)
    const userId = c.get('userId');
    if (userId) {
      const userResult = checkLimit(userStore, userId, USER_HOURLY_MAX, USER_HOURLY_WINDOW);
      c.header('X-RateLimit-User-Remaining', userResult.remaining.toString());

      if (!userResult.allowed) {
        const retryAfter = Math.ceil((userResult.resetTime - Date.now()) / 1000);
        c.header('Retry-After', Math.max(1, retryAfter).toString());
        throw new AppError(429, 'Hourly request limit exceeded - Please try again later');
      }
    }

    await next();
  };
};
