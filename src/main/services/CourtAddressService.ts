import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAddress, CourtAddressType } from '../schemas/courtAddressSchema';
import { DpaAddress } from '../schemas/osDataSchema';
import {
  validateAddressLine1Field,
  validateAddressLine2Field,
  validateCountyField,
  validatePostcodeField,
  validateTownCityField,
} from '../utils/addressValidation';
import { addError } from '../utils/validation';

export type SaveCourtAddressResponse =
  | {
      status: 'saved';
      courtName: string;
      address: Partial<CourtAddress>;
      courtOpened: boolean;
    }
  | {
      status: 'invalid';
      address: Partial<CourtAddress> & { errors?: Record<string, string[] | undefined> };
    }
  | HttpStatusCode;

export type RetrieveAddressOptionsResponse =
  | DpaAddress[]
  | {
      status: 'invalid';
      error: string;
    }
  | HttpStatusCode;

export type DeleteCourtAddressResponse =
  | {
      status: 'deleted';
      courtName: string;
      address: Partial<CourtAddress>;
    }
  | {
      status: 'invalid';
      courtName: string;
      address: Partial<CourtAddress> & { errors?: Record<string, string[] | undefined> };
    }
  | HttpStatusCode;

const VALID_EPIM_ID_REGEX = /^[A-Z0-9 -]+$/i;

const dataApiRequests = new DataApiRequests();

export class CourtAddressService {
  public async list(courtId: string): Promise<CourtAddress[] | HttpStatusCode> {
    return dataApiRequests.getCourtAddressDetails(courtId);
  }

  public async retrieve(courtId: string, addressId: string): Promise<CourtAddress | HttpStatusCode> {
    return dataApiRequests.getCourtAddressDetailsById(courtId, addressId);
  }

  public async retrieveAll(courtId: string): Promise<CourtAddress[] | HttpStatusCode> {
    return dataApiRequests.getCourtAddressDetails(courtId);
  }

  public async retrieveAddressOptions(postcode: string): Promise<RetrieveAddressOptionsResponse> {
    const result = await dataApiRequests.getAddressesForPostcode(postcode);
    if (typeof result === 'number') {
      return result;
    }
    if (result instanceof Map) {
      if (result.has('message')) {
        return { status: 'invalid', error: result.get('message') as string };
      } else {
        return HttpStatusCode.BadRequest;
      }
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
    const validationErrors = this.validateAddress(address, existingAddresses, aolSelected, courtTypesSelected);
    if (validationErrors) {
      return { status: 'invalid', address: { ...address, errors: validationErrors } };
    }

    // retrieve the court as we'll need its name
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
        // ignore the timestamp entry when decanting error responses
        if (typeof key === 'string' && key.toLowerCase() === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }
      return { status: 'invalid', address: { ...address, errors } };
    }

    let courtOpened = false;
    if (!addressId && existingAddresses.length === 0 && !courtResponse.open) {
      const openCourtResponse = await dataApiRequests.updateCourt({
        ...courtResponse,
        open: true,
      });

      if (typeof openCourtResponse === 'number') {
        return openCourtResponse;
      }

      if (openCourtResponse instanceof Map) {
        return HttpStatusCode.BadRequest;
      }

      courtOpened = true;
    }

    // otherwise, it's a successful save and we can return the saved address
    return { status: 'saved', courtName: courtResponse.name, address: result, courtOpened };
  }

  public async delete(courtId: string, addressId: string): Promise<DeleteCourtAddressResponse> {
    // retrieve the court as we'll need its name
    const courtResponse = await dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    // retrieve the address as we'll need it
    const courtAddressResponse = await dataApiRequests.getCourtAddressDetails(courtId);
    if (typeof courtAddressResponse === 'number') {
      return courtAddressResponse;
    }

    const courtAddress = courtAddressResponse.find(address => address.id === addressId);
    if (!courtAddress) {
      return HttpStatusCode.NotFound;
    }

    if (courtAddressResponse.length < 2) {
      return {
        status: 'invalid',
        courtName: courtResponse.name,
        address: {
          ...courtAddress,
          errors: { message: ['Unable to delete this address: At least one address is required for a court.'] },
        },
      };
    }

    // delete the address
    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);
    if (response !== HttpStatusCode.NoContent) {
      return response;
    }
    return { status: 'deleted', courtName: courtResponse.name, address: courtAddress };
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

    addError(errors, 'addressType', this.validateAddressType(address, existingAddresses));
    addError(errors, 'addressLine1', validateAddressLine1Field(address.addressLine1));
    addError(errors, 'addressLine2', validateAddressLine2Field(address.addressLine2 ?? undefined));
    addError(errors, 'townCity', validateTownCityField(address.townCity));
    addError(errors, 'county', validateCountyField(address.county ?? undefined));

    const postcodeValidation = validatePostcodeField(address.postcode);
    if (postcodeValidation) {
      addError(errors, 'postcode', [postcodeValidation]);
    }

    addError(errors, 'epimId', this.validateEpimId(address));

    if (aolSelected && (!address.areasOfLaw || address.areasOfLaw.length === 0 || address.areasOfLaw.length > 5)) {
      addError(errors, 'areasOfLaw', ['Please select between 1 and 5 areas of law that this address is relevant for']);
    }

    if (
      courtTypesSelected &&
      (!address.courtTypes || address.courtTypes.length === 0 || address.courtTypes.length > 5)
    ) {
      addError(errors, 'courtTypes', ['Please select at least one court type that this address is relevant for']);
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  private validateAddressType(address: Partial<CourtAddress>, existingAddresses: CourtAddress[]): string[] {
    const addressTypeErrors: string[] = [];
    if (!address.addressType) {
      addressTypeErrors.push('Select an address type');
    } else if (
      address.addressType === CourtAddressType.VISIT_US &&
      existingAddresses.some(
        existingAddress => existingAddress.addressType === address.addressType && existingAddress.id !== address.id
      )
    ) {
      addressTypeErrors.push(
        'A court can only have one listed address for visiting and this court already has one.' +
          '  Please edit the other visit address first.'
      );
    }
    return addressTypeErrors;
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
}
