import { HttpStatusCode } from 'axios';
import type { Express } from 'express';

const mockAuth = jest.fn();

jest.mock('express-openid-connect', () => ({
  auth: mockAuth,
}));

import { Authentication } from '../../../../main/modules/authentication';
import { resolveFactUserRole } from '../../../../main/modules/authentication/roleResolver';

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

  test('rejects a Data API status instead of storing it as the authenticated user', async () => {
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
        dataApiStatusCode: undefined,
        errorName: 'Error',
        stage: 'resolve_sso_user',
      },
      expect.any(Error)
    );
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
