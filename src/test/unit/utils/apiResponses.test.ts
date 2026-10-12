import { HttpStatusCode } from 'axios';

import {
  isHttpStatusCode,
  isSuccessfulHttpStatus,
  toValidationErrorEntries,
  toValidationErrorRecord,
} from '../../../main/utils/apiResponses';

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

  test('converts API validation errors, ignores timestamps by default, and supports remapped fields', () => {
    const errors = new Map([
      ['timestamp', 'ignored'],
      ['FILE', 'invalid'],
      ['name', 'required'],
    ]);

    expect(
      toValidationErrorRecord(errors, {
        mapKey: key => (key.toLowerCase() === 'file' ? 'photo' : key),
      })
    ).toEqual({ name: ['required'], photo: ['invalid'] });
  });

  test('normalises API validation errors for specialised adapters', () => {
    const errors = new Map([
      ['Timestamp', 'ignored'],
      ['phoneNumber', 'invalid'],
    ]);

    expect(toValidationErrorEntries(errors, { mapKey: key => key.toLowerCase() })).toEqual([
      ['phonenumber', 'invalid'],
    ]);
  });
});
