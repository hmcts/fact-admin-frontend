import { parseCourtAreasOfLawResponse } from '../../../main/schemas/areaOfLawSchema';

describe('parseCourtAreasOfLawResponse', () => {
  const validKey =
    'AreaOfLawType(id=66666666-6666-4666-8666-666666666666, name=Divorce, nameCy=Ysgariad, externalLink=null, externalLinkCy=null, displayName=null, displayNameCy=null)';

  test('parses valid response map entries', () => {
    const result = parseCourtAreasOfLawResponse({ [validKey]: true });

    expect(result).toEqual([
      {
        areaOfLawType: {
          id: '66666666-6666-4666-8666-666666666666',
          name: 'Divorce',
          nameCy: 'Ysgariad',
          externalLink: null,
          externalLinkCy: null,
          displayName: null,
          displayNameCy: null,
        },
        selected: true,
      },
    ]);
  });

  test('keeps non-null optional strings in parsed area of law type', () => {
    const key =
      'AreaOfLawType(id=77777777-7777-4777-8777-777777777777, name=Probate, nameCy=Profiant, externalLink=https://example.test, externalLinkCy=https://example.test/cy, displayName=Probate and wills, displayNameCy=Profiant ac ewyllysiau)';

    const result = parseCourtAreasOfLawResponse({ [key]: false });

    expect(result[0].areaOfLawType.externalLink).toBe('https://example.test');
    expect(result[0].areaOfLawType.externalLinkCy).toBe('https://example.test/cy');
    expect(result[0].areaOfLawType.displayName).toBe('Probate and wills');
    expect(result[0].areaOfLawType.displayNameCy).toBe('Profiant ac ewyllysiau');
    expect(result[0].selected).toBe(false);
  });

  test('throws for non-object payloads', () => {
    expect(() => parseCourtAreasOfLawResponse(null)).toThrow('Invalid court areas of law response');
    expect(() => parseCourtAreasOfLawResponse('invalid')).toThrow('Invalid court areas of law response');
  });

  test('throws when selected value is not a boolean', () => {
    expect(() => parseCourtAreasOfLawResponse({ [validKey]: 'true' })).toThrow('Invalid court areas of law response');
  });

  test('throws when area of law key does not use the expected prefix/suffix', () => {
    expect(() => parseCourtAreasOfLawResponse({ 'OtherType(id=1)': true })).toThrow(
      'Invalid court areas of law response'
    );
  });

  test('throws when area of law key contains unknown fields', () => {
    const invalidKey =
      'AreaOfLawType(unknownField=UnknowValue, id=66666666-6666-4666-8666-666666666666, name=Divorce, nameCy=Ysgariad, externalLink=null, externalLinkCy=null, displayName=null, displayNameCy=null)';

    expect(() => parseCourtAreasOfLawResponse({ [invalidKey]: true })).toThrow('Invalid court areas of law response');
  });

  test('throws when required area of law fields are missing', () => {
    const incompleteKey = 'AreaOfLawType(id=66666666-6666-4666-8666-666666666666, name=Divorce)';

    expect(() => parseCourtAreasOfLawResponse({ [incompleteKey]: true })).toThrow(
      'Failed to parse areaOfLawTypeSchema'
    );
  });
});
