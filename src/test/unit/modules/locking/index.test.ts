/* eslint-disable import/order */
import { HttpStatusCode } from 'axios';
import * as express from 'express';

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
    new LockingInterceptor(async () => dataApi as never).enableFor(app);
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
    expect(next).not.toHaveBeenCalled();
  });

  test('sets timeout dialog config and calls next when lock acquired', async () => {
    const dataApi = {
      clearUserLocks: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectType: SubjectType.SERVICE_CENTRE,
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
    const req = { path: `/service-centres/${subjectId}/edit/address` } as express.Request;
    const res = createResponse();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.locals.userId).toBe('22222222-2222-4222-8222-222222222222');
    expect(res.locals.timeoutDialogConfig).toEqual({
      subject: 'service centre',
      timeout: 900,
      countdown: 120,
      signOutUrl: `/service-centres/${subjectId}/edit`,
      timeoutUrl: `/service-centres/${subjectId}/edit?timeout=15`,
    });
  });
});
