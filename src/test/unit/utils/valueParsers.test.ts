import {
  parseBoolean,
  parseLiftMetric,
  parseOptionalString,
  parseString,
} from '../../../main/utils/valueParsers';

describe('valueParsers', () => {
  describe('parseBoolean', () => {
    test('returns true for boolean true and string true', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean('true')).toBe(true);
    });

    test('returns false for boolean false and string false', () => {
      expect(parseBoolean(false)).toBe(false);
      expect(parseBoolean('false')).toBe(false);
    });

    test('returns undefined for unsupported values', () => {
      expect(parseBoolean('TRUE')).toBeUndefined();
      expect(parseBoolean('yes')).toBeUndefined();
      expect(parseBoolean(1)).toBeUndefined();
      expect(parseBoolean(null)).toBeUndefined();
      expect(parseBoolean(undefined)).toBeUndefined();
    });
  });

  describe('parseLiftMetric', () => {
    test('returns finite numbers unchanged', () => {
      expect(parseLiftMetric(0)).toBe(0);
      expect(parseLiftMetric(12.5)).toBe(12.5);
    });

    test('parses numeric strings, including trimmed values', () => {
      expect(parseLiftMetric('10')).toBe(10);
      expect(parseLiftMetric('  7.25  ')).toBe(7.25);
    });

    test('returns undefined for non-string/non-number and blank strings', () => {
      expect(parseLiftMetric('')).toBeUndefined();
      expect(parseLiftMetric('   ')).toBeUndefined();
      expect(parseLiftMetric(null)).toBeUndefined();
      expect(parseLiftMetric(undefined)).toBeUndefined();
      expect(parseLiftMetric({ value: 1 })).toBeUndefined();
    });

    test('returns NaN for invalid numeric values', () => {
      expect(Number.isNaN(parseLiftMetric('abc'))).toBe(true);
      expect(Number.isNaN(parseLiftMetric(Number.POSITIVE_INFINITY))).toBe(true);
      expect(Number.isNaN(parseLiftMetric(Number.NaN))).toBe(true);
    });
  });

  describe('parseString', () => {
    test('returns string values directly', () => {
      expect(parseString('court-id')).toBe('court-id');
    });

    test('returns the first string when value is an array', () => {
      expect(parseString(['first', 'second'])).toBe('first');
    });

    test('returns an empty string when no string value is available', () => {
      expect(parseString(undefined)).toBe('');
      expect(parseString([1, false])).toBe('');
    });
  });

  describe('parseOptionalString', () => {
    test('returns string values directly', () => {
      expect(parseOptionalString('yes')).toBe('yes');
    });

    test('returns the first string when value is an array', () => {
      expect(parseOptionalString([1, 'yes', 'no'])).toBe('yes');
    });

    test('returns undefined when no string value is available', () => {
      expect(parseOptionalString(undefined)).toBeUndefined();
      expect(parseOptionalString([1, false])).toBeUndefined();
    });
  });
});
