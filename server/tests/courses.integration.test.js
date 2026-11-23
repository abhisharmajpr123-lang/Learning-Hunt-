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
  return login.body;
}

async function createSubject(token, name, extra = {}) {
  const created = await call('POST', '/api/subjects', { token, body: { name, category: 'Science', ...extra } });
  assert.equal(created.status, 201);
  return created.body.subject.id;
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_courses_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  ownerToken = (await signupAndLogin('Owner Teacher', 'owner@example.com')).token;
  otherToken = (await signupAndLogin('Other Student', 'other@example.com')).token;
  await User.create({ name: 'Dev Admin', email: 'dev@example.com', password: PASSWORD, role: 'developer' });
  developerToken = (await call('POST', '/api/auth/login', { body: { email: 'dev@example.com', password: PASSWORD } })).body.token;

  subjectId = await createSubject(ownerToken, 'Mathematics', { published: true });
}, { timeout: 240000 });

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('every course endpoint rejects requests without a token', async () => {
  const id = '507f1f77bcf86cd799439011';
  const attempts = [
    await call('GET', '/api/courses'),
    await call('GET', `/api/courses/${id}`),
    await call('PATCH', `/api/courses/${id}`, { body: { title: 'Updated' } }),
    await call('DELETE', `/api/courses/${id}`),
    await call('GET', `/api/subjects/${id}/courses`),
    await call('POST', `/api/subjects/${id}/courses`, { body: { title: 'Algebra' } }),
    await call('POST', `/api/courses/${id}/sections`, { body: { title: 'Basics' } })
  ];

  for (const attempt of attempts) {
    assert.equal(attempt.status, 401);
    assert.match(attempt.body.message, /Bearer token/);
  }
});

test('a course is created under a subject with numbered sections and lessons', async () => {
  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: {
      title: '  Algebra Foundations ',
      description: 'Start from variables.',
      level: 'beginner',
      published: true,
      sections: [
        {
          title: 'Getting Started',
          lessons: [
            { title: 'What is a variable?', durationMinutes: 12 },
            { title: 'Expressions', content: 'Read and write expressions.', durationMinutes: 18 }
          ]
        },
        { title: 'Solving Equations', lessons: [{ title: 'One-step equations' }] }
      ]
    }
  });

  assert.equal(created.status, 201);
  const course = created.body.course;
  assert.equal(course.title, 'Algebra Foundations');
  assert.equal(course.level, 'beginner');
  assert.equal(course.sectionCount, 2);
  assert.equal(course.lessonCount, 3);
  assert.equal(course.totalDurationMinutes, 30);
  assert.equal(course.isEmpty, false);
  assert.equal(course.sections[0].number, 1);
  assert.equal(course.sections[1].number, 2);
  assert.equal(course.sections[0].lessons[0].number, 1);
  assert.equal(course.sections[0].lessons[1].number, 2);
  assert.equal(course.sections[1].lessons[0].number, 1);
  assert.equal(course.sections[1].lessons[0].courseNumber, 3);

  const detail = await call('GET', `/api/courses/${course.id}`, { token: otherToken });
  assert.equal(detail.status, 200);
  assert.deepEqual(
    detail.body.course.sections.map(section => section.title),
    ['Getting Started', 'Solving Equations']
  );

  const list = await call('GET', `/api/subjects/${subjectId}/courses`, { token: otherToken });
  assert.equal(list.status, 200);
  assert.equal(list.body.count, 1);
  assert.equal(list.body.courses[0].outline[0].lessonCount, 2);
  assert.equal(list.body.courses[0].outline[1].lessons[0].number, 1);
});

test('a course without lessons reports a helpful empty state', async () => {
  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: { title: 'Empty Draft' }
  });
  assert.equal(created.status, 201);

  const course = created.body.course;
  assert.equal(course.isEmpty, true);
  assert.equal(course.lessonCount, 0);
  assert.deepEqual(course.sections, []);
  assert.equal(course.message, 'This course has no lessons yet.');
  assert.deepEqual(course.outline ?? [], []);
});

test('sections and lessons can be added one at a time and are renumbered automatically', async () => {
  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: { title: 'Geometry' }
  });
  const courseId = created.body.course.id;

  const section = await call('POST', `/api/courses/${courseId}/sections`, {
    token: ownerToken,
    body: { title: 'Angles' }
  });
  assert.equal(section.status, 201);
  assert.equal(section.body.message, 'Section 1 added');
  const sectionId = section.body.course.sections[0].id;

  const first = await call('POST', `/api/courses/${courseId}/sections/${sectionId}/lessons`, {
    token: ownerToken,
    body: { title: 'Acute and obtuse' }
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.message, 'Lesson 1 added');

  const second = await call('POST', `/api/courses/${courseId}/sections/${sectionId}/lessons`, {
    token: ownerToken,
    body: { title: 'Straight lines' }
  });
  assert.equal(second.status, 201);
  assert.equal(second.body.message, 'Lesson 2 added');
  assert.deepEqual(
    second.body.course.sections[0].lessons.map(lesson => lesson.number),
    [1, 2]
  );

  const missingSection = await call('POST', `/api/courses/${courseId}/sections/507f1f77bcf86cd799439011/lessons`, {
    token: ownerToken,
    body: { title: 'Ghost lesson' }
  });
  assert.equal(missingSection.status, 404);

  const missingCourse = await call('POST', '/api/courses/507f1f77bcf86cd799439011/sections', {
    token: ownerToken,
    body: { title: 'Ghost section' }
  });
  assert.equal(missingCourse.status, 404);

  const malformed = await call('GET', '/api/courses/not-an-id', { token: ownerToken });
  assert.equal(malformed.status, 404);
});

test('only the owning teacher or a developer can create, update or delete courses', async () => {
  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: { title: 'Trigonometry' }
  });
  const courseId = created.body.course.id;

  const otherCreate = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: otherToken,
    body: { title: 'Hijacked course' }
  });
  assert.equal(otherCreate.status, 403);

  const otherPatch = await call('PATCH', `/api/courses/${courseId}`, { token: otherToken, body: { title: 'Renamed' } });
  assert.equal(otherPatch.status, 403);

  const otherSection = await call('POST', `/api/courses/${courseId}/sections`, {
    token: otherToken,
    body: { title: 'Sneaky section' }
  });
  assert.equal(otherSection.status, 403);

  const devPatch = await call('PATCH', `/api/courses/${courseId}`, {
    token: developerToken,
    body: { published: true, level: 'advanced' }
  });
  assert.equal(devPatch.status, 200);
  assert.equal(devPatch.body.course.published, true);
  assert.equal(devPatch.body.course.level, 'advanced');

  const otherDelete = await call('DELETE', `/api/courses/${courseId}`, { token: otherToken });
  assert.equal(otherDelete.status, 403);

  const devDelete = await call('DELETE', `/api/courses/${courseId}`, { token: developerToken });
  assert.equal(devDelete.status, 204);
});

test('rejects invalid course, section and lesson input', async () => {
  const badCourse = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: {
      title: 'A',
      level: 'expert',
      sections: [{ title: '', lessons: [{ title: 'x', durationMinutes: 900 }] }]
    }
  });
  assert.equal(badCourse.status, 400);
  assert.ok(badCourse.body.errors.length >= 4);

  const created = await call('POST', `/api/subjects/${subjectId}/courses`, {
    token: ownerToken,
    body: { title: 'Statistics', level: 'intermediate' }
  });
  const courseId = created.body.course.id;

  const emptyPatch = await call('PATCH', `/api/courses/${courseId}`, { token: ownerToken, body: {} });
  assert.equal(emptyPatch.status, 400);

  const badSection = await call('POST', `/api/courses/${courseId}/sections`, { token: ownerToken, body: { title: 'x' } });
  assert.equal(badSection.status, 400);
});

test('course list supports case-insensitive search, filters and pagination metadata', async () => {
  const searchSubject = await createSubject(ownerToken, 'Physics');
  await call('POST', `/api/subjects/${searchSubject}/courses`, {
    token: ownerToken,
    body: { title: 'Quantum Mechanics', description: 'Wave functions and uncertainty.', level: 'advanced' }
  });
  await call('POST', `/api/subjects/${searchSubject}/courses`, {
    token: ownerToken,
    body: { title: 'Thermodynamics', description: 'Heat and entropy.', level: 'beginner', published: true }
  });
  await call('POST', `/api/subjects/${searchSubject}/courses`, {
    token: ownerToken,
    body: { title: 'Optics Basics', description: 'Light and lenses.', level: 'beginner' }
  });

  const lower = await call('GET', `/api/subjects/${searchSubject}/courses?q=quantum`, { token: ownerToken });
  assert.equal(lower.status, 200);
  assert.equal(lower.body.count, 1);
  assert.equal(lower.body.courses[0].title, 'Quantum Mechanics');

  const upper = await call('GET', '/api/courses?q=THERMODYNAMICS', { token: ownerToken });
  assert.equal(upper.status, 200);
  assert.equal(upper.body.count, 1);
  assert.equal(upper.body.courses[0].title, 'Thermodynamics');

  const byDescription = await call('GET', '/api/courses?q=entropy', { token: ownerToken });
  assert.equal(byDescription.body.count, 1);

  const beginners = await call('GET', `/api/subjects/${searchSubject}/courses?level=beginner`, { token: ownerToken });
  assert.equal(beginners.body.count, 2);
  assert.deepEqual(beginners.body.pagination, {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const published = await call('GET', '/api/courses?subject=' + searchSubject + '&published=true', { token: ownerToken });
  assert.equal(published.body.count, 1);
  assert.equal(published.body.courses[0].title, 'Thermodynamics');

  const pageOne = await call('GET', `/api/subjects/${searchSubject}/courses?limit=2`, { token: ownerToken });
  assert.equal(pageOne.body.count, 2);
  assert.equal(pageOne.body.pagination.total, 3);
  assert.equal(pageOne.body.pagination.totalPages, 2);
  assert.equal(pageOne.body.pagination.hasNextPage, true);

  const pageTwo = await call('GET', `/api/subjects/${searchSubject}/courses?limit=2&page=2`, { token: ownerToken });
  assert.equal(pageTwo.body.count, 1);
  assert.equal(pageTwo.body.pagination.page, 2);
  assert.equal(pageTwo.body.pagination.hasPreviousPage, true);

  const badPage = await call('GET', '/api/courses?page=0', { token: ownerToken });
  assert.equal(badPage.status, 400);

  const badLevel = await call('GET', '/api/courses?level=expert', { token: ownerToken });
  assert.equal(badLevel.status, 400);

  const unknownSubject = await call('GET', '/api/subjects/507f1f77bcf86cd799439011/courses', { token: ownerToken });
  assert.equal(unknownSubject.status, 404);
});
