import { rateLimit } from 'express-rate-limit';

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 10;

export function createRateLimiter({ windowMs = LOGIN_WINDOW_MS, limit = LOGIN_MAX_ATTEMPTS } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        message: 'Too many login attempts. Try again in 15 minutes.'
      })
  });
}

export const loginLimiter = createRateLimiter();
