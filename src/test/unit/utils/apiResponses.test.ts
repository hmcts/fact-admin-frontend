import { HttpStatusCode } from 'axios';

import { isHttpStatusCode, isSuccessfulHttpStatus, toValidationErrorRecord } from '../../../main/utils/apiResponses';

describe('apiResponses', () => {
  test('recognises numeric HTTP status values', () => {
    expect(isHttpStatusCode(HttpStatusCode.Ok)).toBe(true);
    expect(isHttpStatusCode('200')).toBe(false);
  });

  test('recognises successful HTTP status values', () => {
    expect(isSuccessfulHttpStatus(HttpStatusCode.Ok)).toBe(true);
    expect(isSuccessfulHttpStatus(HttpStatusCode.NoContent)).toBe(true);
    expect(isSuccessfulHttpStatus(HttpStatusCode.MultipleChoices)).toBe(false);
  });

  test('converts API validation errors and supports ignored and remapped fields', () => {
    const errors = new Map([
      ['timestamp', 'ignored'],
      ['FILE', 'invalid'],
      ['name', 'required'],
    ]);

    expect(
      toValidationErrorRecord(errors, {
        ignoredKeys: ['Timestamp'],
        mapKey: key => (key.toLowerCase() === 'file' ? 'photo' : key),
      })
    ).toEqual({ name: ['required'], photo: ['invalid'] });
  });
});
