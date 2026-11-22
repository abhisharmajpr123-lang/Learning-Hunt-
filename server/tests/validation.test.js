import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSignup, validateSubject } from '../utils/validation.js';

test('accepts a valid signup and normalizes name/email', () => {
  const result = validateSignup({ name: '  Demo Student ', email: ' STUDENT@example.com ', password: 'StrongPass123' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.cleanName, 'Demo Student');
  assert.equal(result.cleanEmail, 'student@example.com');
});

test('rejects missing fields and invalid email', () => {
  const result = validateSignup({});
  assert.ok(result.errors.length >= 3);
});

test('rejects weak passwords', () => {
  const result = validateSignup({ name: 'Student', email: 'student@example.com', password: 'password' });
  assert.ok(result.errors.some(error => error.toLowerCase().includes('password')));
});

test('rejects invalid email formats', () => {
  const result = validateSignup({ name: 'Student', email: 'not-an-email', password: 'StrongPass123' });
  assert.ok(result.errors.some(error => error.toLowerCase().includes('email')));
});

test('trims a valid subject and defaults to the fields that were sent', () => {
  const result = validateSubject({ name: '  Mathematics ', category: ' Science ', description: ' Algebra. ', published: true });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.clean, {
    name: 'Mathematics',
    category: 'Science',
    description: 'Algebra.',
    published: true
  });
});

test('rejects an incomplete subject', () => {
  const result = validateSubject({});
  assert.ok(result.errors.some(error => error.toLowerCase().includes('name')));
  assert.ok(result.errors.some(error => error.toLowerCase().includes('category')));
});

test('rejects a subject with over-long fields or a non-boolean published flag', () => {
  const result = validateSubject({ name: 'x'.repeat(81), category: 'Science', description: 'y'.repeat(501), published: 'yes' });
  assert.equal(result.errors.length, 3);
});

test('a partial subject update validates only the fields that were sent', () => {
  const result = validateSubject({ published: false }, { partial: true });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.clean, { published: false });
});
