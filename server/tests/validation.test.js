import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSignup } from '../utils/validation.js';

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
