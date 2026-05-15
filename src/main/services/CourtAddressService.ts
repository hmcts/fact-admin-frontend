import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAddress } from '../schemas/courtAddressSchema';
import { DpaAddress } from '../schemas/osDataSchema';

export type SaveCourtAddressResponse =
  | {
      status: 'saved';
      courtName: string;
      address: Partial<CourtAddress>;
    }
  | {
      status: 'invalid';
      address: Partial<CourtAddress> & { errors?: Map<string, string | undefined> };
    }
  | HttpStatusCode;

export type DeleteCourtAddressResponse =
  | {
      status: 'deleted';
      courtName: string;
    }
  | HttpStatusCode;

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;

const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

const POSTCODE_ERROR_MESSAGES: Record<string, string> = {
  northernIrelandPostcode: 'Northern Ireland postcodes are not supported.',
  guernseyPostcode: 'Guernsey postcodes are not supported.',
  jerseyPostcode: 'Jersey postcodes are not supported.',
  isleOfManPostcode: 'Isle of man postcodes are not supported.',
  blankPostcode: 'Postcode must be specified.',
  invalidPostcode: 'Postcode format is invalid.',
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
    addressId?: string
  ): Promise<SaveCourtAddressResponse> {
    // validate for obvious errors before attempting to save
    const validationErrors = this.validateAddress(address);
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
      return { status: 'invalid', address: { ...address, errors: result } };
    }

    // otherwise, it's a successful save and we can return the saved address
    return { status: 'saved', courtName: courtResponse.name, address: result };
  }

  public async delete(courtId: string, addressId: string): Promise<DeleteCourtAddressResponse> {
    // retrieve the court as we'll need it's name
    const courtResponse = await dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    // delete the address
    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);
    if (response !== HttpStatusCode.NoContent) {
      return response;
    }
    return { status: 'deleted', courtName: courtResponse.name };
  }

  /**
   * performs some local validation of the address data to trap any obvious issues before attempting
   * to save and getting a failure response from the API. This is not exhaustive validation, just
   * some basic checks for mandatory fields and the same postcode validation we perform on the
   * public facing client.
   *
   * @param address the CourtAddress that's being saved
   * @private
   */
  private validateAddress(address: Partial<CourtAddress>): Map<string, string | undefined> | undefined {
    const postcodeValidation = this.validatePostcode(address.postcode);
    if(postcodeValidation || !address.addressLine1 || !address.townCity) {
      return new Map(
        Object.entries({
          addressLine1: address.addressLine1 ? undefined : 'Address line 1 must be specified.',
          townCity: address.townCity ? undefined : 'Town or city must be specified.',
          postcode: postcodeValidation ? POSTCODE_ERROR_MESSAGES[postcodeValidation] : undefined,
        })
      );
    }
    return undefined;
  }

  /**
   * Checks whether a value is a valid and acceptable postcode
   */
  public isValidPostcode(value: string): boolean {
    return this.validatePostcode(value) === undefined;
  }

  /**
   * Checks the postcode and returns an appropriate error type if there are any issues with the postcode.
   * If there are no issues, returns undefined.
   * @param postcode
   */
  public validatePostcode(postcode: string | undefined): string | undefined {
    // might be missing
    if (!postcode) {
      return 'blankPostcode';
    }

    // might be structurally invalid
    const trimmedPostcode = postcode.trim();
    if (trimmedPostcode.length === 0) {
      return 'blankPostcode';
    } else if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
      return 'invalidPostcode';
    }

    // might be in an unhandled jurisdiction
    for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
      if (regex.test(trimmedPostcode)) {
        return key;
      }
    }

    // no obvious issues with the postcode
    return undefined;
  }
}
