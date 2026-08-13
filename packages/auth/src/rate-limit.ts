import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Note: In a true multi-instance Edge environment, in-memory limits are per-isolate.
// For robust global rate limiting, provide Upstash Redis credentials.

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const limiters = new Map<string, RateLimitTracker>();

let upstashLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  upstashLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
  });
}

export async function rateLimit(ip: string, maxRequests: number = 10, windowSeconds: number = 60): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Use Upstash Redis if configured
  if (upstashLimiter) {
    const { success, limit, remaining, reset } = await upstashLimiter.limit(ip);
    return { success, limit, remaining, reset };
  }

  // Fallback to in-memory Map
  const now = Date.now();
  const resetTime = now + windowSeconds * 1000;
  
  let tracker = limiters.get(ip);
  
  if (!tracker || tracker.resetTime < now) {
    tracker = { count: 1, resetTime };
    limiters.set(ip, tracker);
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: resetTime };
  }
  
  tracker.count++;
  
  if (tracker.count > maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0, reset: tracker.resetTime };
  }
  
  return { success: true, limit: maxRequests, remaining: maxRequests - tracker.count, reset: tracker.resetTime };
}
