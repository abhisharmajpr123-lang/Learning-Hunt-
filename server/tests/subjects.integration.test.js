import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

const PASSWORD = 'StrongPass123';
let mongo;
let server;
let baseUrl;
let ownerToken;
let otherToken;
let developerToken;
let subjectId;
let ownerId;

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

async function signupAndLogin(name, email) {
  const signup = await call('POST', '/api/auth/signup', { body: { name, email, password: PASSWORD } });
  assert.equal(signup.status, 201);
  const login = await call('POST', '/api/auth/login', { body: { email, password: PASSWORD } });
  assert.equal(login.status, 200);
  return login.body;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_subjects_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const owner = await signupAndLogin('Owner Teacher', 'owner@example.com');
  ownerToken = owner.token;
  ownerId = owner.user.id;
  otherToken = (await signupAndLogin('Other Student', 'other@example.com')).token;

  await User.create({ name: 'Dev Admin', email: 'dev@example.com', password: PASSWORD, role: 'developer' });
  developerToken = (await call('POST', '/api/auth/login', { body: { email: 'dev@example.com', password: PASSWORD } })).body.token;
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('every subject endpoint rejects requests without a token', async () => {
  const id = '507f1f77bcf86cd799439011';
  const attempts = [
    await call('GET', '/api/subjects'),
    await call('GET', `/api/subjects/${id}`),
    await call('POST', '/api/subjects', { body: { name: 'Physics', category: 'Science' } }),
    await call('PATCH', `/api/subjects/${id}`, { body: { name: 'Physics II' } }),
    await call('DELETE', `/api/subjects/${id}`)
  ];

  for (const attempt of attempts) {
    assert.equal(attempt.status, 401);
    assert.equal(attempt.body.success, false);
    assert.match(attempt.body.message, /Bearer token/);
  }
});

test('a signed-in teacher can create, read, update and delete a subject', async () => {
  const created = await call('POST', '/api/subjects', {
    token: ownerToken,
    body: { name: '  Mathematics ', category: 'Science', description: 'Algebra and calculus.', published: true }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.subject.name, 'Mathematics');
  assert.equal(created.body.subject.category, 'Science');
  assert.equal(created.body.subject.published, true);
  assert.equal(created.body.subject.teacher, ownerId);
  subjectId = created.body.subject.id;

  const list = await call('GET', '/api/subjects', { token: otherToken });
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);
  assert.equal(list.body.subjects[0].id, subjectId);

  const detail = await call('GET', `/api/subjects/${subjectId}`, { token: otherToken });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.subject.description, 'Algebra and calculus.');

  const updated = await call('PATCH', `/api/subjects/${subjectId}`, {
    token: ownerToken,
    body: { name: 'Advanced Mathematics', published: false }
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.subject.name, 'Advanced Mathematics');
  assert.equal(updated.body.subject.published, false);
  assert.equal(updated.body.subject.category, 'Science', 'untouched fields stay as they were');

  const removed = await call('DELETE', `/api/subjects/${subjectId}`, { token: ownerToken });
  assert.equal(removed.status, 204);

  const gone = await call('GET', `/api/subjects/${subjectId}`, { token: ownerToken });
  assert.equal(gone.status, 404);
});

test('rejects invalid input and blocks duplicate name/category pairs', async () => {
  const invalid = await call('POST', '/api/subjects', { token: ownerToken, body: { name: 'A', category: '' } });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.errors.length >= 2);

  const first = await call('POST', '/api/subjects', {
    token: ownerToken,
    body: { name: 'Physics', category: 'Science' }
  });
  assert.equal(first.status, 201);

  const duplicate = await call('POST', '/api/subjects', {
    token: ownerToken,
    body: { name: 'Physics', category: 'Science' }
  });
  assert.equal(duplicate.status, 409);

  const sameNameOtherCategory = await call('POST', '/api/subjects', {
    token: ownerToken,
    body: { name: 'Physics', category: 'Technology' }
  });
  assert.equal(sameNameOtherCategory.status, 201);
});

test('update and delete are limited to the owning teacher or a developer', async () => {
  const created = await call('POST', '/api/subjects', {
    token: ownerToken,
    body: { name: 'Chemistry', category: 'Science', published: true }
  });
  assert.equal(created.status, 201);
  const id = created.body.subject.id;

  const otherPatch = await call('PATCH', `/api/subjects/${id}`, { token: otherToken, body: { published: false } });
  assert.equal(otherPatch.status, 403);

  const otherDelete = await call('DELETE', `/api/subjects/${id}`, { token: otherToken });
  assert.equal(otherDelete.status, 403);

  const devPatch = await call('PATCH', `/api/subjects/${id}`, { token: developerToken, body: { published: false } });
  assert.equal(devPatch.status, 200);
  assert.equal(devPatch.body.subject.published, false);

  const devDelete = await call('DELETE', `/api/subjects/${id}`, { token: developerToken });
  assert.equal(devDelete.status, 204);
});

test('unknown and malformed subject ids return 404', async () => {
  const unknown = await call('GET', '/api/subjects/507f1f77bcf86cd799439011', { token: ownerToken });
  assert.equal(unknown.status, 404);

  const malformed = await call('GET', '/api/subjects/not-an-id', { token: ownerToken });
  assert.equal(malformed.status, 404);
  assert.equal(malformed.body.success, false);
});
