import config from 'config';
import * as express from 'express';
import { auth } from 'express-openid-connect';

import { FRONTEND_URL } from '../../envUrls';
import type { UserApi as UserApiType } from '../../requests/UserApi';
import { Logger } from '../logging';

import { resolveFactUserRole } from './roleResolver';

let userApiInstance: UserApiType | undefined;

type DataApiProvider = () => Promise<UserApiType>;
type AuthenticationLogger = Pick<ReturnType<typeof Logger.getLogger>, 'errorEvent' | 'infoEvent'>;

export class Authentication {
  public constructor(
    private readonly getUserApi: DataApiProvider = getUserDataApi,
    private readonly logger: AuthenticationLogger = Logger.getLogger('authentication')
  ) {}

  public enableFor(app: express.Express): void {
    const clientId = process.env.SSO_APP_REG_ID ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_ID');
    const clientSecret = process.env.SSO_APP_REG_SECRET ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_SECRET');
    const tenantId = process.env.SSO_APP_REG_TENANT_ID ?? config.get<string>('secrets.fact-kv.SSO_APP_REG_TENANT_ID');
    const sessionSecret = (process.env.SESSION_SECRET ?? config.get('secrets.fact-kv.SESSION_SECRET')) as string;

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
        idpLogout: true,
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
          let stage = 'resolve_sso_user';
          let dataApiStatusCode: number | undefined;

          try {
            const user = _req.oidc.user;

            if (!user) {
              throw new Error('Unable to determine SSO user from request');
            }

            stage = 'resolve_role';
            const role = resolveFactUserRole(user.roles);

          stage = 'provision_user';
          const userApi = await this.getUserApi();
            const factUser = await userApi.createUpdateUser({
              email: user.preferred_username,
              ssoId: user.oid,
              role,
            });

            if (typeof factUser === 'number') {
              dataApiStatusCode = factUser;
              throw new Error('Data API did not create or update the authenticated user');
            }

            session.factUser = factUser;
            this.logger.infoEvent('authentication.callback.succeeded', { role });
            return session;
          } catch (error) {
            this.logger.errorEvent(
              'authentication.callback.failed',
              {
                dataApiStatusCode,
                errorName: error instanceof Error ? error.name : 'UnknownError',
                stage,
              },
              error
            );
            throw error;
          }
        },
      })
    );
  }
}

async function getUserDataApi(): Promise<UserApiType> {
  if (!userApiInstance) {
    const { UserApi } = await import('../../requests/UserApi');
    userApiInstance = new UserApi();
  }

  return userApiInstance;
}
