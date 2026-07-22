import { POSTCODE_ERROR_MESSAGES, isValidPostcode, validatePostcodeField } from '../../../main/utils/addressValidation';

describe('AddressValidation', () => {
  test('returns postcode validation messages and boolean validity', () => {
    expect(validatePostcodeField(undefined)).toBe(POSTCODE_ERROR_MESSAGES.blankPostcode);
    expect(validatePostcodeField('   ')).toBe(POSTCODE_ERROR_MESSAGES.blankPostcode);
    expect(validatePostcodeField('abc')).toBe(POSTCODE_ERROR_MESSAGES.invalidPostcode);
    expect(validatePostcodeField('BT1 1AA')).toBe(POSTCODE_ERROR_MESSAGES.northernIrelandPostcode);
    expect(validatePostcodeField('JE1 1AA')).toBe(POSTCODE_ERROR_MESSAGES.jerseyPostcode);
    expect(validatePostcodeField('IM1 1AA')).toBe(POSTCODE_ERROR_MESSAGES.isleOfManPostcode);
    expect(isValidPostcode('SW1A 1AA')).toBe(true);
    expect(isValidPostcode('GY1 1AA')).toBe(false);
  });
});
