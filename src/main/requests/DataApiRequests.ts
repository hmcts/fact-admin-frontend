import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import {
  AreaOfLawType,
  CourtAreaOfLawSelection,
  CourtAreasOfLawUpdate,
  areaOfLawListSchema,
  parseCourtAreasOfLawResponse,
} from '../schemas/areaOfLawSchema';
import { BuildingFacilities, BuildingFacilitiesSchema } from '../schemas/buildingFacilitiesSchema';
import { CourtAddress, courtAddressListSchema, courtAddressSchema } from '../schemas/courtAddressSchema';
import { CourtDetails, courtDetailsListSchema } from '../schemas/courtDetailsSchema';
import { CourtEntity, courtEntitySchema } from '../schemas/courtEntitySchema';
import { PagedCourts, pagedCourtsSchema } from '../schemas/courtListSchema';
import { CourtType, courtTypeListSchema } from '../schemas/courtTypeSchema';
import { OsData, osDataSchema } from '../schemas/osDataSchema';
import { Region, regionsSchema } from '../schemas/regionSchema';
import { TranslationServices, translationServicesSchema } from '../schemas/translationServicesSchema';
import { User, userSchema } from '../schemas/userSchema';

import { CreateUpdateUserRequest } from './types/CreateUpdateUserRequest';
import { GetCourtsParams } from './types/GetCourtsParams';
import { UpdateBuildingFacilitiesRequest } from './types/UpdateBuildingFacilitiesRequest';
import { dataApi } from './utils/axiosConfig';

const logger = Logger.getLogger('app');

export class DataApiRequests {
  /**
   * Request to data API to check health
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await dataApi.get('/health');
      logger.info('Data API health check response:', response.data);
      return response.data.status === 'UP';
    } catch (error) {
      logger.error('Error checking data API health:', error);
    }
    return false;
  }

  /**
   * Request to data API to get all regions
   */
  public async getRegions(): Promise<Region[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/regions');
      return regionsSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching regions:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get a filtered and paginated list of courts
   */
  public async getCourts(params: GetCourtsParams = {}): Promise<PagedCourts | HttpStatusCode> {
    try {
      const response = await dataApi.get('/courts/v1', { params });
      return pagedCourtsSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching courts:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get court details by id
   */
  public async getCourtById(courtId: string): Promise<CourtEntity | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/entity/v1`);
      return courtEntitySchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court details for id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get court details by slug
   */
  public async getCourtBySlug(courtSlug: string): Promise<CourtEntity | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/slug/${courtSlug}/entity/v1`);
      return courtEntitySchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court details for slug ${courtSlug}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update court details by id
   */
  public async updateCourt(court: CourtEntity): Promise<CourtEntity | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${court.id}/v1`, court);
      return courtEntitySchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error update court details for id ${court.id}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get area of law selections by court id
   */
  public async getCourtAreasOfLaw(courtId: string): Promise<CourtAreaOfLawSelection[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/areas-of-law`);
      return parseCourtAreasOfLawResponse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching areas of law for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update area of law selections for a court
   */
  public async updateCourtAreasOfLaw(payload: CourtAreasOfLawUpdate): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.put(`/courts/${payload.courtId}/v1/areas-of-law`, payload);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error(`Error updating areas of law for court id ${payload.courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get all court details
   */
  public async getAllCourts(): Promise<CourtDetails[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/courts/all/v1');
      return courtDetailsListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching all courts:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get address details for a given court
   */
  public async getCourtAddressDetails(courtId: string): Promise<CourtAddress[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/address`);
      return courtAddressListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching court address details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get specific address details for a given court
   */
  public async getCourtAddressDetailsById(courtId: string, addressId: string): Promise<CourtAddress | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/address/${addressId}`);
      return courtAddressSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching court address details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to save a new address
   */
  public async saveCourtAddress(
    address: Partial<CourtAddress>,
    courtId: string
  ): Promise<CourtAddress | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/address`, address);
      return courtAddressSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error adding court address details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update an existing address
   */
  public async updateCourtAddress(
    address: Partial<CourtAddress>,
    courtId: string,
    addressId: string
  ): Promise<CourtAddress | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${courtId}/v1/address/${addressId}`, address);
      return courtAddressSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating court address details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete an existing address
   */
  public async deleteCourtAddress(courtId: string, addressId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/courts/${courtId}/v1/address/${addressId}`);
      if (response.status === HttpStatusCode.NoContent) {
        return response.status;
      }
      logger.error('Unexpected response status when deleting court address:', response.status);
      return HttpStatusCode.InternalServerError;
    } catch (error: unknown) {
      logger.error('Error deleting court address details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to perform a postcode based address search (O|S)
   */
  public async getAddressesForPostcode(postcode: string): Promise<OsData | Map<string, string> | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/search/address/v1/postcode/${postcode}`);
      return osDataSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error fetching OS postcode search results:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve areas of law
   */
  public async getAreasOfLaw(): Promise<AreaOfLawType[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/areas-of-law');
      return areaOfLawListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching area of law type details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve court types
   */
  public async getCourtTypes(): Promise<CourtType[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/court-types');
      return courtTypeListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching area of law type details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get translation services by court id
   */
  public async getTranslationServices(courtId: string): Promise<TranslationServices | null | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/translation-services`);

      if (response.status === HttpStatusCode.NoContent) {
        return null;
      }

      return translationServicesSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching translation services for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create or update translation services by court id
   */
  public async saveTranslationServices(
    courtId: string,
    payload: Pick<TranslationServices, 'courtId' | 'email' | 'phoneNumber'>
  ): Promise<TranslationServices | HttpStatusCode> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/translation-services`, payload);

      if (response.status === HttpStatusCode.NoContent) {
        return HttpStatusCode.NoContent;
      }

      return translationServicesSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error saving translation services for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create or update a user
   */
  public async createUpdateUser(user: CreateUpdateUserRequest): Promise<User | HttpStatusCode> {
    try {
      const response = await dataApi.post('/user/v1', user);
      return userSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error creating/updating user with SSO ID ${user.ssoId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
  /**
   * Request to data API to get court facilities by court id
   */
  public async getBuildingFacilities(courtId: string): Promise<BuildingFacilities | null | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/building-facilities`);

      if (response.status === HttpStatusCode.NoContent) {
        return null;
      }

      return BuildingFacilitiesSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court facilities for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update court facilities by court id
   */

  public async updateBuildingFacilities(
    courtId: string,
    payload: UpdateBuildingFacilitiesRequest
  ): Promise<BuildingFacilities | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/building-facilities`, payload);
      return BuildingFacilitiesSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error update court facilities for id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
