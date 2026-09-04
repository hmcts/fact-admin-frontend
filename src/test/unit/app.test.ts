import type { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';

const mockPassThroughMiddleware = jest.fn((_request: Request, _response: Response, next: NextFunction): void => {
  next();
});
const mockLoadControllers = jest.fn(() => mockPassThroughMiddleware);
const mockScopePerRequest = jest.fn(() => mockPassThroughMiddleware);

jest.mock('awilix-express', () => ({
  loadControllers: mockLoadControllers,
  scopePerRequest: mockScopePerRequest,
}));

const mockRateLimit = jest.fn(() => mockPassThroughMiddleware);

jest.mock('express-rate-limit', () => mockRateLimit);

let mockAuthenticationError: Error | undefined;
const mockRequireAuthenticated = jest.fn((_request: Request, _response: Response, next: NextFunction): void => {
  next(mockAuthenticationError);
});
const mockRequiresAuth = jest.fn(() => mockRequireAuthenticated);

jest.mock('express-openid-connect', () => ({
  requiresAuth: mockRequiresAuth,
}));

const mockGetFactUser = jest.fn();
const mockGetFactUserId = jest.fn();
const mockIsAdmin = jest.fn();
const mockIsSuperAdmin = jest.fn();
const mockIsViewer = jest.fn();

jest.mock('../../main/modules/authentication/authenticationHelper', () => ({
  getFactUser: mockGetFactUser,
  getFactUserId: mockGetFactUserId,
  isAdmin: mockIsAdmin,
  isSuperAdmin: mockIsSuperAdmin,
  isViewer: mockIsViewer,
}));

const mockAppInsightsEnable = jest.fn();
const mockAuthenticationEnableFor = jest.fn();
const mockContainerEnableFor = jest.fn((expressApp: Express): void => {
  expressApp.locals.container = {};
});
const mockHelmetEnableFor = jest.fn();
const mockLockingEnableFor = jest.fn();
const mockPropertiesVolumeEnableFor = jest.fn();
const mockRedisEnableFor = jest.fn();
const mockRequestLoggingEnableFor = jest.fn();

jest.mock('../../main/modules/appinsights', () => ({
  AppInsights: jest.fn().mockImplementation(() => ({ enable: mockAppInsightsEnable })),
}));

jest.mock('../../main/modules/authentication', () => ({
  Authentication: jest.fn().mockImplementation(() => ({ enableFor: mockAuthenticationEnableFor })),
}));

jest.mock('../../main/modules/awilix', () => ({
  Container: jest.fn().mockImplementation(() => ({ enableFor: mockContainerEnableFor })),
}));

jest.mock('../../main/modules/helmet', () => ({
  Helmet: jest.fn().mockImplementation(() => ({ enableFor: mockHelmetEnableFor })),
}));

jest.mock('../../main/modules/locking', () => ({
  LockingInterceptor: jest.fn().mockImplementation(() => ({ enableFor: mockLockingEnableFor })),
}));

const mockViewEngine = jest.fn(
  (_filePath: string, _options: object, callback: (error: Error | null, rendered?: string) => void): void => {
    callback(null, 'rendered view');
  }
);
const mockNunjucksEnableFor = jest.fn((expressApp: Express): void => {
  expressApp.set('views', `${process.cwd()}/src/main/views`);
  expressApp.engine('njk', mockViewEngine);
  expressApp.set('view engine', 'njk');
});

jest.mock('../../main/modules/nunjucks', () => ({
  Nunjucks: jest.fn().mockImplementation(() => ({ enableFor: mockNunjucksEnableFor })),
}));

jest.mock('../../main/modules/properties-volume', () => ({
  PropertiesVolume: jest.fn().mockImplementation(() => ({ enableFor: mockPropertiesVolumeEnableFor })),
}));

jest.mock('../../main/modules/redis/RedisModule', () => ({
  RedisModule: jest.fn().mockImplementation(() => ({ enableFor: mockRedisEnableFor })),
}));

const mockNormaliseRequestPath = jest.fn((path: string) => path);

jest.mock('../../main/modules/request-logging', () => ({
  RequestLogging: jest.fn().mockImplementation(() => ({ enableFor: mockRequestLoggingEnableFor })),
  normaliseRequestPath: mockNormaliseRequestPath,
}));

const mockErrorEvent = jest.fn();
const mockWarnEvent = jest.fn();

jest.mock('../../main/modules/logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue({
      errorEvent: mockErrorEvent,
      warnEvent: mockWarnEvent,
    }),
  },
}));

const mockSetupDev = jest.fn();

jest.mock('../../main/development', () => ({
  setupDev: mockSetupDev,
}));

const mockRunWithDataApiUserId = jest.fn((_userId: string | undefined, callback: () => void): void => {
  callback();
});

jest.mock('../../main/requests/utils/dataApiRequestContext', () => ({
  runWithDataApiUserId: mockRunWithDataApiUserId,
}));

import { app } from '../../main/app';

describe('app', () => {
  const originalMaintenanceMode = process.env.MAINTENANCE_MODE;

  beforeEach(() => {
    mockAuthenticationError = undefined;
    mockRequireAuthenticated.mockClear();
    mockGetFactUser.mockReset().mockReturnValue({ role: 'Admin' });
    mockGetFactUserId.mockReset().mockReturnValue('test-user-id');
    mockIsAdmin.mockReset().mockReturnValue(true);
    mockIsSuperAdmin.mockReset().mockReturnValue(false);
    mockIsViewer.mockReset().mockReturnValue(false);
    mockRunWithDataApiUserId.mockClear();
    mockNormaliseRequestPath.mockClear();
    mockErrorEvent.mockClear();
    mockWarnEvent.mockClear();
    mockViewEngine.mockClear();
    delete process.env.MAINTENANCE_MODE;
  });

  afterAll(() => {
    if (originalMaintenanceMode === undefined) {
      delete process.env.MAINTENANCE_MODE;
    } else {
      process.env.MAINTENANCE_MODE = originalMaintenanceMode;
    }
  });

  test('configures the application modules and middleware', () => {
    expect(app.locals.ENV).toBe(process.env.NODE_ENV || 'development');
    expect(mockPropertiesVolumeEnableFor).toHaveBeenCalledWith(app);
    expect(mockAppInsightsEnable).toHaveBeenCalledTimes(1);
    expect(mockNunjucksEnableFor).toHaveBeenCalledWith(app);
    expect(mockHelmetEnableFor).toHaveBeenCalledWith(app);
    expect(mockContainerEnableFor).toHaveBeenCalledWith(app);
    expect(mockRedisEnableFor).toHaveBeenCalledWith(app);
    expect(mockRequestLoggingEnableFor).toHaveBeenCalledWith(app);
    expect(mockAuthenticationEnableFor).toHaveBeenCalledWith(app);
    expect(mockLockingEnableFor).toHaveBeenCalledWith(app);
    expect(mockScopePerRequest).toHaveBeenCalledWith(app.locals.container);
    expect(mockLoadControllers).toHaveBeenCalledTimes(2);
    expect(mockSetupDev).toHaveBeenCalledWith(app, false);
    expect(mockRateLimit).toHaveBeenCalledWith({
      windowMs: 15 * 60 * 1000,
      max: 100,
    });
  });

  test('keeps public routes open and propagates the request context', async () => {
    const response = await request(app).get('/health/liveness');

    expect(response.status).toBe(404);
    expect(response.headers['cache-control']).toBe('no-cache, max-age=0, must-revalidate, no-store');
    expect(mockRequireAuthenticated).not.toHaveBeenCalled();
    expect(mockGetFactUserId).toHaveBeenCalledTimes(1);
    expect(mockRunWithDataApiUserId).toHaveBeenCalledWith('test-user-id', expect.any(Function));
  });

  test('allows an admin to continue to an admin route', async () => {
    const response = await request(app).get('/courts');

    expect(response.status).toBe(404);
    expect(mockRequireAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockIsAdmin).toHaveBeenCalledTimes(1);
    expect(mockWarnEvent).not.toHaveBeenCalled();
  });

  test('denies a non-admin access to an admin route and records an unknown role', async () => {
    mockIsAdmin.mockReturnValue(false);
    mockGetFactUser.mockReturnValue(undefined);

    const response = await request(app).get('/courts');

    expect(response.status).toBe(403);
    expect(mockWarnEvent).toHaveBeenCalledWith('authorization.access_denied', {
      method: 'GET',
      requestPath: '/courts',
      role: 'unknown',
    });
  });

  test('denies admin users access to super admin routes', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(403);
    expect(mockViewEngine.mock.calls[0][0]).toContain('access-denied.njk');
    expect(mockWarnEvent).toHaveBeenCalledWith('authorization.access_denied', {
      method: 'GET',
      requestPath: '/users',
      role: 'Admin',
    });
  });

  test('renders the service unavailable page for an admin during maintenance', async () => {
    process.env.MAINTENANCE_MODE = ' TRUE ';

    const response = await request(app).get('/courts');

    expect(response.status).toBe(200);
    expect(mockViewEngine.mock.calls[0][0]).toContain('service-unavailable.njk');
  });

  test('allows super admin users to continue during maintenance', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    mockIsAdmin.mockReturnValue(false);
    mockIsSuperAdmin.mockReturnValue(true);

    const response = await request(app).get('/users');

    expect(response.status).toBe(404);
    expect(mockWarnEvent).not.toHaveBeenCalled();
  });

  test.each([
    ['GET', '/courts/11111111-1111-4111-8111-111111111111/edit/general'],
    ['POST', '/courts/11111111-1111-4111-8111-111111111111/edit/approve'],
    ['POST', '/favourites/COURT/11111111-1111-4111-8111-111111111111'],
  ])('allows a viewer to continue for %s %s', async (method, path) => {
    mockIsAdmin.mockReturnValue(false);
    mockIsViewer.mockReturnValue(true);
    mockGetFactUser.mockReturnValue({ role: 'Viewer' });

    const response = method === 'GET' ? await request(app).get(path) : await request(app).post(path);

    expect(response.status).toBe(404);
    expect(mockWarnEvent).not.toHaveBeenCalled();
  });

  test('denies a viewer access to a mutation route', async () => {
    mockIsAdmin.mockReturnValue(false);
    mockIsViewer.mockReturnValue(true);
    mockGetFactUser.mockReturnValue({ role: 'Viewer' });

    const response = await request(app).post('/courts/11111111-1111-4111-8111-111111111111/edit/general/success');

    expect(response.status).toBe(403);
    expect(mockWarnEvent).toHaveBeenCalledWith('authorization.access_denied', {
      method: 'POST',
      requestPath: '/courts/11111111-1111-4111-8111-111111111111/edit/general/success',
      role: 'Viewer',
    });
  });

  test('renders not found for an unmatched protected route', async () => {
    const response = await request(app).get('/not-a-route');

    expect(response.status).toBe(404);
    expect(mockViewEngine.mock.calls[0][0]).toContain('not-found.njk');
  });

  test('passes authentication failures to the application error handler', async () => {
    mockAuthenticationError = Object.assign(new Error('Authentication failed'), { status: 502 });

    const response = await request(app).get('/courts');

    expect(response.status).toBe(502);
    expect(mockNormaliseRequestPath).toHaveBeenCalledWith('/courts');
    expect(mockErrorEvent).toHaveBeenCalledWith(
      'http.request.unhandled_error',
      {
        method: 'GET',
        requestPath: '/courts',
        statusCode: 502,
      },
      mockAuthenticationError
    );
    expect(mockViewEngine.mock.calls[0][0]).toContain('error.njk');
  });

  test('defaults application errors without a status to internal server error', async () => {
    mockAuthenticationError = new Error('Authentication failed');

    const response = await request(app).get('/courts');

    expect(response.status).toBe(500);
    expect(mockErrorEvent).toHaveBeenCalledWith(
      'http.request.unhandled_error',
      {
        method: 'GET',
        requestPath: '/courts',
        statusCode: 500,
      },
      mockAuthenticationError
    );
  });
});
