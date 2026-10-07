import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { ServiceCentreAddress } from '../../schemas/serviceCentreAddressSchema';
import { validateCoreAddressFields } from '../../utils/addressValidation';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import {
  COURT_ADDRESS_TYPE_REQUIRED_MESSAGE,
  SERVICE_CENTRE_SINGLE_ADDRESS_ONLY_MESSAGE,
} from '../../utils/constants/messageConstants';
import { addError } from '../../utils/validation';
import { AddressLookupResponse, AddressLookupService } from '../shared/AddressLookupService';

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

export type RetrieveAddressOptionsResponse = AddressLookupResponse;

export class ServiceCentreAddressService {
  public constructor(
    private readonly serviceCentreApi = new ServiceCentreApi(),
    referenceDataApi = new ReferenceDataApi(),
    private readonly addressLookupService = new AddressLookupService(referenceDataApi)
  ) {}

  public async list(serviceCentreId: string): Promise<ServiceCentreAddress[] | HttpStatusCode> {
    return this.serviceCentreApi.getServiceCentreAddressDetails(serviceCentreId);
  }

  public async retrieve(serviceCentreId: string, addressId: string): Promise<ServiceCentreAddress | HttpStatusCode> {
    return this.serviceCentreApi.getServiceCentreAddressDetailsById(serviceCentreId, addressId);
  }

  public async retrieveServiceCentreName(serviceCentreId: string): Promise<string | HttpStatusCode> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    return serviceCentreResponse.name;
  }

  public async retrieveAddressOptions(postcode: string): Promise<RetrieveAddressOptionsResponse> {
    return this.addressLookupService.retrieveOptions(postcode);
  }

  public async save(
    address: Partial<ServiceCentreAddress>,
    serviceCentreId: string,
    addressId?: string,
    isNewSC: boolean = false
  ): Promise<SaveServiceCentreAddressResponse> {
    const existingAddresses = await this.list(serviceCentreId);
    if (isHttpStatusCode(existingAddresses)) {
      return existingAddresses;
    }

    const validationErrors = this.validateAddress(address, existingAddresses, addressId);
    if (validationErrors) {
      return { status: 'invalid', address: { ...address, errors: validationErrors } };
    }

    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    const result = addressId
      ? await this.serviceCentreApi.updateServiceCentreAddress(address, serviceCentreId, addressId)
      : await this.serviceCentreApi.saveServiceCentreAddress(address, serviceCentreId);

    if (isHttpStatusCode(result)) {
      return result;
    }

    if (result instanceof Map) {
      return this.buildApiValidationErrorResponse(result, address);
    }

    let serviceCentreOpened = false;
    if (!addressId && existingAddresses.length === 0 && !serviceCentreResponse.open && isNewSC) {
      const openServiceCentreResponse = await this.serviceCentreApi.updateServiceCentre({
        ...serviceCentreResponse,
        open: true,
      });

      if (isHttpStatusCode(openServiceCentreResponse)) {
        return openServiceCentreResponse;
      }

      if (openServiceCentreResponse instanceof Map) {
        return HttpStatusCode.BadRequest;
      }

      serviceCentreOpened = true;
    }

    return { status: 'saved', address: result, serviceCentreName: serviceCentreResponse.name, serviceCentreOpened };
  }

  private buildApiValidationErrorResponse(
    result: Map<string, string>,
    address: Partial<ServiceCentreAddress>
  ): SaveServiceCentreAddressResponse {
    const errors = toValidationErrorRecord(result, { ignoredKeys: ['timestamp'] });
    return { status: 'invalid', address: { ...address, errors } };
  }

  public async delete(serviceCentreId: string, addressId: string): Promise<DeleteServiceCentreAddressResponse> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    const addressResponse = await this.list(serviceCentreId);
    if (isHttpStatusCode(addressResponse)) {
      return addressResponse;
    }

    const address = addressResponse.find(existingAddress => existingAddress.id === addressId);
    if (!address) {
      return HttpStatusCode.NotFound;
    }

    const deleteResponse = await this.serviceCentreApi.deleteServiceCentreAddress(serviceCentreId, addressId);
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
    const errors = validateCoreAddressFields(address);

    if (!addressId && existingAddresses.length > 0) {
      addError(errors, 'message', [SERVICE_CENTRE_SINGLE_ADDRESS_ONLY_MESSAGE]);
    }

    if (!address.addressType) {
      addError(errors, 'addressType', [COURT_ADDRESS_TYPE_REQUIRED_MESSAGE]);
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
