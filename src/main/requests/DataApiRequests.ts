import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import { CourtDetails, courtDetailsListSchema } from '../schemas/courtDetailsSchema';
import { CourtEntity, courtEntitySchema } from '../schemas/courtEntitySchema';
import { PagedCourts, pagedCourtsSchema } from '../schemas/courtListSchema';
import { Region, regionsSchema } from '../schemas/regionSchema';
import { TranslationServices, translationServicesSchema } from '../schemas/translationServicesSchema';

import { GetCourtsParams } from './types/GetCourtsParams';
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
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
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
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
