import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { DpaAddress } from '../schemas/osDataSchema';
import { ServiceCentreAddress } from '../schemas/serviceCentreAddressSchema';
import {
  validateAddressLine1Field,
  validateAddressLine2Field,
  validateCountyField,
  validatePostcodeField,
  validateTownCityField,
} from '../utils/addressValidation';
import { addError } from '../utils/validation';

export type SaveServiceCentreAddressResponse =
  | {
      status: 'saved';
      address: Partial<ServiceCentreAddress>;
      serviceCentreName: string;
      serviceCentreOpened: boolean;
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

    const validationErrors = this.validateAddress(address, existingAddresses, addressId);
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

    let serviceCentreOpened = false;
    if (!addressId && existingAddresses.length === 0 && !serviceCentreResponse.open) {
      const openServiceCentreResponse = await this.dataApiRequests.updateServiceCentre({
        ...serviceCentreResponse,
        open: true,
      });

      if (typeof openServiceCentreResponse === 'number') {
        return openServiceCentreResponse;
      }

      if (openServiceCentreResponse instanceof Map) {
        return HttpStatusCode.BadRequest;
      }

      serviceCentreOpened = true;
    }

    return { status: 'saved', address: result, serviceCentreName: serviceCentreResponse.name, serviceCentreOpened };
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

  private validateAddress(
    address: Partial<ServiceCentreAddress>,
    existingAddresses: ServiceCentreAddress[],
    addressId?: string
  ): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    if (!addressId && existingAddresses.length > 0) {
      addError(errors, 'message', [
        'Only a single address can be added for a service centre, and this service centre already has an address assigned.',
      ]);
    }

    if (!address.addressType) {
      addError(errors, 'addressType', ['Select an address type']);
    }

    addError(errors, 'addressLine1', validateAddressLine1Field(address.addressLine1));
    addError(errors, 'addressLine2', validateAddressLine2Field(address.addressLine2 ?? undefined));
    addError(errors, 'townCity', validateTownCityField(address.townCity));
    addError(errors, 'county', validateCountyField(address.county ?? undefined));

    const postcodeValidation = validatePostcodeField(address.postcode);
    if (postcodeValidation) {
      addError(errors, 'postcode', [postcodeValidation]);
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
