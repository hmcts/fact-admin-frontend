import { HttpStatusCode } from 'axios';
import config from 'config';
import type { Express } from 'express';

const mockAuth = jest.fn();
const mockUserApiConstructor = jest.fn();

jest.mock('express-openid-connect', () => ({
  auth: mockAuth,
}));

jest.mock('config', () => ({
  get: jest.fn(),
}));

jest.mock('../../../../main/requests/UserApi', () => ({
  UserApi: jest.fn().mockImplementation(() => {
    const instance = { createUpdateUser: jest.fn() };
    mockUserApiConstructor(instance);
    return instance;
  }),
}));

import { Authentication } from '../../../../main/modules/authentication';
import { resolveFactUserRole } from '../../../../main/modules/authentication/roleResolver';
import { Logger } from '../../../../main/modules/logging';
import { UserApi } from '../../../../main/requests/UserApi';

type CallbackRequest = {
  oidc: {
    user?: {
      oid: string;
      preferred_username: string;
      roles: string[];
    };
  };
};

type CallbackSession = { factUser?: unknown };
type AfterCallback = (
  request: CallbackRequest,
  response: Record<string, never>,
  session: CallbackSession
) => Promise<CallbackSession>;

describe('Authentication', () => {
  const logger = {
    errorEvent: jest.fn(),
    infoEvent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockReturnValue(jest.fn());
    process.env.SSO_APP_REG_ID = 'client-id';
    process.env.SSO_APP_REG_SECRET = 'client-secret';
    process.env.SSO_APP_REG_TENANT_ID = 'tenant-id';
    process.env.SESSION_SECRET = 'session-secret';
  });

  test.each([
    [['Admin'], 'Admin'],
    [['SuperAdmin'], 'SuperAdmin'],
    [['Viewer'], 'Viewer'],
    [['Viewer', 'Admin'], 'Admin'],
    [['Viewer', 'Admin', 'SuperAdmin'], 'SuperAdmin'],
  ] as const)('resolves %j to %s', (roles, expectedRole) => {
    expect(resolveFactUserRole(roles)).toBe(expectedRole);
  });

  test.each([undefined, null, [], ['Unknown']])('rejects unsupported roles %j', roles => {
    expect(() => resolveFactUserRole(roles)).toThrow('Unable to determine user role');
  });

  test('uses Key Vault configuration when SSO/session env vars are missing', () => {
    const originalEnv = {
      SSO_APP_REG_ID: process.env.SSO_APP_REG_ID,
      SSO_APP_REG_SECRET: process.env.SSO_APP_REG_SECRET,
      SSO_APP_REG_TENANT_ID: process.env.SSO_APP_REG_TENANT_ID,
      SESSION_SECRET: process.env.SESSION_SECRET,
    };

    delete process.env.SSO_APP_REG_ID;
    delete process.env.SSO_APP_REG_SECRET;
    delete process.env.SSO_APP_REG_TENANT_ID;
    delete process.env.SESSION_SECRET;

    (config.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'secrets.fact-kv.SSO_APP_REG_ID':
          return 'kv-client-id';
        case 'secrets.fact-kv.SSO_APP_REG_SECRET':
          return 'kv-client-secret';
        case 'secrets.fact-kv.SSO_APP_REG_TENANT_ID':
          return 'kv-tenant-id';
        case 'secrets.fact-kv.SESSION_SECRET':
          return 'kv-session-secret';
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    });

    const app = {
      locals: { sessionStore: { storeName: 'session-store' } },
      use: jest.fn(),
    } as unknown as Express;

    new Authentication(jest.fn() as never, logger).enableFor(app);

    const options = mockAuth.mock.calls[0][0];
    expect(options.clientID).toBe('kv-client-id');
    expect(options.clientSecret).toBe('kv-client-secret');
    expect(options.issuerBaseURL).toBe('https://login.microsoftonline.com/kv-tenant-id/v2.0');
    expect(options.secret).toBe('kv-session-secret');
    expect(options.session.store).toBe(app.locals.sessionStore);

    process.env.SSO_APP_REG_ID = originalEnv.SSO_APP_REG_ID;
    process.env.SSO_APP_REG_SECRET = originalEnv.SSO_APP_REG_SECRET;
    process.env.SSO_APP_REG_TENANT_ID = originalEnv.SSO_APP_REG_TENANT_ID;
    process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
  });

  test('stores the provisioned user and logs a successful callback', async () => {
    const factUser = {
      email: 'admin@example.com',
      id: '11111111-1111-4111-8111-111111111111',
      lastLogin: '2026-08-18T10:00:00Z',
      role: 'Admin',
      ssoId: '22222222-2222-4222-8222-222222222222',
    };
    const createUpdateUser = jest.fn().mockResolvedValue(factUser);
    const afterCallback = enableAuthentication(createUpdateUser);
    const session: CallbackSession = {};

    await expect(afterCallback(ssoRequest(['Admin']), {}, session)).resolves.toBe(session);

    expect(createUpdateUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      role: 'Admin',
      ssoId: '22222222-2222-4222-8222-222222222222',
    });
    expect(session.factUser).toBe(factUser);
    expect(logger.infoEvent).toHaveBeenCalledWith('authentication.callback.succeeded', { role: 'Admin' });
  });

  test('rejects a User API status instead of storing it as the authenticated user', async () => {
    const afterCallback = enableAuthentication(jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable));
    const session: CallbackSession = {};

    await expect(afterCallback(ssoRequest(['Admin']), {}, session)).rejects.toThrow(
      'User API did not create or update the authenticated user'
    );

    expect(session.factUser).toBeUndefined();
    expect(logger.errorEvent).toHaveBeenCalledWith(
      'authentication.callback.failed',
      {
        userApiStatusCode: HttpStatusCode.ServiceUnavailable,
        errorName: 'Error',
        stage: 'provision_user',
      },
      expect.any(Error)
    );
  });

  test('logs the callback stage when the SSO user is missing', async () => {
    const createUpdateUser = jest.fn();
    const afterCallback = enableAuthentication(createUpdateUser);

    await expect(afterCallback({ oidc: {} }, {}, {})).rejects.toThrow('Unable to determine SSO user from request');

    expect(createUpdateUser).not.toHaveBeenCalled();
    expect(logger.errorEvent).toHaveBeenCalledWith(
      'authentication.callback.failed',
      {
        userApiStatusCode: undefined,
        errorName: 'Error',
        stage: 'resolve_sso_user',
      },
      expect.any(Error)
    );
  });

  test('propagates non-Error callback failures and records UnknownError telemetry', async () => {
    const createUpdateUser = jest.fn().mockRejectedValue({ reason: 'temporary outage' });
    const afterCallback = enableAuthentication(createUpdateUser);

    await expect(afterCallback(ssoRequest(['Admin']), {}, {})).rejects.toEqual({ reason: 'temporary outage' });

    expect(logger.errorEvent).toHaveBeenCalledWith(
      'authentication.callback.failed',
      {
        userApiStatusCode: undefined,
        errorName: 'UnknownError',
        stage: 'provision_user',
      },
      { reason: 'temporary outage' }
    );
  });

  test('logs resolve_role failures and does not attempt provisioning', async () => {
    const createUpdateUser = jest.fn();
    const afterCallback = enableAuthentication(createUpdateUser);

    await expect(afterCallback(ssoRequest(['Unknown']), {}, {})).rejects.toThrow('Unable to determine user role');

    expect(createUpdateUser).not.toHaveBeenCalled();
    expect(logger.errorEvent).toHaveBeenCalledWith(
      'authentication.callback.failed',
      {
        userApiStatusCode: undefined,
        errorName: 'Error',
        stage: 'resolve_role',
      },
      expect.any(Error)
    );
  });

  test('uses default logger and reuses cached UserApi across callbacks', async () => {
    const defaultLogger = {
      errorEvent: jest.fn(),
      infoEvent: jest.fn(),
    };
    const getLoggerSpy = jest.spyOn(Logger, 'getLogger').mockReturnValue(defaultLogger as never);

    const firstUser = {
      email: 'admin@example.com',
      id: '11111111-1111-4111-8111-111111111111',
      role: 'Admin',
      ssoId: '22222222-2222-4222-8222-222222222222',
    };
    const secondUser = {
      email: 'viewer@example.com',
      id: '33333333-3333-4333-8333-333333333333',
      role: 'Viewer',
      ssoId: '44444444-4444-4444-8444-444444444444',
    };

    const createUpdateUser = jest.fn().mockResolvedValueOnce(firstUser).mockResolvedValueOnce(secondUser);

    (UserApi as unknown as jest.Mock).mockImplementation(() => {
      mockUserApiConstructor();
      return { createUpdateUser };
    });

    const app = {
      locals: { sessionStore: {} },
      use: jest.fn(),
    } as unknown as Express;

    new Authentication().enableFor(app);

    const options = mockAuth.mock.calls[0][0] as { afterCallback: AfterCallback };
    const afterCallback = options.afterCallback;

    const firstSession: CallbackSession = {};
    const secondSession: CallbackSession = {};

    await expect(afterCallback(ssoRequest(['Admin']), {}, firstSession)).resolves.toBe(firstSession);
    await expect(afterCallback(ssoRequest(['Viewer']), {}, secondSession)).resolves.toBe(secondSession);

    expect(getLoggerSpy).toHaveBeenCalledWith('authentication');
    expect(createUpdateUser).toHaveBeenCalledTimes(2);
    expect(UserApi).toHaveBeenCalledTimes(1);
    expect(mockUserApiConstructor).toHaveBeenCalledTimes(1);
  });

  function enableAuthentication(createUpdateUser: jest.Mock): AfterCallback {
    const getDataApi = jest.fn().mockResolvedValue({ createUpdateUser });
    const app = {
      locals: { sessionStore: {} },
      use: jest.fn(),
    } as unknown as Express;

    new Authentication(getDataApi as never, logger).enableFor(app);

    const options = mockAuth.mock.calls[0][0] as { afterCallback: AfterCallback };
    return options.afterCallback;
  }

  function ssoRequest(roles: string[]): CallbackRequest {
    return {
      oidc: {
        user: {
          oid: '22222222-2222-4222-8222-222222222222',
          preferred_username: 'admin@example.com',
          roles,
        },
      },
    };
  }
});
