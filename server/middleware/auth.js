import User from '../models/User.js';
import { verifyToken } from '../utils/token.js';

const UNAUTHORIZED = { success: false, message: 'A valid Bearer token is required.' };

export function readBearerToken(header) {
  if (typeof header !== 'string') return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (!scheme || !token || rest.length) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
}

/**
 * Allow the request only when the authenticated user has one of the given roles.
 * Must run after requireAuth, which is what sets req.user.
 */
export function requireRole(...roles) {
  const allowed = roles.flat();
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Your role is not allowed to perform this action.' });
    }
    return next();
  };
}

export async function requireAuth(req, res, next) {
  const header = typeof req.get === 'function' ? req.get('authorization') : req.headers?.authorization;
  const token = readBearerToken(header);
  if (!token) return res.status(401).json(UNAUTHORIZED);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json(UNAUTHORIZED);
  }
  if (!payload?.sub) return res.status(401).json(UNAUTHORIZED);

  try {
    const user = await User.findById(payload.sub).select('name email role');
    if (!user) return res.status(401).json(UNAUTHORIZED);
    req.user = { id: String(user.id), name: user.name, email: user.email, role: user.role };
    return next();
  } catch (error) {
    if (error?.name === 'CastError') return res.status(401).json(UNAUTHORIZED);
    return next(error);
  }
}
