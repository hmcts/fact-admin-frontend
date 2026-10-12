import {
  parseClampedNumber,
  validateIntegerQueryParameter,
  validateSortParameters,
} from '../../../main/utils/listFilterValidation';

describe('listFilterValidation', () => {
  test('parses and clamps numeric values', () => {
    expect(parseClampedNumber('50', 25, 100)).toBe(50);
    expect(parseClampedNumber('500', 25, 100)).toBe(100);
    expect(parseClampedNumber('invalid', 25, 100)).toBe(25);
  });

  test('validates integer query parameters', () => {
    const options = { href: '#main', maximum: 10, maximumError: 'too large', minimum: 1, minimumError: 'too small' };
    expect(validateIntegerQueryParameter('0', options)).toEqual({ href: '#main', text: 'too small' });
    expect(validateIntegerQueryParameter('11', options)).toEqual({ href: '#main', text: 'too large' });
    expect(validateIntegerQueryParameter('5', options)).toBeUndefined();
  });

  test('validates sort parameters in a stable order', () => {
    expect(validateSortParameters('invalid', 'sideways', ['name'], 'sort requires a field')).toEqual([
      { href: '#main-content', text: 'sortBy must be one of: name' },
      { href: '#main-content', text: 'sortOrder must be one of: asc, desc' },
    ]);
    expect(validateSortParameters(undefined, 'asc', ['name'], 'sort requires a field')).toEqual([
      { href: '#main-content', text: 'sort requires a field' },
    ]);
  });
});
