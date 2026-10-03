const test = require('node:test');
const assert = require('node:assert/strict');

const { parseReceiptReference } = require('../src/receiptReference');

/** @type {Array<{name: string, input: any, ok: boolean, expected?: any, error?: any}>} */
const cases = [
  {
    name: 'valid - normalizes R prefix case and trims whitespace',
    input: '  r-20240229-123  ',
    ok: true,
    expected: {
      canonical: 'R-20240229-123',
      date: '2024-02-29',
      serial: 123,
    },
  },
  {
    name: 'leap year 2000 valid (Feb 29)',
    input: 'R-20000229-001',
    ok: true,
    expected: {
      canonical: 'R-20000229-001',
      date: '2000-02-29',
      serial: 1,
    },
  },
  {
    name: 'leap year 2100 invalid (Feb 29)',
    input: 'R-21000229-001',
    ok: false,
    error: RangeError,
  },
  {
    name: 'invalid month/day - April 31 rejected',
    input: 'R-20240431-001',
    ok: false,
    error: RangeError,
  },
  {
    name: 'invalid serial 000 rejected',
    input: 'R-20240101-000',
    ok: false,
    error: RangeError,
  },
  {
    name: 'whitespace only rejected (empty after trim)',
    input: '   ',
    ok: false,
    error: RangeError,
  },
  {
    name: 'wrong type - number rejected',
    input: 42,
    ok: false,
    error: TypeError,
  },
  {
    name: 'wrong type - null rejected',
    input: null,
    ok: false,
    error: TypeError,
  },
  {
    name: 'trailing junk rejected',
    input: 'R-20240101-123XYZ',
    ok: false,
    error: RangeError,
  },
  {
    name: 'extra characters before/after rejected',
    input: 'X R-20240101-123',
    ok: false,
    error: RangeError,
  },
];

for (const c of cases) {
  test(c.name, () => {
    if (!c.ok) {
      assert.throws(() => parseReceiptReference(c.input), c.error);
      return;
    }
    const out = parseReceiptReference(c.input);
    assert.deepEqual(out, c.expected);
  });
}

test('canonical reference has no dashes inside the YYYYMMDD block (regression guard)', () => {
  const { canonical } = parseReceiptReference('R-20240229-123');
  assert.equal(canonical, 'R-20240229-123');
  assert.equal(canonical.split('-').length, 3);
});
