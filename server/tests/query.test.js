import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, paginationMeta, parsePagination, searchPattern } from '../utils/query.js';

test('pagination defaults to page 1 with 10 results per page', () => {
  const result = parsePagination({});
  assert.deepEqual(result.errors, []);
  assert.equal(result.page, 1);
  assert.equal(result.limit, 10);
  assert.equal(result.skip, 0);
});

test('pagination calculates the skip offset for later pages', () => {
  const result = parsePagination({ page: '3', limit: '5' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.skip, 10);
});

test('pagination rejects unsupported page and limit values', () => {
  assert.equal(parsePagination({ page: '0' }).errors.length, 1);
  assert.equal(parsePagination({ page: '2.5' }).errors.length, 1);
  assert.equal(parsePagination({ limit: '0' }).errors.length, 1);
  assert.equal(parsePagination({ limit: '51' }).errors.length, 1);
});

test('pagination metadata exposes totals and page flags', () => {
  assert.deepEqual(paginationMeta({ page: 2, limit: 5, total: 12 }), {
    total: 12,
    page: 2,
    limit: 5,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: true
  });
  assert.equal(paginationMeta({ page: 1, limit: 5, total: 0 }).totalPages, 0);
});

test('search input is escaped so regex characters are matched literally', () => {
  assert.equal(escapeRegex('C++ (basics)'), 'C\\+\\+ \\(basics\\)');
  assert.ok(searchPattern('math').flags.includes('i'));
  assert.ok(searchPattern('math').test('Advanced MATH'));
});
