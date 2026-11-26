import Enrollment from '../models/Enrollment.js';

const isCoursePair = key =>
  Object.keys(key).length === 2 && key.student === 1 && key.course === 1;
const isSubjectPair = key =>
  Object.keys(key).length === 3 && key.student === 1 && key.track === 1 && key.subjectKey === 1;

/**
 * Day 10 shipped a unique index on { student, course } with no partial filter.
 * A CBSE subject enrolment has no course, so on an existing database both
 * subject rows index as a null course and the second one fails with E11000.
 *
 * Drop those legacy index variants, then let Mongoose create the partial
 * indexes declared in the schema. Safe to run on every boot.
 */
export async function ensureEnrollmentIndexes() {
  const collection = Enrollment.collection;

  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    // A brand-new database has no collection to list yet.
    if (error?.codeName !== 'NamespaceNotFound') throw error;
  }

  const dropped = [];
  for (const index of indexes) {
    if (index.name === '_id_' || index.partialFilterExpression) continue;
    if (isCoursePair(index.key) || isSubjectPair(index.key)) {
      await collection.dropIndex(index.name);
      dropped.push(index.name);
    }
  }

  await Enrollment.createIndexes();
  return dropped;
}
