import { normaliseSelectedValues, sortAndSplitIntoColumns, toErrorSummary } from '../../../main/utils/formHelpers';

describe('formHelpers', () => {
  test('normalises scalar, array and comma-separated selections', () => {
    expect(normaliseSelectedValues('one')).toEqual(['one']);
    expect(normaliseSelectedValues('one,two', { splitCommas: true })).toEqual(['one', 'two']);
    expect(normaliseSelectedValues(['one', 2, 'two'])).toEqual(['one', 'two']);
    expect(normaliseSelectedValues(undefined)).toEqual([]);
  });

  test('builds error summary links', () => {
    expect(toErrorSummary({ name: 'Enter a name' })).toEqual([{ href: '#name', text: 'Enter a name' }]);
  });

  test('sorts and splits items into balanced columns', () => {
    expect(sortAndSplitIntoColumns([{ text: 'C' }, { text: 'A' }, { text: 'B' }], item => item.text)).toEqual({
      left: [{ text: 'A' }, { text: 'B' }],
      right: [{ text: 'C' }],
    });
  });
});
