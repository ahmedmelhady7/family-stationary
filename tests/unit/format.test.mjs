import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, formatDate, formatNumber } from '../../src/scripts/utils/format.js';

test('formatters return localized strings', () => {
  const price = formatPrice(12.5);
  assert.match(price, /12\.50|E£|EGP/);

  const date = formatDate('2026-02-11T00:00:00.000Z');
  assert.equal(typeof date, 'string');
  assert.ok(date.length > 0);

  const number = formatNumber(12345);
  assert.equal(typeof number, 'string');
});
