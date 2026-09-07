import { HttpStatusCode } from 'axios';
import sinon, { restore, stub } from 'sinon';

const mockDataApiLogger = {
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockDataApiLogger),
  },
}));

import { UserApi } from '../../../main/requests/UserApi';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const userApi = new UserApi();

const errorResponse = {
  isAxiosError: true,
  response: {
    data: 'test error',
    status: 404,
  },
};

const errorMessage = {
  message: 'test',
};

function expectedAxiosError(status: HttpStatusCode) {
  return {
    name: 'AxiosError',
    message: 'Data API request failed',
    status,
  };
}

describe('UserApi', () => {
  let getStub: sinon.SinonStub;
  let postStub: sinon.SinonStub;
  let deleteStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    jest.clearAllMocks();
    getStub = stub(dataApi, 'get');
    postStub = stub(dataApi, 'post');
    deleteStub = stub(dataApi, 'delete');
  });

  it('returns the user entity when create/update user succeeds', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };
    const userEntity = {
      email: 'user@justice.gov.uk',
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      lastLogin: '2026-05-27T10:35:23.406Z',
      role: 'ADMIN',
      ssoId: '00000000-0000-0000-0000-000000000000',
    };

    postStub.withArgs('/user/v1', user).resolves({ data: userEntity });

    const response = await userApi.createUpdateUser(user);

    expect(response).toEqual(userEntity);
  });

  it('sends Viewer when creating or updating a viewer user', async () => {
    const user = {
      email: 'viewer@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Viewer' as const,
    };
    const userEntity = {
      email: 'viewer@justice.gov.uk',
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      lastLogin: '2026-05-27T10:35:23.406Z',
      role: 'Viewer',
      ssoId: '00000000-0000-0000-0000-000000000000',
    };

    postStub.withArgs('/user/v1', user).resolves({ data: userEntity });

    const response = await userApi.createUpdateUser(user);

    expect(response).toEqual(userEntity);
    expect(postStub.calledWith('/user/v1', user)).toBe(true);
  });

  it('strips the legacy favouriteCourts field from a create/update user response', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };
    const legacyUserEntity = {
      email: 'user@justice.gov.uk',
      favouriteCourts: null,
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      lastLogin: '2026-05-27T10:35:23.406Z',
      role: 'ADMIN',
      ssoId: '00000000-0000-0000-0000-000000000000',
    };

    postStub.withArgs('/user/v1', user).resolves({ data: legacyUserEntity });

    const response = await userApi.createUpdateUser(user);

    expect(response).toEqual({
      email: legacyUserEntity.email,
      id: legacyUserEntity.id,
      lastLogin: legacyUserEntity.lastLogin,
      role: legacyUserEntity.role,
      ssoId: legacyUserEntity.ssoId,
    });
  });

  it('returns internal server error when create/update user response fails schema validation', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).resolves({
      data: {
        email: 'not-an-email',
      },
    });

    const response = await userApi.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the API status when create/update user fails with an axios response', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).rejects(errorResponse);

    const response = await userApi.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.NotFound);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      'Error creating/updating user:',
      expectedAxiosError(HttpStatusCode.NotFound)
    );
  });

  it('returns internal server error when create/update user fails without an axios response', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).rejects(errorMessage);

    const response = await userApi.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns paged users when the users list response is valid', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      search: 'admin',
    };
    const users = {
      content: [
        {
          email: 'admin@example.com',
          id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          lastLogin: '2026-05-27T10:35:23.406Z',
          role: 'Admin',
          ssoId: '00000000-0000-4000-8000-000000000000',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
      },
    };

    getStub.withArgs('/user/v1', { params }).resolves({ data: users });

    const response = await userApi.getUsers(params);

    expect(response).toEqual(users);
  });

  it('returns internal server error when users list response fails schema validation', async () => {
    getStub.withArgs('/user/v1', { params: {} }).resolves({
      data: {
        content: [
          {
            email: 'not-an-email',
          },
        ],
      },
    });

    const response = await userApi.getUsers();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the API status when users list fails with an axios response', async () => {
    getStub.withArgs('/user/v1', { params: {} }).rejects(errorResponse);

    const response = await userApi.getUsers();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('gets the current user favourites page', async () => {
    const params = { pageNumber: 1, pageSize: 25 };
    const responseBody = {
      content: [],
      page: { number: 1, size: 25, totalElements: 30, totalPages: 2 },
    };
    getStub.withArgs('/user/v1/favourites', { params }).resolves({ data: responseBody });

    await expect(userApi.getFavourites(params)).resolves.toEqual(responseBody);
  });

  it('returns internal server error when getFavourites fails without an axios error', async () => {
    getStub.withArgs('/user/v1/favourites', { params: {} }).rejects(errorMessage);

    const response = await userApi.getFavourites();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the API status when getFavourites fails with an axios response', async () => {
    getStub.withArgs('/user/v1/favourites', { params: {} }).rejects(errorResponse);

    const response = await userApi.getFavourites();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('gets batched favourite statuses', async () => {
    const subjects = [
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT' as const,
      },
    ];
    const responseBody = [{ ...subjects[0], favourite: true }];
    postStub.withArgs('/user/v1/favourites/status', { subjects }).resolves({ data: responseBody });

    await expect(userApi.getFavouriteStatuses(subjects)).resolves.toEqual(responseBody);
  });

  it('returns internal server error when getFavouriteStatuses fails without an axios error', async () => {
    const subjects = [{ subjectId: '11111111-1111-4111-8111-111111111111', subjectType: 'COURT' as const }];
    postStub.withArgs('/user/v1/favourites/status', { subjects }).rejects(errorMessage);

    const response = await userApi.getFavouriteStatuses(subjects);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the API status when getFavouriteStatuses fails with an axios response', async () => {
    const subjects = [
      {
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT' as const,
      },
    ];
    postStub.withArgs('/user/v1/favourites/status', { subjects }).rejects(errorResponse);

    const response = await userApi.getFavouriteStatuses(subjects);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('adds and removes a subject favourite', async () => {
    const favourite = {
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE' as const,
    };
    postStub.withArgs('/user/v1/favourites', favourite).resolves({ status: HttpStatusCode.Created });
    deleteStub
      .withArgs(`/user/v1/favourites/${favourite.subjectType}/${favourite.subjectId}`)
      .resolves({ status: HttpStatusCode.NoContent });

    await expect(userApi.addFavourite(favourite)).resolves.toBe(HttpStatusCode.Created);
    await expect(userApi.removeFavourite(favourite)).resolves.toBe(HttpStatusCode.NoContent);
  });

  it('returns the upstream status when a favourite mutation fails', async () => {
    const favourite = {
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'COURT' as const,
    };
    postStub.withArgs('/user/v1/favourites', favourite).rejects(errorResponse);
    deleteStub.withArgs(`/user/v1/favourites/COURT/${favourite.subjectId}`).rejects(errorResponse);

    await expect(userApi.addFavourite(favourite)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(userApi.removeFavourite(favourite)).resolves.toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when a favourite mutation fails without an axios response', async () => {
    const favourite = {
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'COURT' as const,
    };
    postStub.withArgs('/user/v1/favourites', favourite).rejects(errorMessage);
    deleteStub.withArgs(`/user/v1/favourites/COURT/${favourite.subjectId}`).rejects(errorMessage);

    await expect(userApi.addFavourite(favourite)).resolves.toBe(HttpStatusCode.InternalServerError);
    await expect(userApi.removeFavourite(favourite)).resolves.toBe(HttpStatusCode.InternalServerError);
  });
});
