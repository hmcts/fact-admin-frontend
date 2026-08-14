import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import {
  AreaOfLawType,
  areaOfLawListSchema,
} from '../schemas/areaOfLawSchema';
import { ContactDescriptionType, contactDescriptionTypeListSchema } from '../schemas/contactDescriptionTypeSchema';
import { CourtType, courtTypeListSchema } from '../schemas/courtTypeSchema';
import { LocalAuthorityType, localAuthorityTypeListSchema } from '../schemas/localAuthorityTypeSchema';
import {
  OpeningHourType,
  openingHourTypeListSchema,
} from '../schemas/openingHoursSchema';
import { OsData, osDataSchema } from '../schemas/osDataSchema';
import { Region, regionsSchema } from '../schemas/regionSchema';
import { ServiceArea, serviceAreaListSchema } from '../schemas/serviceAreaSchema';

import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

export class ReferenceDataApi {
  /**
   * Request to data API to get all regions
   */
  public async getRegions(): Promise<Region[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/regions');
      return regionsSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching regions:', toSafeErrorDetails(error));
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
      logger.error('Error fetching area of law type details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to retrieve service areas
   */
  public async getServiceAreas(): Promise<ServiceArea[] | HttpStatusCode> {
    try {
      const response = await dataApi.get('/types/v1/service-areas');
      return serviceAreaListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching service area type details:', toSafeErrorDetails(error));
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
      logger.error('Error fetching court type details:', toSafeErrorDetails(error));
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
      return contactDescriptionTypeListSchema.parse(response.data).sort((a, b) => {
        const aIsEnquiries = a.name.trim().localeCompare('Enquiries', undefined, { sensitivity: 'base' }) === 0;
        const bIsEnquiries = b.name.trim().localeCompare('Enquiries', undefined, { sensitivity: 'base' }) === 0;

        if (aIsEnquiries && !bIsEnquiries) {
          return -1;
        }

        if (!aIsEnquiries && bIsEnquiries) {
          return 1;
        }

        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
    } catch (error: unknown) {
      logger.error('Error fetching contact description type details:', toSafeErrorDetails(error));
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
      logger.error('Error fetching opening hour type details:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
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
      logger.error('Error fetching local authority type details:', toSafeErrorDetails(error));
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
      logger.error('Error fetching OS postcode search results:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
