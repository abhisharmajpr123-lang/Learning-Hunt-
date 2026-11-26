import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;
let Enrollment;
let ensureEnrollmentIndexes;

before(async () => {
  mongo = await MongoMemoryServer.create();
  // The migration is what creates the indexes in this test, so model auto-indexing stays off.
  mongoose.set('autoIndex', false);
  await mongoose.connect(mongo.getUri('learnhunt_indexes_test'));

  // Reproduce the Day 10 database: the unique index shipped before subjects existed.
  await mongoose.connection.db
    .collection('enrollments')
    .createIndex({ student: 1, course: 1 }, { unique: true, name: 'student_1_course_1' });

  ({ default: Enrollment } = await import('../models/Enrollment.js'));
  ({ ensureEnrollmentIndexes } = await import('../db/indexes.js'));
}, { timeout: 240000 });

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const subject = (student, track, subjectKey, subjectName) => ({
  student,
  kind: 'subject',
  track,
  subjectKey,
  subjectName
});

test('the Day 10 index rejects a second CBSE subject enrolment', async () => {
  const student = new mongoose.Types.ObjectId();
  await Enrollment.create(subject(student, 'class-9', 'mathematics', 'Mathematics'));

  await assert.rejects(
    Enrollment.create(subject(student, 'class-9', 'science', 'Science')),
    error => error.code === 11000,
    'the legacy index must reproduce the reported failure'
  );
  await Enrollment.deleteMany({ student });
});

test('the migration replaces the legacy index and two subjects can coexist', async () => {
  const dropped = await ensureEnrollmentIndexes();
  assert.deepEqual(dropped, ['student_1_course_1']);

  const student = new mongoose.Types.ObjectId();
  await Enrollment.create(subject(student, 'class-9', 'mathematics', 'Mathematics'));
  await Enrollment.create(subject(student, 'class-9', 'science', 'Science'));
  assert.equal(await Enrollment.countDocuments({ student }), 2);

  await assert.rejects(
    Enrollment.create(subject(student, 'class-9', 'mathematics', 'Mathematics')),
    error => error.code === 11000,
    'the same subject still cannot be enrolled twice'
  );

  const indexes = await Enrollment.collection.indexes();
  const courseIndex = indexes.find(index => index.name === 'student_1_course_1');
  assert.ok(courseIndex?.unique, 'the course index still exists');
  assert.ok(
    courseIndex.partialFilterExpression?.course,
    'the course index only covers rows that have a course'
  );
  const subjectIndex = indexes.find(index => index.name === 'student_1_track_1_subjectKey_1');
  assert.ok(subjectIndex?.unique, 'one row per student + class + subject');
});

test('running the migration again changes nothing', async () => {
  const dropped = await ensureEnrollmentIndexes();
  assert.deepEqual(dropped, []);
});
