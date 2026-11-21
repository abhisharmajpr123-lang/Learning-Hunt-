import jwt from 'jsonwebtoken';

export const MIN_SECRET_LENGTH = 32;
export const DEFAULT_EXPIRES_IN = '1d';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return secret;
}

export function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
}

export function signToken(user) {
  const id = user.id || user._id;
  if (!id) throw new Error('Cannot sign a token without a user id.');
  return jwt.sign({ sub: String(id), role: user.role }, getJwtSecret(), { expiresIn: getExpiresIn() });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}
