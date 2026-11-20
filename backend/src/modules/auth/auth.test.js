const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeSort, sanitizePageLimit, normalizeId } = require('../../utilities/crudFactory');

test('sanitizeSort accepts allowed fields and directions', () => {
  assert.equal(sanitizeSort('created_at:desc', { sortableFields: ['created_at', 'id'] }), '"created_at" DESC');
  assert.equal(sanitizeSort('id:asc', { sortableFields: ['created_at', 'id'] }), '"id" ASC');
});

test('sanitizeSort rejects invalid field or direction', () => {
  assert.throws(() => sanitizeSort('secret:desc', { sortableFields: ['created_at', 'id'] }), /Unsupported sort field/);
  assert.throws(() => sanitizeSort('id:sideways', { sortableFields: ['created_at', 'id'] }), /Sort direction/);
});

test('sanitizePageLimit enforces range limits', () => {
  assert.deepEqual(sanitizePageLimit(1, 10, 50), { page: 1, limit: 10 });
  assert.throws(() => sanitizePageLimit(0, 10, 50), /Page must be a positive integer/);
  assert.throws(() => sanitizePageLimit(1, 999, 50), /Limit must be between 1 and 50/);
});

test('normalizeId rejects invalid ids', () => {
  assert.equal(normalizeId('12'), 12);
  assert.throws(() => normalizeId('0'), /Invalid resource id/);
  assert.throws(() => normalizeId('abc'), /Invalid resource id/);
});
