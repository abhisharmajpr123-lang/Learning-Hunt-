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
let teacherToken;
let studentToken;
let otherStudentToken;
let developerToken;
let subjectId;
let publishedCourseId;
let draftCourseId;

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

async function createCourse(token, title, extra = {}) {
  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token,
    body: { title, published: true, ...extra }
  });
  assert.equal(created.status, 201);
  return created.body.course.id;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_enrollments_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Dev Admin', email: 'dev@example.com', password: PASSWORD } })).status, 201);
  await User.updateOne({ email: 'dev@example.com' }, { $set: { role: 'developer' } });
  developerToken = (await call('POST', '/api/auth/login', { body: { email: 'dev@example.com', password: PASSWORD } })).body.token;

  teacherToken = await signupAndLogin('Course Teacher', 'teacher@example.com');
  await User.updateOne({ email: 'teacher@example.com' }, { $set: { role: 'teacher' } });
  teacherToken = (await call('POST', '/api/auth/login', { body: { email: 'teacher@example.com', password: PASSWORD } })).body.token;

  studentToken = await signupAndLogin('Meera Nair', 'meera@example.com');
  otherStudentToken = await signupAndLogin('Arjun Rao', 'arjun@example.com');

  const subject = await call('POST', '/api/subjects', {
    token: teacherToken,
    body: { name: 'Physics', category: 'Science', published: true }
  });
  assert.equal(subject.status, 201);
  subjectId = subject.body.subject.id;

  publishedCourseId = await createCourse(teacherToken, 'Motion and Forces');
  draftCourseId = await createCourse(teacherToken, 'Unfinished Course', { published: false });
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('enrolment endpoints require a token', async () => {
  const attempts = [
    await call('GET', '/api/enrollments/mine'),
    await call('POST', `/api/courses/${publishedCourseId}/enroll`),
    await call('DELETE', `/api/courses/${publishedCourseId}/enroll`)
  ];

  for (const attempt of attempts) {
    assert.equal(attempt.status, 401);
    assert.match(attempt.body.message, /Bearer token/);
  }
});

test('a student enrolls in a published course and cannot enroll twice', async () => {
  const enrolled = await call('POST', `/api/courses/${publishedCourseId}/enroll`, { token: studentToken });
  assert.equal(enrolled.status, 201);
  assert.equal(enrolled.body.enrollment.status, 'active');
  assert.equal(enrolled.body.enrollment.course.id, publishedCourseId);
  assert.equal(enrolled.body.enrollment.course.subject.name, 'Physics');
  assert.match(enrolled.body.message, /Motion and Forces/);

  const duplicate = await call('POST', `/api/courses/${publishedCourseId}/enroll`, { token: studentToken });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.message, /already enrolled/);

  const rows = await mongoose.connection.collection('enrollments').countDocuments({});
  assert.equal(rows, 1, 'a repeat enrolment must not create a second row');
});

test('only students can enroll, and only in a published course', async () => {
  const teacherAttempt = await call('POST', `/api/courses/${publishedCourseId}/enroll`, { token: teacherToken });
  assert.equal(teacherAttempt.status, 403);

  const developerAttempt = await call('POST', `/api/courses/${publishedCourseId}/enroll`, { token: developerToken });
  assert.equal(developerAttempt.status, 403);

  const teacherList = await call('GET', '/api/enrollments/mine', { token: teacherToken });
  assert.equal(teacherList.status, 403);

  const draft = await call('POST', `/api/courses/${draftCourseId}/enroll`, { token: otherStudentToken });
  assert.equal(draft.status, 409);
  assert.match(draft.body.message, /not published/);

  const unknown = await call('POST', '/api/courses/507f1f77bcf86cd799439011/enroll', { token: studentToken });
  assert.equal(unknown.status, 404);

  const malformed = await call('POST', '/api/courses/not-an-id/enroll', { token: studentToken });
  assert.equal(malformed.status, 404);
});

test('my learning lists only the requesting student\'s courses', async () => {
  const mine = await call('GET', '/api/enrollments/mine', { token: studentToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.total, 1);
  assert.equal(mine.body.enrollments[0].course.id, publishedCourseId);
  assert.equal(mine.body.enrollments[0].course.title, 'Motion and Forces');
  assert.equal(mine.body.enrollments[0].course.level, 'beginner');
  assert.equal(typeof mine.body.enrollments[0].course.sectionCount, 'number');
  assert.equal(typeof mine.body.enrollments[0].course.lessonCount, 'number');

  const other = await call('GET', '/api/enrollments/mine', { token: otherStudentToken });
  assert.equal(other.status, 200);
  assert.equal(other.body.total, 0);
  assert.deepEqual(other.body.enrollments, []);
});

test('a student can leave a course, and leaving twice is a 404', async () => {
  const left = await call('DELETE', `/api/courses/${publishedCourseId}/enroll`, { token: studentToken });
  assert.equal(left.status, 204);

  const list = await call('GET', '/api/enrollments/mine', { token: studentToken });
  assert.equal(list.body.total, 0);

  const again = await call('DELETE', `/api/courses/${publishedCourseId}/enroll`, { token: studentToken });
  assert.equal(again.status, 404);

  const reenrolled = await call('POST', `/api/courses/${publishedCourseId}/enroll`, { token: studentToken });
  assert.equal(reenrolled.status, 201, 'a student can enrol again after leaving');
});
