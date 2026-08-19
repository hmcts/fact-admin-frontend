import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import { CourtAreaOfLawSelection, parseCourtAreasOfLawResponse } from '../schemas/areaOfLawSchema';
import {
  ServiceCentreAddress,
  serviceCentreAddressListSchema,
  serviceCentreAddressSchema,
} from '../schemas/serviceCentreAddressSchema';
import {
  ServiceCentreContactDetail,
  serviceCentreContactDetailListSchema,
} from '../schemas/serviceCentreContactDetailSchema';
import { ServiceCentre, serviceCentreSchema } from '../schemas/serviceCentreSchema';

import { SaveServiceCentreContactDetailRequest } from './types/SaveServiceCentreContactDetailRequest';
import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

export class ServiceCentreApi {
  /**
   * Request to data API to get a service centre entity by exact service centre name
   */
  public async getServiceCentreByName(serviceCentreName: string): Promise<ServiceCentre | HttpStatusCode> {
    try {
      const response = await dataApi.get('/service-centres/name/v1', { params: { name: serviceCentreName } });
      return serviceCentreSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.NotFound) {
        return HttpStatusCode.NotFound;
      }

      logger.error(`Error fetching service centre details for name ${serviceCentreName}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get a service centre entity by id
   */
  public async getServiceCentreById(serviceCentreId: string): Promise<ServiceCentre | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/${serviceCentreId}/entity/v1`);
      return serviceCentreSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching service centre details for id ${serviceCentreId}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create a service centre
   */
  public async createServiceCentre(
    serviceCentre: Pick<ServiceCentre, 'name' | 'open' | 'regionId' | 'serviceAreaIds'>
  ): Promise<ServiceCentre | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post('/service-centres/v1', serviceCentre);
      return serviceCentreSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error creating service centre:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update service centre details by id
   */
  public async updateServiceCentre(
    serviceCentre: ServiceCentre
  ): Promise<ServiceCentre | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/service-centres/${serviceCentre.id}/v1`, serviceCentre);
      return serviceCentreSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error update service centre details for id ${serviceCentre.id}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get area of law selections by service-centre id
   */
  public async getServiceCentreAreasOfLaw(
    serviceCentreId: string
  ): Promise<CourtAreaOfLawSelection[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/${serviceCentreId}/v1/areas-of-law`);
      return parseCourtAreasOfLawResponse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching areas of law for service-centre id ${serviceCentreId}:`, toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update area of law selections for a service centre
   */
  public async updateServiceCentreAreasOfLaw(payload: {
    serviceCentreId: string;
    areasOfLaw: string[];
  }): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.put(`/service-centres/${payload.serviceCentreId}/v1/areas-of-law`, payload);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error(
        `Error updating areas of law for service-centre id ${payload.serviceCentreId}:`,
        toSafeErrorDetails(error)
      );
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get address details for a given service centre
   */
  public async getServiceCentreAddressDetails(
    serviceCentreId: string
  ): Promise<ServiceCentreAddress[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/${serviceCentreId}/v1/address`);
      return serviceCentreAddressListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching service-centre address details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get specific address details for a given service centre
   */
  public async getServiceCentreAddressDetailsById(
    serviceCentreId: string,
    addressId: string
  ): Promise<ServiceCentreAddress | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/${serviceCentreId}/v1/address/${addressId}`);
      return serviceCentreAddressSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching service-centre address details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to save a new service-centre address
   */
  public async saveServiceCentreAddress(
    address: Partial<ServiceCentreAddress>,
    serviceCentreId: string
  ): Promise<ServiceCentreAddress | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/service-centres/${serviceCentreId}/v1/address`, address);
      return serviceCentreAddressSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error adding service-centre address details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update an existing service-centre address
   */
  public async updateServiceCentreAddress(
    address: Partial<ServiceCentreAddress>,
    serviceCentreId: string,
    addressId: string
  ): Promise<ServiceCentreAddress | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/service-centres/${serviceCentreId}/v1/address/${addressId}`, address);
      return serviceCentreAddressSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating service-centre address details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete an existing service-centre address
   */
  public async deleteServiceCentreAddress(serviceCentreId: string, addressId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/service-centres/${serviceCentreId}/v1/address/${addressId}`);
      if (response.status === HttpStatusCode.NoContent) {
        return response.status;
      }
      logger.error('Unexpected response status when deleting service-centre address:', response.status);
      return HttpStatusCode.InternalServerError;
    } catch (error: unknown) {
      logger.error('Error deleting service-centre address details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get contact details for a given service centre
   */
  public async getServiceCentreContactDetails(
    serviceCentreId: string
  ): Promise<ServiceCentreContactDetail[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/service-centres/${serviceCentreId}/v1/contact-details`);
      return serviceCentreContactDetailListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(
        `Error fetching service-centre contact details for id ${serviceCentreId}:`,
        toSafeErrorDetails(error)
      );
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create a new service-centre contact detail
   */
  public async createServiceCentreContactDetail(
    serviceCentreId: string,
    payload: SaveServiceCentreContactDetailRequest
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/service-centres/${serviceCentreId}/v1/contact-details`, payload);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error creating service-centre contact detail:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update an existing service-centre contact detail
   */
  public async updateServiceCentreContactDetail(
    serviceCentreId: string,
    contactDetailId: string,
    payload: SaveServiceCentreContactDetailRequest
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(
        `/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`,
        payload
      );
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating service-centre contact detail:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete an existing service-centre contact detail
   */
  public async deleteServiceCentreContactDetail(
    serviceCentreId: string,
    contactDetailId: string
  ): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(
        `/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`
      );
      if (response.status === HttpStatusCode.NoContent) {
        return response.status;
      }
      logger.error('Unexpected response status when deleting service-centre contact detail:', response.status);
      return HttpStatusCode.InternalServerError;
    } catch (error: unknown) {
      logger.error('Error deleting service-centre contact detail:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
