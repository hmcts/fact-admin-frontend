import { escapeCsvValue, serialiseCsv, serialiseCsvRow } from '../../../main/utils/csv';

describe('CSV utilities', () => {
  test('leaves simple values unquoted and escapes special values', () => {
    expect(escapeCsvValue('simple')).toBe('simple');
    expect(escapeCsvValue('with, comma')).toBe('"with, comma"');
    expect(escapeCsvValue('with "quotes"')).toBe('"with ""quotes"""');
    expect(escapeCsvValue('two\r\nlines')).toBe('"two\nlines"');
  });

  test('supports always quoting values', () => {
    expect(serialiseCsvRow(['one', 'two'], { alwaysQuote: true })).toBe('"one","two"');
  });

  test('can preserve line endings for existing streaming exports', () => {
    expect(escapeCsvValue('two\r\nlines', { alwaysQuote: true, normaliseLineEndings: false })).toBe('"two\r\nlines"');
  });

  test('serialises rows without adding a trailing newline', () => {
    expect(
      serialiseCsv([
        ['one', 'two'],
        ['three', 'four'],
      ])
    ).toBe('one,two\nthree,four');
  });
});
