'use strict';

/**
 * Canonical ALEX receipt reference parser.
 *
 * Accepted shape (after trimming surrounding whitespace):
 *
 *   R-YYYYMMDD-NNN
 *
 * - The leading "R" is matched case-insensitively (ASCII only).
 * - YYYY, MM, DD must form a real calendar date (leap years honoured).
 * - NNN is a zero-padded 3 digit serial; "000" is not a valid serial.
 * - No extra characters (leading, trailing or embedded) are tolerated once
 *   surrounding whitespace has been removed.
 */

const RECEIPT_REFERENCE_PATTERN = /^([Rr])-(\d{4})(\d{2})(\d{2})-(\d{3})$/;

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

/**
 * Parse and normalize a canonical ALEX receipt reference.
 *
 * @param {unknown} input - candidate receipt reference string.
 * @returns {{ canonical: string, date: string, serial: number }}
 * @throws {TypeError} when input is not a string.
 * @throws {RangeError} when input does not match the required shape or
 *   encodes an impossible calendar date / serial value.
 */
function parseReceiptReference(input) {
  if (typeof input !== 'string') {
    throw new TypeError('parseReceiptReference: input must be a string');
  }

  const trimmed = input.trim();
  const match = RECEIPT_REFERENCE_PATTERN.exec(trimmed);

  if (!match) {
    throw new RangeError(
      `parseReceiptReference: "${input}" does not match the required R-YYYYMMDD-NNN format`
    );
  }

  const [, , yearStr, monthStr, dayStr, serialStr] = match;

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    throw new RangeError(`parseReceiptReference: month "${monthStr}" is out of range`);
  }

  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(
      `parseReceiptReference: day "${dayStr}" is invalid for ${yearStr}-${monthStr}`
    );
  }

  if (serialStr === '000') {
    throw new RangeError('parseReceiptReference: serial "000" is not allowed');
  }

  // NOTE: the canonical reference keeps YYYYMMDD as one contiguous block
  // (no dashes between year/month/day) -- only the ISO `date` field below
  // is dash-separated. Reusing the dashed date string here was the exact
  // bug a prior draft of this module shipped (canonical came out as
  // "R-2024-02-29-123" instead of "R-20240229-123").
  const canonical = `R-${yearStr}${monthStr}${dayStr}-${serialStr}`;
  const date = `${yearStr}-${monthStr}-${dayStr}`;
  const serial = Number(serialStr);

  return { canonical, date, serial };
}

module.exports = { parseReceiptReference };
