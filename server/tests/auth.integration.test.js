import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

let mongo;
let server;
let baseUrl;

async function call(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, body: json };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('signup -> login -> /me works end to end and stores only a password hash', async () => {
  const credentials = { name: 'Integration Student', email: 'student@example.com', password: 'StrongPass123' };

  const signup = await call('POST', '/api/auth/signup', { body: credentials });
  assert.equal(signup.status, 201);
  assert.equal(signup.body.user.email, 'student@example.com');
  assert.equal(signup.body.user.role, 'student');
  assert.equal(signup.body.user.password, undefined);

  const stored = await mongoose.connection.collection('users').findOne({ email: 'student@example.com' });
  assert.ok(stored.password.startsWith('$2'), 'password must be stored as a bcrypt hash');
  assert.notEqual(stored.password, credentials.password);

  const duplicate = await call('POST', '/api/auth/signup', { body: credentials });
  assert.equal(duplicate.status, 409);

  const badPassword = await call('POST', '/api/auth/login', {
    body: { email: credentials.email, password: 'WrongPass123' }
  });
  assert.equal(badPassword.status, 401);
  assert.equal(badPassword.body.message, 'Invalid email or password.');

  const login = await call('POST', '/api/auth/login', {
    body: { email: credentials.email, password: credentials.password }
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.tokenType, 'Bearer');
  assert.equal(login.body.expiresIn, '1h');
  assert.equal(typeof login.body.token, 'string');
  assert.equal(login.body.user.password, undefined);

  const me = await call('GET', '/api/auth/me', { token: login.body.token });
  assert.equal(me.status, 200);
  assert.deepEqual(me.body.user, login.body.user);

  const missing = await call('GET', '/api/auth/me');
  assert.equal(missing.status, 401);
  assert.equal(missing.body.success, false);

  const tampered = await call('GET', '/api/auth/me', { token: `${login.body.token}x` });
  assert.equal(tampered.status, 401);
  assert.equal(tampered.body.success, false);

  // Tokens and personal data must not be cached by browsers or proxies.
  assert.match(login.headers.get('cache-control') || '', /no-store/);
  assert.match(me.headers.get('cache-control') || '', /no-store/);
});

test('successful logins do not count toward the rate limit', async () => {
  const credentials = { email: 'student@example.com', password: 'StrongPass123' };
  const remainingOf = response => {
    const header = response.headers.get('ratelimit') || '';
    const match = header.match(/remaining=(\d+)/);
    return match ? Number(match[1]) : null;
  };

  let baselineRemaining = null;

  // The limit is 10; more successful sign-ins than that must all be allowed.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await call('POST', '/api/auth/login', { body: credentials });
    assert.equal(response.status, 200, `successful login ${attempt + 1} was rejected`);

    const remaining = remainingOf(response);
    if (baselineRemaining === null) baselineRemaining = remaining;
    else assert.equal(remaining, baselineRemaining, 'a successful login consumed the rate-limit budget');
  }
});

test('repeated login attempts are rate limited', async () => {
  let response = await call('POST', '/api/auth/login', {
    body: { email: 'student@example.com', password: 'WrongPass123' }
  });
  for (let attempt = 0; attempt < 12 && response.status !== 429; attempt += 1) {
    response = await call('POST', '/api/auth/login', {
      body: { email: 'student@example.com', password: 'WrongPass123' }
    });
  }
  assert.equal(response.status, 429);
  assert.match(response.body.message, /Too many login attempts/);
  assert.ok(response.headers.get('ratelimit'));
});

test('security headers are applied and the JSON body limit is enforced', async () => {
  const health = await call('GET', '/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.database, 'connected');
  assert.equal(health.headers.get('x-powered-by'), null);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(health.headers.get('content-security-policy'));
});

test('unknown routes return a JSON 404 instead of HTML', async () => {
  const response = await call('GET', '/api/nope');
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /GET \/api\/nope not found/);
  assert.match(response.headers.get('content-type') || '', /application\/json/);
});
