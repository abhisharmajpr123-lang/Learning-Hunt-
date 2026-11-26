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
let studentToken;
let otherStudentToken;
let teacherToken;

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
  await mongoose.connect(mongo.getUri('learnhunt_curriculum_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  studentToken = await signupAndLogin('Meera Nair', 'meera@example.com');
  otherStudentToken = await signupAndLogin('Arjun Rao', 'arjun@example.com');
  await call('POST', '/api/auth/signup', { body: { name: 'Priya Sharma', email: 'teacher@example.com', password: PASSWORD } });
  await User.updateOne({ email: 'teacher@example.com' }, { $set: { role: 'teacher' } });
  teacherToken = (await call('POST', '/api/auth/login', { body: { email: 'teacher@example.com', password: PASSWORD } })).body.token;
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('the curriculum requires a bearer token', async () => {
  const attempts = [
    await call('GET', '/api/curriculum'),
    await call('GET', '/api/curriculum/class-9'),
    await call('GET', '/api/curriculum/class-9/mathematics'),
    await call('POST', '/api/curriculum/class-9/mathematics/enrol')
  ];

  for (const attempt of attempts) {
    assert.equal(attempt.status, 401);
    assert.match(attempt.body.message, /Bearer token/);
  }
});

test('the catalogue lists classes 9-12, JEE and NEET from the CBSE syllabus', async () => {
  const tracks = await call('GET', '/api/curriculum', { token: studentToken });
  assert.equal(tracks.status, 200);
  assert.deepEqual(
    tracks.body.tracks.map(track => track.id),
    ['class-9', 'class-10', 'class-11', 'class-12', 'jee', 'neet']
  );
  assert.match(tracks.body.source, /cbseacademic\.nic\.in/);

  const class9 = await call('GET', '/api/curriculum/class-9', { token: studentToken });
  assert.equal(class9.status, 200);
  assert.equal(class9.body.track.label, 'Class 9');
  const mathematics = class9.body.track.subjects.find(subject => subject.id === 'mathematics');
  assert.equal(mathematics.name, 'Mathematics');
  assert.equal(mathematics.unitCount, 6);
  assert.equal(mathematics.chapterCount, 12);

  const syllabus = await call('GET', '/api/curriculum/class-9/mathematics', { token: studentToken });
  assert.equal(syllabus.status, 200);
  assert.equal(syllabus.body.subject.name, 'Mathematics');
  assert.equal(syllabus.body.units[0].chapters[0], 'Real Numbers');
  assert.match(syllabus.body.source, /cbseacademic\.nic\.in/);

  const jee = await call('GET', '/api/curriculum/jee', { token: studentToken });
  assert.equal(jee.body.track.kind, 'exam');
  assert.deepEqual(jee.body.track.subjects.map(subject => subject.id), ['physics', 'chemistry', 'mathematics']);

  const unknown = await call('GET', '/api/curriculum/class-13', { token: studentToken });
  assert.equal(unknown.status, 404);
});

test('a student enrols in a CBSE subject once and it lands in My learning', async () => {
  const enrolled = await call('POST', '/api/curriculum/class-9/mathematics/enrol', { token: studentToken });
  assert.equal(enrolled.status, 201);
  assert.equal(enrolled.body.enrollment.kind, 'subject');
  assert.equal(enrolled.body.enrollment.subject.id, 'mathematics');
  assert.equal(enrolled.body.enrollment.subject.name, 'Mathematics');
  assert.equal(enrolled.body.enrollment.subject.trackLabel, 'Class 9');
  assert.match(enrolled.body.message, /Class 9/);

  const duplicate = await call('POST', '/api/curriculum/class-9/mathematics/enrol', { token: studentToken });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.message, /already enrolled/);

  const mine = await call('GET', '/api/enrollments/mine', { token: studentToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.total, 1);
  assert.equal(mine.body.enrollments[0].kind, 'subject');
  assert.equal(mine.body.enrollments[0].subject.trackId, 'class-9');

  const other = await call('GET', '/api/enrollments/mine', { token: otherStudentToken });
  assert.equal(other.body.total, 0);
});

test('only students enrol, and only in a class the catalogue knows', async () => {
  const teacherAttempt = await call('POST', '/api/curriculum/class-9/science/enrol', { token: teacherToken });
  assert.equal(teacherAttempt.status, 403);

  const unknownSubject = await call('POST', '/api/curriculum/class-9/biology/enrol', { token: otherStudentToken });
  assert.equal(unknownSubject.status, 404);

  const unknownTrack = await call('POST', '/api/curriculum/class-13/mathematics/enrol', { token: otherStudentToken });
  assert.equal(unknownTrack.status, 404);
});

test('a student can leave a subject, and leaving twice is a 404', async () => {
  const left = await call('DELETE', '/api/curriculum/class-9/mathematics/enrol', { token: studentToken });
  assert.equal(left.status, 204);

  const list = await call('GET', '/api/enrollments/mine', { token: studentToken });
  assert.equal(list.body.total, 0);

  const again = await call('DELETE', '/api/curriculum/class-9/mathematics/enrol', { token: studentToken });
  assert.equal(again.status, 404);
});
