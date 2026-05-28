import config from 'config';
import * as express from 'express';
import { auth } from 'express-openid-connect';

import { FRONTEND_URL } from '../../envUrls';
import { DataApiRequests } from '../../requests/DataApiRequests';

const clientId = process.env.SSO_APP_REG_ID ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_ID');
const clientSecret = process.env.SSO_APP_REG_SECRET ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_SECRET');
const tenantId = process.env.SSO_APP_REG_TENANT_ID ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_TENANT_ID');

const sessionSecret = (process.env.SESSION_SECRET ?? config.get('secrets.fact-kv.SESSION_SECRET')) as string;
const dataApiRequests = new DataApiRequests();

export class Authentication {
  public enableFor(app: express.Express): void {
    app.use(
      auth({
        issuerBaseURL: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        baseURL: FRONTEND_URL,
        clientID: clientId,
        session: {
          rollingDuration: 1 * 60 * 60,
          absoluteDuration: 8 * 60 * 60,
          store: app.locals.sessionStore,
        },
        clientSecret,
        clientAuthMethod: 'client_secret_post',
        secret: sessionSecret,
        authRequired: false,
        authorizationParams: {
          scope: 'openid profile email',
        },
        routes: {
          login: '/sso/login',
          logout: '/sso/logout',
          callback: '/sso/return',
          postLogoutRedirect: '/',
        },
        afterCallback: async (_req, _res, session) => {
          const user = _req.oidc.user;

          if (!user) {
            throw new Error('Unable to determine SSO user from request');
          }

          const roles = Array.isArray(user.roles) ? user.roles : [];

          if (!roles.includes('Admin') && !roles.includes('SuperAdmin')) {
            throw new Error('Unable to determine user role');
          }

          session.factUser = await dataApiRequests.createUpdateUser({
            email: user.preferred_username,
            ssoId: user.oid,
            role: roles.includes('SuperAdmin') ? 'SuperAdmin' : 'Admin',
          });

          return session;
        },
      })
    );
  }
}
