process.env.ALLOW_CONFIG_MUTATIONS = 'true';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';

jest.mock('redis', () => ({
  createClient: () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Lock acquisition is covered by the LockingInterceptor unit tests. Route tests
// isolate controller behavior and must not make live lock API calls.
jest.mock('../../main/modules/locking', () => ({
  LockingInterceptor: class {
    public enableFor(): void {}
  },
}));

jest.mock('express-openid-connect', () => ({
  auth: () => (req, res, next) => {
    const unauthenticated = req.headers['x-test-unauthenticated'] === 'true';
    const role = req.headers['x-test-role'] ?? 'Admin';

    req.oidc = {
      isAuthenticated: () => !unauthenticated,
    };
    req.appSession = unauthenticated
      ? {}
      : {
          factUser: {
            id: 'test-user-id',
            role,
          },
        };
    res.oidc = {
      login: () => res.redirect('/sso/login'),
    };

    next();
  },
  requiresAuth:
    () =>
    (req, res, next): void => {
      if (!req.oidc?.isAuthenticated()) {
        res.oidc.login();
        return;
      }

      next();
    },
}));
