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
