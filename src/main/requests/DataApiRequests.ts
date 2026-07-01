import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import { Accessibility, AccessibilityScheme } from '../schemas/accessibilitySchema';
import {
  AreaOfLawType,
  CourtAreaOfLawSelection,
  CourtAreasOfLawUpdate,
  areaOfLawListSchema,
  parseCourtAreasOfLawResponse,
} from '../schemas/areaOfLawSchema';
import { BuildingFacilities, BuildingFacilitiesSchema } from '../schemas/buildingFacilitiesSchema';
import { ContactDescriptionType, contactDescriptionTypeListSchema } from '../schemas/contactDescriptionTypeSchema';
import { CourtAddress, courtAddressListSchema, courtAddressSchema } from '../schemas/courtAddressSchema';
import { CourtContactDetail, courtContactDetailListSchema } from '../schemas/courtContactDetailSchema';
import { AllLocationDetails, CourtDetails, allLocationDetailsListSchema } from '../schemas/courtDetailsSchema';
import { CourtEntity, courtEntitySchema } from '../schemas/courtEntitySchema';
import { PagedCourts, pagedCourtsSchema } from '../schemas/courtListSchema';
import { CourtLocalAuthoritiesList, courtLocalAuthoritiesListSchema } from '../schemas/courtLocalAuthoritiesSchema';
import {
  CourtProfessionalInformation,
  courtProfessionalInformationSchema,
} from '../schemas/courtProfessionalInformationSchema';
import {
  CourtSinglePointOfEntryList,
  courtSinglePointOfEntryListSchema,
} from '../schemas/courtSinglePointOfEntrySchema';
import { CourtType, courtTypeListSchema } from '../schemas/courtTypeSchema';
import { LocalAuthorityType, localAuthorityTypeListSchema } from '../schemas/localAuthorityTypeSchema';
import {
  CourtOpeningHours,
  OpeningHourType,
  courtOpeningHoursListSchema,
  courtOpeningHoursSchema,
  openingHourTypeListSchema,
} from '../schemas/openingHoursSchema';
import { OsData, osDataSchema } from '../schemas/osDataSchema';
import { Region, regionsSchema } from '../schemas/regionSchema';
import { TranslationServices, translationServicesSchema } from '../schemas/translationServicesSchema';
import { User, userSchema } from '../schemas/userSchema';

import { CreateUpdateUserRequest } from './types/CreateUpdateUserRequest';
import { GetCourtsParams } from './types/GetCourtsParams';
import { SaveCourtContactDetailRequest } from './types/SaveCourtContactDetailRequest';
import { UpdateAccessibilityRequest } from './types/UpdateAccessibilityRequest';
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
      const response = await dataApi.get('/all/v1', { params });
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
    court: Pick<CourtEntity, 'name' | 'open' | 'regionId'>
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
    const locationsResponse = await this.getAllLocations();

    if (!Array.isArray(locationsResponse)) {
      return locationsResponse;
    }

    return locationsResponse.flatMap(location => (location.locationType === 'COURT' ? [location.court] : []));
  }

  /**
   * Request to data API to get all location details
   */
  public async getAllLocations(): Promise<AllLocationDetails[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/all/details/v1');
      return allLocationDetailsListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching all locations:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get contact details for a given court
   */
  public async getCourtContactDetails(courtId: string): Promise<CourtContactDetail[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/contact-details`);
      return courtContactDetailListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court contact details for court id ${courtId}:`, error);
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
   * Request to data API to create a new contact detail
   */
  public async createCourtContactDetail(
    courtId: string,
    payload: SaveCourtContactDetailRequest
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/contact-details`, payload);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error creating court contact detail:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update an existing contact detail
   */
  public async updateCourtContactDetail(
    courtId: string,
    contactDetailId: string,
    payload: SaveCourtContactDetailRequest
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${courtId}/v1/contact-details/${contactDetailId}`, payload);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating court contact detail:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete an existing contact detail
   */
  public async deleteCourtContactDetail(courtId: string, contactDetailId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/courts/${courtId}/v1/contact-details/${contactDetailId}`);
      if (response.status === HttpStatusCode.NoContent) {
        return response.status;
      }
      logger.error('Unexpected response status when deleting court contact detail:', response.status);
      return HttpStatusCode.InternalServerError;
    } catch (error: unknown) {
      logger.error('Error deleting court contact detail:', error);
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
   * Request to data API to retrieve contact description types
   */
  public async getContactDescriptionTypes(): Promise<ContactDescriptionType[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/contact-description-types');
      return contactDescriptionTypeListSchema
        .parse(response.data)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } catch (error: unknown) {
      logger.error('Error fetching contact description type details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve opening hour types
   */
  public async getOpeningHourTypes(): Promise<OpeningHourType[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/opening-hours-types');
      return openingHourTypeListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching opening hour type details:', error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve court opening hours by court id
   */
  public async getCourtOpeningHours(courtId: string): Promise<CourtOpeningHours[] | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/opening-hours`);

      if (response.status === HttpStatusCode.NoContent) {
        return HttpStatusCode.NoContent;
      }

      return courtOpeningHoursListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching court opening hours for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve a court opening hours record by id
   */
  public async getCourtOpeningHoursById(
    courtId: string,
    openingHoursId: string
  ): Promise<CourtOpeningHours | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`);
      return courtOpeningHoursSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching opening hours ${openingHoursId} for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to create or update court opening hours
   */
  public async saveCourtOpeningHours(
    courtId: string,
    payload: Partial<CourtOpeningHours>
  ): Promise<CourtOpeningHours | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${courtId}/v1/opening-hours`, payload);
      if (response.status >= HttpStatusCode.Ok && response.status < HttpStatusCode.MultipleChoices && !response.data) {
        return response.status as HttpStatusCode;
      }

      return courtOpeningHoursSchema.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error saving opening hours for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to delete court opening hours
   */
  public async deleteCourtOpeningHours(courtId: string, openingHoursId: string): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error(`Error deleting opening hours ${openingHoursId} for court id ${courtId}:`, error);
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
   * Request to data API to get single point of entry data by court id
   */
  public async getCourtSinglePointOfEntry(courtId: string): Promise<CourtSinglePointOfEntryList | HttpStatusCode> {
    try {
      const { data } = await dataApi.get(`/courts/${courtId}/v1/single-point-of-entry`);
      return courtSinglePointOfEntryListSchema.parse(data);
    } catch (error: unknown) {
      logger.error(`Error fetching single point of entry data for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update single point of entry data by court id
   */
  public async updateCourtSinglePointOfEntry(
    courtId: string,
    singlePointOfEntry: CourtSinglePointOfEntryList
  ): Promise<HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.put(`/courts/${courtId}/v1/single-point-of-entry`, singlePointOfEntry);
      return response.status;
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error('Error updating court single point of entry details:', error);
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
   * Request to data API to get accessibility options by court id
   */
  public async getAccessibility(courtId: string): Promise<Accessibility | null | HttpStatusCode> {
    try {
      const response = await dataApi.get(`/courts/${courtId}/v1/accessibility-options`);

      if (response.status === HttpStatusCode.NoContent) {
        return null;
      }

      return AccessibilityScheme.parse(response.data);
    } catch (error: unknown) {
      logger.error(`Error fetching accessibility options for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status ? error.response.status : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to update accessibility options by court id
   */
  public async updateAccessibility(
    courtId: string,
    payload: UpdateAccessibilityRequest
  ): Promise<Accessibility | HttpStatusCode | Map<string, string>> {
    try {
      const response = await dataApi.post(`/courts/${courtId}/v1/accessibility-options`, payload);
      return AccessibilityScheme.parse(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
        return new Map(Object.entries(error.response.data) as [string, string][]);
      }
      logger.error(`Error updating accessibility options for court id ${courtId}:`, error);
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
