import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

const PASSWORD = 'StrongPass123';
const SUBJECT_A = '6b088185e7fa72ef842e06e7';
const SUBJECT_B = '6b088185e7fa72ef842e0743';

let mongo;
let server;
let baseUrl;
let studentToken;
let otherToken;

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
  return { status: response.status, body: json };
}

async function signupAndLogin(name, email) {
  const signup = await call('POST', '/api/auth/signup', { body: { name, email, password: PASSWORD } });
  assert.equal(signup.status, 201);
  const login = await call('POST', '/api/auth/login', { body: { email, password: PASSWORD } });
  assert.equal(login.status, 200);
  return login.body.token;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_study_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  studentToken = await signupAndLogin('Study Student', 'study@example.com');
  otherToken = await signupAndLogin('Other Student', 'other-study@example.com');
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('a new account starts with an empty study setup', async () => {
  const response = await call('GET', '/api/study', { token: studentToken });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.study, { selected: [], classes: {} });
});

test('saving subjects and class picks returns them on the next visit', async () => {
  const saved = await call('PUT', '/api/study', {
    token: studentToken,
    body: {
      selected: [SUBJECT_A, SUBJECT_B],
      classes: { [SUBJECT_A]: { trackId: 'class-11', label: 'Class 11' } }
    }
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.body.study.selected, [SUBJECT_A, SUBJECT_B]);

  const reloaded = await call('GET', '/api/study', { token: studentToken });
  assert.deepEqual(reloaded.body.study.selected, [SUBJECT_A, SUBJECT_B]);
  assert.deepEqual(reloaded.body.study.classes[SUBJECT_A], { trackId: 'class-11', label: 'Class 11' });
});

test('one student cannot see another student’s study setup', async () => {
  const other = await call('GET', '/api/study', { token: otherToken });
  assert.equal(other.status, 200);
  assert.deepEqual(other.body.study.selected, []);
});

test('junk ids and malformed class picks are dropped, and repeats collapse', async () => {
  const response = await call('PUT', '/api/study', {
    token: studentToken,
    body: {
      selected: [SUBJECT_A, SUBJECT_A, 'not-an-id', 42, null],
      classes: {
        [SUBJECT_B]: { trackId: 'class-9', label: 'Class 9' },
        bad: { trackId: 'class-9', label: 'Class 9' },
        [SUBJECT_A]: { trackId: 'class-11' }
      }
    }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.study.selected, [SUBJECT_A]);
  assert.deepEqual(response.body.study.classes, { [SUBJECT_B]: { trackId: 'class-9', label: 'Class 9' } });
});

test('the study route needs a signed-in account', async () => {
  const read = await call('GET', '/api/study');
  assert.equal(read.status, 401);
  const write = await call('PUT', '/api/study', { body: { selected: [SUBJECT_A] } });
  assert.equal(write.status, 401);
});
