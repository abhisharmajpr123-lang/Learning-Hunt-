import { rateLimit } from 'express-rate-limit';

export const LOGIN_WINDOW_MS = 2 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 10;

export function createRateLimiter({ windowMs = LOGIN_WINDOW_MS, limit = LOGIN_MAX_ATTEMPTS } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Only failed attempts consume the budget, so a user who keeps signing in
    // successfully never locks themselves out.
    skipSuccessfulRequests: true,
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        message: 'Too many login attempts. Try again in 2 minutes.'
      })
  });
}

export const loginLimiter = createRateLimiter();
