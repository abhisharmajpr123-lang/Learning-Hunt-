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

test('a new account starts with an empty study setup and no progress', async () => {
  const { status, body } = await call('GET', '/api/study', { token: studentToken });
  assert.equal(status, 200);
  assert.deepEqual(body.study.selected, []);
  assert.deepEqual(body.study.classes, {});
  assert.deepEqual(body.study.completed, []);
  assert.deepEqual(body.study.activities, []);
  assert.equal(body.study.rewards.xp, 0);
  assert.equal(body.study.rewards.streak, 0);
  assert.equal(body.study.rewards.daily.video, 0);
});

test('subjects, class picks and progress all come back on the next visit', async () => {
  const activity = {
    id: 1,
    type: 'video',
    title: 'Newton’s laws of motion',
    subject: 'Physics',
    detail: 'Watched 18 of 22 minutes',
    date: 'Today',
    score: null,
    createdAt: 1730000000000
  };
  const saved = await call('PUT', '/api/study', {
    token: studentToken,
    body: {
      selected: [SUBJECT_A, SUBJECT_B],
      classes: { [SUBJECT_A]: { trackId: 'class-11', label: 'Class 11' } },
      progress: {
        completed: ['v1', 'v2'],
        activities: [activity],
        rewards: {
          xp: 120,
          streak: 3,
          lastActive: '2026-11-26',
          daily: { date: '2026-11-26', video: 1, quiz: 0, assignment: 0, test: 0, total: 1 }
        }
      }
    }
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.body.study.completed, ['v1', 'v2']);
  assert.equal(saved.body.study.rewards.xp, 120);

  const reloaded = await call('GET', '/api/study', { token: studentToken });
  assert.deepEqual(reloaded.body.study.selected, [SUBJECT_A, SUBJECT_B]);
  assert.deepEqual(reloaded.body.study.classes[SUBJECT_A], { trackId: 'class-11', label: 'Class 11' });
  assert.deepEqual(reloaded.body.study.completed, ['v1', 'v2']);
  assert.deepEqual(reloaded.body.study.activities, [activity]);
  assert.deepEqual(reloaded.body.study.rewards, {
    xp: 120,
    streak: 3,
    lastActive: '2026-11-26',
    daily: { date: '2026-11-26', video: 1, quiz: 0, assignment: 0, test: 0, total: 1 }
  });
});

test('one student cannot see another student’s study setup or progress', async () => {
  const other = await call('GET', '/api/study', { token: otherToken });
  assert.equal(other.status, 200);
  assert.deepEqual(other.body.study.selected, []);
  assert.deepEqual(other.body.study.completed, []);
  assert.equal(other.body.study.rewards.xp, 0);
});

test('junk ids, malformed picks and impossible counters are dropped', async () => {
  const response = await call('PUT', '/api/study', {
    token: studentToken,
    body: {
      selected: [SUBJECT_A, SUBJECT_A, 'not-an-id', 42, null],
      classes: {
        [SUBJECT_B]: { trackId: 'class-9', label: 'Class 9' },
        bad: { trackId: 'class-9', label: 'Class 9' },
        [SUBJECT_A]: { trackId: 'class-11' }
      },
      progress: {
        completed: ['v1', 'v1', '', 7, 'x'.repeat(41)],
        activities: [
          { id: 2, type: 'quiz', title: 'Quadratic equations', subject: 'Mathematics', detail: '8 of 10 correct', date: 'Yesterday', score: 80 },
          { id: 3, type: 'unknown', title: 'Nope' },
          'not-an-activity'
        ],
        rewards: {
          xp: -50,
          streak: 2.7,
          lastActive: '26-11-2026',
          daily: { date: 'not-a-date', video: 3, quiz: -1, total: 4 }
        }
      }
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.study.selected, [SUBJECT_A]);
  assert.deepEqual(response.body.study.classes, { [SUBJECT_B]: { trackId: 'class-9', label: 'Class 9' } });
  assert.deepEqual(response.body.study.completed, ['v1']);
  assert.deepEqual(response.body.study.activities, [
    { id: 2, type: 'quiz', title: 'Quadratic equations', subject: 'Mathematics', detail: '8 of 10 correct', date: 'Yesterday', score: 80, createdAt: 0 }
  ]);
  assert.deepEqual(response.body.study.rewards, {
    xp: 0,
    streak: 2,
    lastActive: null,
    daily: { date: null, video: 3, quiz: 0, assignment: 0, test: 0, total: 4 }
  });
});

test('the study route needs a signed-in account', async () => {
  const read = await call('GET', '/api/study');
  assert.equal(read.status, 401);
  const write = await call('PUT', '/api/study', { body: { selected: [SUBJECT_A] } });
  assert.equal(write.status, 401);
});
