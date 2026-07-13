import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { DpaAddress } from '../schemas/osDataSchema';
import { ServiceCentreAddress, ServiceCentreAddressType } from '../schemas/serviceCentreAddressSchema';

export type SaveServiceCentreAddressResponse =
  | {
      status: 'saved';
      address: Partial<ServiceCentreAddress>;
      serviceCentreName: string;
    }
  | {
      status: 'invalid';
      address: Partial<ServiceCentreAddress> & { errors?: Record<string, string[] | undefined> };
    }
  | HttpStatusCode;

export type DeleteServiceCentreAddressResponse =
  | {
      status: 'deleted';
      address: Partial<ServiceCentreAddress>;
      serviceCentreName: string;
    }
  | HttpStatusCode;

export type RetrieveAddressOptionsResponse =
  | DpaAddress[]
  | {
      status: 'invalid';
      error: string;
    }
  | HttpStatusCode;

const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
const VALID_ADDRESS_LINE_REGEX = /^[A-Z0-9 ()':,.-]+$/i;

const JURISDICTION_ERROR_REGEXES = {
  guernseyPostcode: /^(GY)/i,
  isleOfManPostcode: /^(IM)/i,
  jerseyPostcode: /^(JE)/i,
  northernIrelandPostcode: /^(BT)/i,
};

export const POSTCODE_ERROR_MESSAGES: Record<string, string> = {
  blankPostcode: 'Enter a postcode',
  guernseyPostcode: 'Guernsey postcodes are not supported for this service',
  invalidPostcode: 'Postcode format is invalid',
  isleOfManPostcode: 'Isle of man postcodes are not supported for this service',
  jerseyPostcode: 'Jersey postcodes are not supported for this service',
  northernIrelandPostcode: 'Northern Ireland postcodes are not supported for this service',
};

export class ServiceCentreAddressService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async list(serviceCentreId: string): Promise<ServiceCentreAddress[] | HttpStatusCode> {
    return this.dataApiRequests.getServiceCentreAddressDetails(serviceCentreId);
  }

  public async retrieve(serviceCentreId: string, addressId: string): Promise<ServiceCentreAddress | HttpStatusCode> {
    return this.dataApiRequests.getServiceCentreAddressDetailsById(serviceCentreId, addressId);
  }

  public async retrieveServiceCentreName(serviceCentreId: string): Promise<string | HttpStatusCode> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    return serviceCentreResponse.name;
  }

  public async retrieveAddressOptions(postcode: string): Promise<RetrieveAddressOptionsResponse> {
    const result = await this.dataApiRequests.getAddressesForPostcode(postcode);
    if (typeof result === 'number') {
      return result;
    }

    if (result instanceof Map) {
      if (result.has('message')) {
        return { status: 'invalid', error: result.get('message') ?? 'Unable to fetch address options' };
      }
      return HttpStatusCode.BadRequest;
    }

    return result.results.map(resultItem => resultItem.DPA).filter((dpa): dpa is DpaAddress => dpa !== null);
  }

  public async save(
    address: Partial<ServiceCentreAddress>,
    serviceCentreId: string,
    addressId?: string
  ): Promise<SaveServiceCentreAddressResponse> {
    const existingAddresses = await this.list(serviceCentreId);
    if (typeof existingAddresses === 'number') {
      return existingAddresses;
    }

    const validationErrors = this.validateAddress(address, existingAddresses);
    if (validationErrors) {
      return { status: 'invalid', address: { ...address, errors: validationErrors } };
    }

    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    const result = addressId
      ? await this.dataApiRequests.updateServiceCentreAddress(address, serviceCentreId, addressId)
      : await this.dataApiRequests.saveServiceCentreAddress(address, serviceCentreId);

    if (typeof result === 'number') {
      return result;
    }

    if (result instanceof Map) {
      const errors: Record<string, string[]> = {};
      for (const [key, value] of result) {
        if (typeof key === 'string' && key.toLowerCase() === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }
      return { status: 'invalid', address: { ...address, errors } };
    }

    return { status: 'saved', address: result, serviceCentreName: serviceCentreResponse.name };
  }

  public async delete(serviceCentreId: string, addressId: string): Promise<DeleteServiceCentreAddressResponse> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    const addressResponse = await this.list(serviceCentreId);
    if (typeof addressResponse === 'number') {
      return addressResponse;
    }

    const address = addressResponse.find(existingAddress => existingAddress.id === addressId);
    if (!address) {
      return HttpStatusCode.NotFound;
    }

    const deleteResponse = await this.dataApiRequests.deleteServiceCentreAddress(serviceCentreId, addressId);
    if (deleteResponse !== HttpStatusCode.NoContent) {
      return deleteResponse;
    }

    return { status: 'deleted', address, serviceCentreName: serviceCentreResponse.name };
  }

  public isValidPostcode(value: string): boolean {
    return this.validatePostcode(value) === undefined;
  }

  public validatePostcode(postcode: string | undefined): string | undefined {
    if (!postcode) {
      return POSTCODE_ERROR_MESSAGES.blankPostcode;
    }

    const trimmedPostcode = postcode.trim();
    if (trimmedPostcode.length === 0) {
      return POSTCODE_ERROR_MESSAGES.blankPostcode;
    }
    if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
      return POSTCODE_ERROR_MESSAGES.invalidPostcode;
    }

    for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
      if (regex.test(trimmedPostcode)) {
        return POSTCODE_ERROR_MESSAGES[key];
      }
    }

    return undefined;
  }

  private validateAddress(
    address: Partial<ServiceCentreAddress>,
    existingAddresses: ServiceCentreAddress[]
  ): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    const addressTypeErrors = this.validateAddressType(address, existingAddresses);
    if (addressTypeErrors.length > 0) {
      errors.addressType = addressTypeErrors;
    }

    const addressLine1Errors = this.validateAddressLine1(address);
    if (addressLine1Errors.length > 0) {
      errors.addressLine1 = addressLine1Errors;
    }

    const addressLine2Errors = this.validateAddressLine2(address);
    if (addressLine2Errors.length > 0) {
      errors.addressLine2 = addressLine2Errors;
    }

    const townCityErrors = this.validateTownCity(address);
    if (townCityErrors.length > 0) {
      errors.townCity = townCityErrors;
    }

    const countyErrors = this.validateCounty(address);
    if (countyErrors.length > 0) {
      errors.county = countyErrors;
    }

    const postcodeValidation = this.validatePostcode(address.postcode);
    if (postcodeValidation) {
      errors.postcode = [postcodeValidation];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  private validateAddressType(
    address: Partial<ServiceCentreAddress>,
    existingAddresses: ServiceCentreAddress[]
  ): string[] {
    const addressTypeErrors: string[] = [];

    if (!address.addressType) {
      addressTypeErrors.push('Select an address type');
    } else if (
      address.addressType === ServiceCentreAddressType.VISIT_US &&
      existingAddresses.some(
        existingAddress => existingAddress.addressType === address.addressType && existingAddress.id !== address.id
      )
    ) {
      addressTypeErrors.push(
        'A service centre can only have one listed address for visiting and this service centre already has one. Please edit the other visit address first.'
      );
    }

    return addressTypeErrors;
  }

  private validateAddressLine1(address: Partial<ServiceCentreAddress>): string[] {
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

  private validateAddressLine2(address: Partial<ServiceCentreAddress>): string[] {
    const addressLine2Errors: string[] = [];

    if (address.addressLine2 && address.addressLine2.length > 255) {
      addressLine2Errors.push('Address line 2 must be 255 characters or less');
    }

    if (address.addressLine2 && !VALID_ADDRESS_LINE_REGEX.test(address.addressLine2.trim())) {
      addressLine2Errors.push(
        "Address line 2 must only include letters a to z, and special characters '(',')',':',',','.' and '-'"
      );
    }

    return addressLine2Errors;
  }

  private validateTownCity(address: Partial<ServiceCentreAddress>): string[] {
    const townCityErrors: string[] = [];

    if (!address.townCity || address.townCity.trim().length === 0) {
      townCityErrors.push('Enter a town or city');
    } else if (address.townCity.length > 100) {
      townCityErrors.push('Town or city must be 100 characters or less');
    }

    if (address.townCity && !VALID_ADDRESS_LINE_REGEX.test(address.townCity.trim())) {
      townCityErrors.push(
        "Town or city must only include letters a to z, and special characters '(',')',':',',','.' and '-'"
      );
    }

    return townCityErrors;
  }

  private validateCounty(address: Partial<ServiceCentreAddress>): string[] {
    const countyErrors: string[] = [];

    if (address.county && address.county.length > 255) {
      countyErrors.push('County must be 255 characters or less');
    }

    if (address.county && !VALID_ADDRESS_LINE_REGEX.test(address.county.trim())) {
      countyErrors.push("County must only include letters a to z, and special characters '(',')',':',',','.' and '-'");
    }

    return countyErrors;
  }
}
