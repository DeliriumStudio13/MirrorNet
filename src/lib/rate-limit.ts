import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (consider Redis for production clusters)
const requests = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware to prevent API abuse
 * @param req - Next.js request object
 * @param limit - Maximum requests per window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 * @throws Error if rate limit exceeded
 */
export async function rateLimit(
  req: NextRequest, 
  limit: number = 10, 
  windowMs: number = 60 * 1000
): Promise<void> {
  // Get client identifier (IP address)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
    req.headers.get('x-real-ip') || 
    'unknown';
  
  const now = Date.now();
  const key = `${ip}:${req.nextUrl.pathname}`;
  
  // Get current rate limit entry
  const current = requests.get(key) || { 
    count: 0, 
    resetTime: now + windowMs 
  };
  
  // Reset counter if window has passed
  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }
  
  // Update the entry
  requests.set(key, current);
  
  // Check if limit exceeded
  if (current.count > limit) {
    throw new Error(`Rate limit exceeded. Maximum ${limit} requests per ${windowMs/1000} seconds.`);
  }
  
  // Cleanup old entries periodically (prevent memory leaks)
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredEntries();
  }
}

/**
 * Cleanup expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of requests.entries()) {
    if (now > entry.resetTime) {
      requests.delete(key);
    }
  }
}

/**
 * Get rate limit headers for client
 * @param req - Next.js request object
 * @param limit - Rate limit
 * @returns Headers object with rate limit info
 */
export function getRateLimitHeaders(req: NextRequest, limit: number = 10): Record<string, string> {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${ip}:${req.nextUrl.pathname}`;
  const entry = requests.get(key);
  
  if (!entry) {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': limit.toString(),
      'X-RateLimit-Reset': (Date.now() + 60000).toString()
    };
  }
  
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, limit - entry.count).toString(),
    'X-RateLimit-Reset': entry.resetTime.toString()
  };
}

