import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAddress, CourtAddressType } from '../schemas/courtAddressSchema';
import { DpaAddress } from '../schemas/osDataSchema';

export type SaveCourtAddressResponse =
  | {
      status: 'saved';
      courtName: string;
      address: Partial<CourtAddress>;
    }
  | {
      status: 'invalid';
      address: Partial<CourtAddress> & { errors?: Record<string, string[] | undefined> };
    }
  | HttpStatusCode;

export type DeleteCourtAddressResponse =
  | {
      status: 'deleted';
      courtName: string;
      address: Partial<CourtAddress>;
    }
  | HttpStatusCode;

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
const VALID_ADDRESS_LINE_REGEX = /^[A-Z0-9 ()':,.-]+$/i;
const VALID_EPIM_ID_REGEX = /^[A-Z0-9 -]+$/i;

const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

export const POSTCODE_ERROR_MESSAGES: Record<string, string> = {
  northernIrelandPostcode: 'Northern Ireland postcodes are not supported for this service',
  guernseyPostcode: 'Guernsey postcodes are not supported for this service',
  jerseyPostcode: 'Jersey postcodes are not supported for this service',
  isleOfManPostcode: 'Isle of man postcodes are not supported for this service',
  blankPostcode: 'Enter a postcode',
  invalidPostcode: 'Postcode format is invalid',
};

const dataApiRequests = new DataApiRequests();

export class CourtAddressService {
  public async list(courtId: string): Promise<CourtAddress[] | HttpStatusCode> {
    return dataApiRequests.getCourtAddressDetails(courtId);
  }

  public async retrieve(courtId: string, addressId: string): Promise<CourtAddress | HttpStatusCode> {
    return dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
  }

  public async retrieveAddressOptions(postcode: string): Promise<DpaAddress[] | HttpStatusCode> {
    const result = await dataApiRequests.getAddressesForPostcode(postcode);
    if (typeof result === 'number') {
      return result;
    }
    return result.results.map(resultItem => resultItem.DPA).filter((dpa): dpa is DpaAddress => dpa !== null);
  }

  public async save(
    address: Partial<CourtAddress>,
    courtId: string,
    aolSelected: boolean,
    courtTypesSelected: boolean,
    addressId?: string
  ): Promise<SaveCourtAddressResponse> {
    const existingAddresses = await this.list(courtId);
    if (typeof existingAddresses === 'number') {
      return existingAddresses;
    }

    // validate for obvious errors before attempting to save
    const validationErrors = this.validateAddress(
      address,
      existingAddresses,
      aolSelected,
      courtTypesSelected
    );
    if (validationErrors) {
      return { status: 'invalid', address: { ...address, errors: validationErrors } };
    }

    // retrieve the court as we'll need it's name
    const courtResponse = await dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    // attempt to save the address. This may fail with validation errors, which we'll need to
    // decant into the response
    const result = addressId
      ? await dataApiRequests.updateCourtAddress(address, courtId, addressId)
      : await dataApiRequests.saveCourtAddress(address, courtId);

    // if it's a number, it's an HttpResponseCode and likely not good
    if (typeof result === 'number') {
      return result;
    }

    // if it's a Map, it's validation errors from the API
    if (result instanceof Map) {
      // convert the mapped errors into our expected error format
      const errors: Record<string, string[]> = {};
      for (const [key, value] of result) {
        errors[key] = [value];
      }
      return { status: 'invalid', address: { ...address, errors } };
    }

    // otherwise, it's a successful save and we can return the saved address
    return { status: 'saved', courtName: courtResponse.name, address: result };
  }

  public async delete(courtId: string, addressId: string): Promise<DeleteCourtAddressResponse> {
    // retrieve the court as we'll need its name
    const courtResponse = await dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    // retrieve the address as we'll need it
    const courtAddressResponse = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
    if (typeof courtAddressResponse === 'number') {
      return courtAddressResponse;
    }

    // delete the address
    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);
    if (response !== HttpStatusCode.NoContent) {
      return response;
    }
    return { status: 'deleted', courtName: courtResponse.name, address: courtAddressResponse };
  }

  public async retrieveCourtName(courtId: string): Promise<string | HttpStatusCode> {
    const courtResponse = await dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }
    return courtResponse.name;
  }

  /**
   * performs some local validation of the address data to trap any obvious issues before attempting
   * to save and getting a failure response from the API. This is not exhaustive validation, just
   * some basic checks for mandatory fields and the same postcode validation we perform on the
   * public facing client.
   *
   * @param address the CourtAddress that's being saved
   * @param existingAddresses the list of existing addresses for the court
   * @param aolSelected flag that indicates aol were selected on the form before saving
   * @param courtTypesSelected flag that indicates court types were selected on the form before saving
   * @private
   */
  private validateAddress(
    address: Partial<CourtAddress>,
    existingAddresses: CourtAddress[],
    aolSelected: boolean,
    courtTypesSelected: boolean
  ): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    // addressType
    const addressTypeErrors = this.validateAddressType(address, existingAddresses);
    if (addressTypeErrors.length > 0) {
      errors.addressType = addressTypeErrors;
    }

    // addressLine1 (mandatory)
    const addressLine1Errors = this.validateAddressLine1(address);
    if (addressLine1Errors.length > 0) {
      errors.addressLine1 = addressLine1Errors;
    }

    // addressLine2 (optional, but if you've added one it needs to be right)
    const addressLine2Errors = this.validateAddressLine2(address, addressLine1Errors);
    if (addressLine2Errors.length > 0) {
      errors.addressLine2 = addressLine2Errors;
    }

    // townCity (mandatory)
    const townCityErrors = this.validateTownCity(address);
    if (townCityErrors.length > 0) {
      errors.townCity = townCityErrors;
    }

    // county (optional, but if you've added one it needs to be right)
    const countyErrors = this.validateCounty(address);
    if (countyErrors.length > 0) {
      errors.county = countyErrors;
    }

    // validate postcode
    const postcodeValidation = this.validatePostcode(address.postcode);
    if (postcodeValidation) {
      errors.postcode = [postcodeValidation];
    }

    // validate epimId
    const epimIdValidation = this.validateEpimId(address);
    if (epimIdValidation.length > 0) {
      errors.epimId = epimIdValidation;
    }

    // validate areas of law
    if (aolSelected && (!address.areasOfLaw || address.areasOfLaw.length === 0 || address.areasOfLaw.length > 5)) {
      errors.areasOfLaw = ['Please select between 1 and 5 areas of law that this address is relevant for'];
    }

    // validate courtTypes
    if (
      courtTypesSelected &&
      (!address.courtTypes || address.courtTypes.length === 0 || address.courtTypes.length > 5)
    ) {
      errors.courtTypes = ['Please select at least one court type that this address is relevant for'];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  private validateAddressType(address: Partial<CourtAddress>, existingAddresses: CourtAddress[]): string[] {
    const addressTypeErrors: string[] = [];
    if (!address.addressType) {
      addressTypeErrors.push('Select an address type');
    } else if (
      address.addressType === CourtAddressType.VISIT_US &&
      existingAddresses.some(existingAddress => existingAddress.addressType === address.addressType)
    ) {
      addressTypeErrors.push(
        'A court can only have one listed address for visiting and this court already has one.' +
          '  Please edit the other visit address first.'
      );
    }
    return addressTypeErrors;
  }

  private validateAddressLine1(address: Partial<CourtAddress>): string[] {
    const addressLine1Errors: string[] = [];
    if (!address.addressLine1 || address.addressLine1.trim().length === 0) {
      addressLine1Errors.push('Enter address line 1, typically the building and street');
    } else if (address.addressLine1.length > 255) {
      addressLine1Errors.push('Address line 1 must be 255 characters or less');
    }
    if (address.addressLine1 && !VALID_ADDRESS_LINE_REGEX.test(address.addressLine1.trim())) {
      addressLine1Errors.push(
        "Address line 1 must only include letters a to z, and special characters '(',')',':',',','.' and '-'"
      );
    }
    return addressLine1Errors;
  }

  private validateAddressLine2(address: Partial<CourtAddress>, addressLine1Errors: string[]): string[] {
    const addressLine2Errors: string[] = [];
    if (address.addressLine2 && address.addressLine2.length > 255) {
      addressLine1Errors.push('Address line 2 must be 255 characters or less');
    }
    if (address.addressLine2 && !VALID_ADDRESS_LINE_REGEX.test(address.addressLine2.trim())) {
      addressLine1Errors.push(
        "Address line 2 must only include letters a to z, and special characters '(',')',':',',','.' and '-'"
      );
    }
    return addressLine2Errors;
  }

  private validateTownCity(address: Partial<CourtAddress>): string[] {
    const townCityErrors: string[] = [];
    if (!address.townCity || address.townCity.trim().length === 0) {
      townCityErrors.push('Enter a town or city');
    } else if (address.townCity.length > 100) {
      townCityErrors.push('Town or city must be 255 characters or less');
    }
    if (address.townCity && !VALID_ADDRESS_LINE_REGEX.test(address.townCity.trim())) {
      townCityErrors.push(
        "Town or city must only include letters a to z, and special characters '(',')',':',',','.' and '-'"
      );
    }
    return townCityErrors;
  }

  private validateCounty(address: Partial<CourtAddress>): string[] {
    const countyErrors: string[] = [];
    if (address.county && address.county.length > 255) {
      countyErrors.push('County must be 255 characters or less');
    }
    if (address.county && !VALID_ADDRESS_LINE_REGEX.test(address.county.trim())) {
      countyErrors.push("County must only include letters a to z, and special characters '(',')',':',',','.' and '-'");
    }
    return countyErrors;
  }

  private validateEpimId(address: Partial<CourtAddress>): string[] {
    const epimIdErrors: string[] = [];
    if (address.epimId && address.epimId.length > 10) {
      epimIdErrors.push('ePIMS Ref ID must be 10 characters or less');
    }
    if (address.epimId && !VALID_EPIM_ID_REGEX.test(address.epimId.trim())) {
      epimIdErrors.push('ePIMS Ref ID must only include letters a to z, spaces and dashes.');
    }
    return epimIdErrors;
  }

  /**
   * Checks whether a value is a valid and acceptable postcode
   */
  public isValidPostcode(value: string): boolean {
    return this.validatePostcode(value) === undefined;
  }

  /**
   * Checks the postcode and returns an appropriate error message if there are any issues with the
   * postcode. If there are no issues, returns undefined.
   * @param postcode
   */
  public validatePostcode(postcode: string | undefined): string | undefined {
    // might be missing
    if (!postcode) {
      return POSTCODE_ERROR_MESSAGES.blankPostcode;
    }

    // might be structurally invalid
    const trimmedPostcode = postcode.trim();
    if (trimmedPostcode.length === 0) {
      return POSTCODE_ERROR_MESSAGES.blankPostcode;
    } else if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
      return POSTCODE_ERROR_MESSAGES.invalidPostcode;
    }

    // might be in an unhandled jurisdiction
    for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
      if (regex.test(trimmedPostcode)) {
        return POSTCODE_ERROR_MESSAGES[key];
      }
    }

    // no obvious issues with the postcode
    return undefined;
  }
}
