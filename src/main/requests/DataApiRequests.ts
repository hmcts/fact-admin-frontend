import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';
import { z } from 'zod';

import {
  CounterServiceOpeningHours,
  CounterServiceOpeningHoursListSchema,
  CounterServiceOpeningHoursSchema,
} from '../schemas/CounterServiceOpeningHoursSchema';
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
import { CourtLocalAuthoritiesList, courtLocalAuthoritiesListSchema } from '../schemas/courtLocalAuthoritiesSchema';
import {
  CourtProfessionalInformation,
  courtProfessionalInformationSchema,
} from '../schemas/courtProfessionalInformationSchema';
import { CourtType, courtTypeListSchema } from '../schemas/courtTypeSchema';
import { LocalAuthorityType, localAuthorityTypeListSchema } from '../schemas/localAuthorityTypeSchema';
import { OsData, osDataSchema } from '../schemas/osDataSchema';
import { Region, regionsSchema } from '../schemas/regionSchema';
import { TranslationServices, translationServicesSchema } from '../schemas/translationServicesSchema';
import { User, userSchema } from '../schemas/userSchema';

import { CreateUpdateUserRequest } from './types/CreateUpdateUserRequest';
import { GetCourtsParams } from './types/GetCourtsParams';
import { UpdateBuildingFacilitiesRequest } from './types/UpdateBuildingFacilitiesRequest';
import { UpdateCounterServiceOpeningHoursRequest } from './types/UpdateCounterServiceOpeningHoursRequest';
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
   * Request to data API to get a court entity by exact court name
   */
  public async getCourtByName(courtName: string): Promise<CourtEntity | HttpStatusCode> {
    try {
      const response = await dataApi.get('/courts/name/v1', { params: { name: courtName } });
      return courtEntitySchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.NotFound) {
        return HttpStatusCode.NotFound;
      }

      logger.error(`Error fetching court details for name ${courtName}:`, error);
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
   * Request to data API to create a court
   */
  public async createCourt(
    court: Pick<CourtEntity, 'isServiceCentre' | 'name' | 'open' | 'regionId'>
  ): Promise<CourtEntity | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post('/courts/v1', court);
      return courtEntitySchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error creating court:', error);
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
      logger.error('Error fetching court type details:', error);
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
   * Request to data API to retrieve local authority types
   */
  public async getLocalAuthorities(): Promise<LocalAuthorityType[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/local-authorities');
      return localAuthorityTypeListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching local authority type details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get local authority data by court id
   */
  public async getCourtLocalAuthorities(courtId: string): Promise<CourtLocalAuthoritiesList | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/local-authorities`);
      return courtLocalAuthoritiesListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching local authority data for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update local authority data by court id
   */
  public async updateCourtLocalAuthorities(
    courtId: string,
    localAuthorities: CourtLocalAuthoritiesList
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${courtId}/v1/local-authorities`, localAuthorities);
      return response.status;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating court local authority details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get professional information data by court id
   */
  public async getCourtProfessionalInformation(
    courtId: string
  ): Promise<CourtProfessionalInformation | null | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/professional-information`);
      if (response.status === HttpStatusCode.NoContent) {
        return null;
      }
      return courtProfessionalInformationSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching professional information data for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create or update professional information by court id
   */
  public async saveCourtProfessionalInformation(
    courtId: string,
    payload: CourtProfessionalInformation
  ): Promise<CourtProfessionalInformation | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/professional-information`, payload);
      return courtProfessionalInformationSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error saving professional information data for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
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
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve counter service opening hours by court id
   */
  public async getCounterServiceOpeningHours(courtId: string): Promise<CounterServiceOpeningHours[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/opening-hours/counter-service`);

      if (response.status === HttpStatusCode.NoContent) {
        return HttpStatusCode.NoContent;
      }

      console.log('Is array:', Array.isArray(response.data));
      console.log('Scheam type', CounterServiceOpeningHoursListSchema instanceof z.ZodArray);
      return CounterServiceOpeningHoursListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court counter service opening hours for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve a counter service opening hours record by id
   */
  public async getCounterServiceOpeningHoursById(
    courtId: string,
    counterServiceId: string
  ): Promise<CounterServiceOpeningHours | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/opening-hours/counter-service/${counterServiceId}`);
      return CounterServiceOpeningHoursSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching counter service opening hour ${counterServiceId} for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete counter service opening hours
   */
  public async deleteCounterServiceOpeningHours(courtId: string, counterServiceId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/courts/${courtId}/v1/opening-hours/counter-service/${counterServiceId}`);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error(`Error deleting counter service opening hours ${counterServiceId} for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  // /**
  //  * Request to data API to get court counter service opening hours by court id
  //  */
  // public async getCounterServiceOpeningHours(
  //   courtId: string
  // ): Promise<CounterServiceOpeningHours | null | HttpStatusCode> {
  //   try {
  //     const response = await dataApi.get(`/courts/${courtId}/v1/opening-hours/counter-service`);
  //
  //     if (response.status === HttpStatusCode.NoContent) {
  //       return null;
  //     }
  //
  //     return CounterServiceOpeningHoursSchema.parse(response.data);
  //   } catch (error: unknown) {
  //     logger.error(`Error fetching court counter service opening hours for court id ${courtId}:`, error);
  //     return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
  //   }
  // }

  /**
   * Request to data API to update court counter service opening hours by court id
   */
  public async updateCounterServiceOpeningHours(
    courtId: string,
    payload: UpdateCounterServiceOpeningHoursRequest
  ): Promise<CounterServiceOpeningHours | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/opening-hours/counter-service`, payload);
      return CounterServiceOpeningHoursSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error update court counter service opening hours for id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }
}
