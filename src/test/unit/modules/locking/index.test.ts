/* eslint-disable import/order */
import { HttpStatusCode } from 'axios';
import * as express from 'express';

import { OperationsApi } from '../../../../main/requests/OperationsApi';
import { Page } from '../../../../main/schemas/lockSchema';
import { SubjectType } from '../../../../main/schemas/subjectTypeSchema';

jest.mock('../../../../main/modules/authentication/authenticationHelper', () => ({
  getFactUserId: jest.fn(),
  isAdmin: jest.fn(),
  isSuperAdmin: jest.fn(),
}));

import { LockingInterceptor } from '../../../../main/modules/locking';
import { getFactUserId, isAdmin, isSuperAdmin } from '../../../../main/modules/authentication/authenticationHelper';

describe('LockingInterceptor', () => {
  const getFactUserIdMock = getFactUserId as jest.MockedFunction<typeof getFactUserId>;
  const isAdminMock = isAdmin as jest.MockedFunction<typeof isAdmin>;
  const isSuperAdminMock = isSuperAdmin as jest.MockedFunction<typeof isSuperAdmin>;

  const subjectId = '11111111-1111-4111-8111-111111111111';
  const logger = {
    errorEvent: jest.fn(),
    infoEvent: jest.fn(),
    warnEvent: jest.fn(),
  };

  const createResponse = (): express.Response => {
    const res = {
      locals: {},
      status: jest.fn(),
      render: jest.fn(),
    } as unknown as express.Response;

    (res.status as unknown as jest.Mock).mockReturnValue(res);
    return res;
  };

  const createMiddleware = (dataApi: { clearUserLocks: jest.Mock; acquireLock: jest.Mock; getLock: jest.Mock }) => {
    const app = { use: jest.fn() } as unknown as express.Express;
    new LockingInterceptor(async () => dataApi as never, logger).enableFor(app);
    return (app.use as unknown as jest.Mock).mock.calls[0][0] as (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => Promise<void>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getFactUserIdMock.mockReturnValue('22222222-2222-4222-8222-222222222222');
    isAdminMock.mockReturnValue(true);
    isSuperAdminMock.mockReturnValue(false);
  });

  test('skips processing and calls next when user is not admin/super admin', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn(),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: `/courts/${subjectId}/edit/address` } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    isAdminMock.mockReturnValue(false);
    isSuperAdminMock.mockReturnValue(false);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(dataApi.acquireLock).not.toHaveBeenCalled();
    expect(dataApi.clearUserLocks).not.toHaveBeenCalled();
  });

  test('clears user locks for non-lockable paths and calls next', async () => {
    const dataApi = {
      clearUserLocks: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
      acquireLock: jest.fn(),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: '/courts' } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(dataApi.clearUserLocks).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test.each([HttpStatusCode.BadRequest, HttpStatusCode.BadGateway])(
    'warns when clearUserLocks fails with %s but still calls next',
    async statusCode => {
      const dataApi = {
        clearUserLocks: jest.fn().mockResolvedValue(statusCode),
        acquireLock: jest.fn(),
        getLock: jest.fn(),
      };
      const middleware = createMiddleware(dataApi);
      const req = { path: '/courts' } as express.Request;
      const res = createResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(dataApi.clearUserLocks).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
      expect(logger.warnEvent).toHaveBeenCalledWith('locking.clear_failed', { statusCode });
      expect(dataApi.acquireLock).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    }
  );

  test('passes control to the destination page when the lock subject is not found', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = {
      path: `/courts/${subjectId}/edit/address`,
    } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(dataApi.acquireLock).toHaveBeenCalledWith(
      SubjectType.COURT,
      subjectId,
      Page.ADDRESS,
      '22222222-2222-4222-8222-222222222222'
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
    expect(res.locals.timeoutDialogConfig).toBeUndefined();
    expect(logger.warnEvent).not.toHaveBeenCalled();
    expect(logger.errorEvent).not.toHaveBeenCalled();
  });

  test.each([`/courts/${subjectId}/edit/approve`, `/service-centres/${subjectId}/edit/approve`])(
    'does not acquire a lock for the approval page at %s',
    async path => {
      const dataApi = {
        clearUserLocks: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
        acquireLock: jest.fn(),
        getLock: jest.fn(),
      };
      const middleware = createMiddleware(dataApi);
      const req = { path } as express.Request;
      const res = createResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(dataApi.clearUserLocks).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
      expect(dataApi.acquireLock).not.toHaveBeenCalled();
      expect(res.render).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    }
  );

  test('renders lock failed when page key is not mapped', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn(),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: `/courts/${subjectId}/edit/not-a-page` } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(res.render).toHaveBeenCalledWith('lock-failed', {
      subject: 'court',
      page: 'not a page',
    });
    expect(logger.warnEvent).toHaveBeenCalledWith('locking.page_not_mapped', {
      pageKey: 'not-a-page',
      subjectType: SubjectType.COURT,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('renders lock exists when acquisition reports conflict', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(HttpStatusCode.Conflict),
      getLock: jest.fn().mockResolvedValue({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectType: SubjectType.COURT,
        subjectId,
        userId: '33333333-3333-4333-8333-333333333333',
        user: {
          id: '33333333-3333-4333-8333-333333333333',
          email: 'other.editor@justice.gov.uk',
        },
        page: Page.ADDRESS,
        lockAcquired: '2026-07-09T10:00:00.000Z',
      }),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: `/courts/${subjectId}/edit/address` } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(dataApi.acquireLock).toHaveBeenCalledWith(
      SubjectType.COURT,
      subjectId,
      Page.ADDRESS,
      '22222222-2222-4222-8222-222222222222'
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.Conflict);
    expect(res.render).toHaveBeenCalledWith(
      'lock-exists',
      expect.objectContaining({
        subject: 'court',
        page: 'address',
      })
    );
    expect(logger.infoEvent).toHaveBeenCalledWith('locking.acquire_conflict', {
      page: Page.ADDRESS,
      subjectType: SubjectType.COURT,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('renders lock failed and warns for non-server acquisition failure', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(HttpStatusCode.BadRequest),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: `/courts/${subjectId}/edit/address` } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.BadRequest);
    expect(res.render).toHaveBeenCalledWith('lock-failed', {
      subject: 'court',
      page: 'address',
    });
    expect(logger.warnEvent).toHaveBeenCalledWith('locking.acquire_failed', {
      page: Page.ADDRESS,
      statusCode: HttpStatusCode.BadRequest,
      subjectType: SubjectType.COURT,
    });
    expect(logger.errorEvent).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('logs server failures while acquiring a lock', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable),
      getLock: jest.fn(),
    };
    const middleware = createMiddleware(dataApi);
    const req = { path: `/courts/${subjectId}/edit/address` } as express.Request;
    const res = createResponse();

    await middleware(req, res, jest.fn());

    expect(logger.errorEvent).toHaveBeenCalledWith('locking.acquire_failed', {
      page: Page.ADDRESS,
      statusCode: HttpStatusCode.ServiceUnavailable,
      subjectType: SubjectType.COURT,
    });
  });

  test.each([
    {
      path: `/service-centres/${subjectId}/edit/address`,
      subjectType: SubjectType.SERVICE_CENTRE,
      expectedSubject: 'service centre',
      expectedSignOutUrl: `/service-centres/${subjectId}/edit`,
    },
    {
      path: `/courts/${subjectId}/edit/address`,
      subjectType: SubjectType.COURT,
      expectedSubject: 'court',
      expectedSignOutUrl: `/courts/${subjectId}/edit`,
    },
  ])(
    'sets timeout dialog config and calls next when lock acquired for $subjectType',
    async ({ path, subjectType, expectedSubject, expectedSignOutUrl }) => {
      const dataApi = {
        clearUserLocks: jest.fn(),
        acquireLock: jest.fn().mockResolvedValue({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          subjectType,
          subjectId,
          userId: '22222222-2222-4222-8222-222222222222',
          user: {
            id: '22222222-2222-4222-8222-222222222222',
            email: 'editor@justice.gov.uk',
          },
          page: Page.ADDRESS,
          lockAcquired: '2026-07-09T10:00:00.000Z',
        }),
        getLock: jest.fn(),
      };
      const middleware = createMiddleware(dataApi);
      const req = { path } as express.Request;
      const res = createResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(dataApi.acquireLock).toHaveBeenCalledWith(
        subjectType,
        subjectId,
        Page.ADDRESS,
        '22222222-2222-4222-8222-222222222222'
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.locals.userId).toBe('22222222-2222-4222-8222-222222222222');
      expect(res.locals.timeoutDialogConfig).toEqual({
        subject: expectedSubject,
        timeout: 900,
        countdown: 120,
        signOutUrl: expectedSignOutUrl,
        timeoutUrl: `${expectedSignOutUrl}?timeout=15`,
      });
    }
  );

  test('uses default OperationsApi provider lazily and reuses cached instance', async () => {
    const clearUserLocksSpy = jest
      .spyOn(OperationsApi.prototype, 'clearUserLocks')
      .mockResolvedValue(HttpStatusCode.NoContent);

    const app = { use: jest.fn() } as unknown as express.Express;
    new LockingInterceptor().enableFor(app);

    const middleware = (app.use as unknown as jest.Mock).mock.calls[0][0] as (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => Promise<void>;

    const req = { path: '/courts' } as express.Request;
    const res1 = createResponse();
    const res2 = createResponse();
    const next1 = jest.fn();
    const next2 = jest.fn();

    await middleware(req, res1, next1);
    await middleware(req, res2, next2);

    expect(next1).toHaveBeenCalledTimes(1);
    expect(next2).toHaveBeenCalledTimes(1);
    expect(clearUserLocksSpy).toHaveBeenCalledTimes(2);
  });
});
