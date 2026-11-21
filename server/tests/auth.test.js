import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import { requireAuth, readBearerToken } from '../middleware/auth.js';
import { signToken, verifyToken, getJwtSecret } from '../utils/token.js';
import { validateLogin } from '../utils/validation.js';

const SECRET = 'test-secret-that-is-long-enough-123456';
process.env.JWT_SECRET = SECRET;
process.env.JWT_EXPIRES_IN = '1h';

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = code => { res.statusCode = code; return res; };
  res.json = body => { res.body = body; return res; };
  return res;
}

test('signs and verifies a token carrying the user id and role', () => {
  const token = signToken({ id: '507f1f77bcf86cd799439011', role: 'student' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, '507f1f77bcf86cd799439011');
  assert.equal(payload.role, 'student');
  assert.ok(payload.exp > payload.iat);
});

test('rejects a tampered token', () => {
  const token = signToken({ id: '507f1f77bcf86cd799439011', role: 'student' });
  assert.throws(() => verifyToken(`${token}x`));
});

test('refuses to sign or verify without a strong JWT_SECRET', () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'short';
  try {
    assert.throws(() => getJwtSecret(), /at least 32 characters/);
    assert.throws(() => signToken({ id: 'abc', role: 'student' }), /at least 32 characters/);
  } finally {
    process.env.JWT_SECRET = original;
  }
});

test('reads only well-formed Bearer headers', () => {
  assert.equal(readBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(readBearerToken('bearer abc'), 'abc');
  assert.equal(readBearerToken('Bearer'), null);
  assert.equal(readBearerToken('Basic abc'), null);
  assert.equal(readBearerToken('Bearer a b'), null);
  assert.equal(readBearerToken(undefined), null);
});

test('protected route returns 401 without a token', async () => {
  const res = makeRes();
  const next = mock.fn(() => {});
  await requireAuth({ headers: {} }, res, next);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(next.mock.callCount(), 0);
});

test('protected route returns 401 for an invalid token', async () => {
  const res = makeRes();
  const next = mock.fn(() => {});
  await requireAuth({ headers: { authorization: 'Bearer not-a-real-token' } }, res, next);
  assert.equal(res.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test('protected route returns data with a valid token', async () => {
  mock.method(User, 'findById', () => ({
    select: async () => ({ id: '507f1f77bcf86cd799439011', name: 'Demo Student', email: 'student@example.com', role: 'student' })
  }));
  try {
    const token = signToken({ id: '507f1f77bcf86cd799439011', role: 'student' });
    const req = { headers: { authorization: `Bearer ${token}` }, user: undefined };
    const res = makeRes();
    const next = mock.fn(() => {});
    await requireAuth(req, res, next);
    assert.equal(next.mock.callCount(), 1);
    assert.deepEqual(req.user, {
      id: '507f1f77bcf86cd799439011',
      name: 'Demo Student',
      email: 'student@example.com',
      role: 'student'
    });
  } finally {
    mock.restoreAll();
  }
});

test('protected route returns 401 when the token points at a deleted user', async () => {
  mock.method(User, 'findById', () => ({ select: async () => null }));
  try {
    const token = signToken({ id: '507f1f77bcf86cd799439011', role: 'student' });
    const res = makeRes();
    const next = mock.fn(() => {});
    await requireAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);
    assert.equal(res.statusCode, 401);
    assert.equal(next.mock.callCount(), 0);
  } finally {
    mock.restoreAll();
  }
});

test('login validation requires a valid email and a password', () => {
  assert.deepEqual(validateLogin({ email: ' student@example.com ', password: 'StrongPass123' }).errors, []);
  assert.equal(validateLogin({ email: ' student@example.com ', password: 'StrongPass123' }).cleanEmail, 'student@example.com');
  assert.ok(validateLogin({}).errors.length >= 2);
  assert.ok(validateLogin({ email: 'not-an-email', password: 'x' }).errors.some(e => e.toLowerCase().includes('email')));
});
