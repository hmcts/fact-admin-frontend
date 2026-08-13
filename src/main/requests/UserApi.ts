import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode, isAxiosError } from 'axios';

import {
  FavouriteReference,
  FavouriteStatus,
  PagedFavourites,
  favouriteStatusListSchema,
  pagedFavouritesSchema,
} from '../schemas/favouriteSchema';
import { PagedUsers, pagedUsersSchema } from '../schemas/userListSchema';
import { User, userSchema } from '../schemas/userSchema';

import { CreateUpdateUserRequest } from './types/CreateUpdateUserRequest';
import { GetFavouritesParams } from './types/GetFavouritesParams';
import { GetUsersParams } from './types/GetUsersParams';
import { dataApi } from './utils/axiosConfig';
import { toSafeErrorDetails } from './utils/safeErrorDetails';

const logger = Logger.getLogger('app');

export class UserApi {
  /**
   * Gets the current user's paginated favourite courts and service centres.
   */
  public async getFavourites(params: GetFavouritesParams = {}): Promise<PagedFavourites | HttpStatusCode> {
    try {
      const response = await dataApi.get('/user/v1/favourites', { params });
      return pagedFavouritesSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching favourites:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Gets favourite state for locations on the current Courts page.
   */
  public async getFavouriteStatuses(subjects: FavouriteReference[]): Promise<FavouriteStatus[] | HttpStatusCode> {
    try {
      const response = await dataApi.post('/user/v1/favourites/status', { subjects });
      return favouriteStatusListSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching favourite statuses:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Adds a favourite for the current user.
   */
  public async addFavourite(favourite: FavouriteReference): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.post('/user/v1/favourites', favourite);
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error('Error adding favourite:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Removes a favourite for the current user.
   */
  public async removeFavourite(favourite: FavouriteReference): Promise<HttpStatusCode> {
    try {
      const response = await dataApi.delete(
        `/user/v1/favourites/${encodeURIComponent(favourite.subjectType)}/${encodeURIComponent(favourite.subjectId)}`
      );
      return response.status as HttpStatusCode;
    } catch (error: unknown) {
      logger.error('Error removing favourite:', toSafeErrorDetails(error));
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
      logger.error('Error creating/updating user:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }

  /**
   * Request to data API to get a filtered and paginated list of admin users
   */
  public async getUsers(params: GetUsersParams = {}): Promise<PagedUsers | HttpStatusCode> {
    try {
      const response = await dataApi.get('/user/v1', { params });
      return pagedUsersSchema.parse(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching users:', toSafeErrorDetails(error));
      return isAxiosError(error) && error.response?.status
        ? (error.response.status as HttpStatusCode)
        : HttpStatusCode.InternalServerError;
    }
  }
}
