/**
 * Rate Limiting Middleware
 * Custom rate limiters for sensitive endpoints
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis';
import { HttpError } from '../lib/errors';

// Rate limit error
export class RateLimitError extends HttpError {
  constructor(retryAfter: number) {
    super(
      429,
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMIT_EXCEEDED'
    );
  }
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
  keyGenerator?: (request: FastifyRequest) => string;
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, keyPrefix, keyGenerator } = config;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    // Generate key based on IP or custom function
    const identifier = keyGenerator ? keyGenerator(request) : request.ip;

    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      // Increment counter
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Check if limit exceeded
      if (current > max) {
        const ttl = await redis.ttl(key);
        throw new RateLimitError(ttl > 0 ? ttl : windowSeconds);
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        throw err;
      }
      // If Redis fails, allow the request (fail open)
      console.error('Rate limit check failed:', err);
    }
  };
}

/**
 * Auth endpoint rate limiter
 * Strict limits for login/register/password reset
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  keyPrefix: 'auth',
});

/**
 * OTP request rate limiter
 * Very strict to prevent SMS/WhatsApp abuse
 */
export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP per minute
  keyPrefix: 'otp',
  keyGenerator: (request) => {
    // Rate limit by phone number if available
    const body = request.body as { phone?: string } | undefined;
    return body?.phone || request.ip;
  },
});

/**
 * OTP hourly rate limiter
 * Prevent excessive OTP requests
 */
export const otpHourlyRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 OTPs per hour
  keyPrefix: 'otp-hourly',
  keyGenerator: (request) => {
    const body = request.body as { phone?: string } | undefined;
    return body?.phone || request.ip;
  },
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  keyPrefix: 'password-reset',
  keyGenerator: (request) => {
    const body = request.body as { phone?: string } | undefined;
    return body?.phone || request.ip;
  },
});

/**
 * Registration rate limiter
 * Prevent mass account creation
 */
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  keyPrefix: 'register',
});

/**
 * API rate limiter (general)
 * Applied globally via Fastify plugin
 */
export const apiRateLimitConfig = {
  max: 100,
  timeWindow: '1 minute',
};

/**
 * Register rate limit headers hook
 */
export function registerRateLimitHeaders(fastify: FastifyInstance) {
  fastify.addHook('onSend', async (request, reply) => {
    // Add rate limit headers if available
    const remaining = reply.getHeader('x-ratelimit-remaining');
    if (remaining === undefined) {
      // Set default headers for non-rate-limited routes
      reply.header('X-RateLimit-Limit', '100');
      reply.header('X-RateLimit-Remaining', '100');
    }
  });
}
