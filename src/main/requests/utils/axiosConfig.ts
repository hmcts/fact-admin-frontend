import { ClientSecretCredential } from '@azure/identity';
import { Mutex } from 'async-mutex';
import { InternalAxiosRequestConfig, create } from 'axios';
import config from 'config';

import { dataApiRequestContext, runWithDataApiUserId } from './dataApiRequestContext';

const tokenMutex = new Mutex();

const OPEN_URLS = new Set<string>(['/health']);
const USER_ID_HEADER = 'X-User-Id';
const USER_ID_EXCLUDED_ENDPOINTS = new Set<string>(['POST /user/v1']);

const apiAppRegId: string = config.get('secrets.fact-kv.API_APP_REG_ID');
const clientAppRegId: string = config.get('secrets.fact-kv.FRONTEND_APP_REG_ID');
const clientSecret: string = config.get('secrets.fact-kv.FRONTEND_APP_REG_SECRET');
const tenantId: string = process.env.AZURE_TENANT_ID || '';

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = create({
  baseURL: dataApiUrl,
  timeout: 20000,
});

let cachedTokenRefreshTS: number = 0;
let cachedToken: string | null = null;

export { runWithDataApiUserId };

function getToken(): Promise<string> {
  return tokenMutex.runExclusive(async () => {
    if (!cachedToken || Date.now() > cachedTokenRefreshTS) {
      const cred = new ClientSecretCredential(tenantId, clientAppRegId, clientSecret);

      const at = await cred.getToken(`api://${apiAppRegId}/.default`);

      // if a refresh TS has been specified, use it, otherwise
      // set it to midway between now and the expiry
      if (at.refreshAfterTimestamp) {
        cachedTokenRefreshTS = at.refreshAfterTimestamp;
      } else {
        const lifeSpan = at.expiresOnTimestamp - Date.now();
        cachedTokenRefreshTS = Date.now() + lifeSpan / 2;
      }
      cachedToken = at.token;
    }
    return cachedToken;
  });
}

export async function processRequest(cfg: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const url = cfg.url ?? '';
  cfg.headers = cfg.headers ?? {};

  const userId = dataApiRequestContext.getStore()?.userId;
  if (userId && shouldAddUserIdHeader(cfg)) {
    cfg.headers[USER_ID_HEADER] = userId;
  }

  // don't add a bearer token for open paths
  if (!OPEN_URLS.has(url)) {
    const token = await getToken();
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
}

function shouldAddUserIdHeader(cfg: InternalAxiosRequestConfig): boolean {
  return !USER_ID_EXCLUDED_ENDPOINTS.has(`${(cfg.method ?? 'get').toUpperCase()} ${getUrlPathname(cfg.url ?? '')}`);
}

function getUrlPathname(url: string): string {
  try {
    return new URL(url, dataApiUrl).pathname.replace(/\/$/, '') || '/';
  } catch {
    return url.split('?')[0].replace(/\/$/, '') || '/';
  }
}

dataApi.interceptors.request.use(async cfg => {
  return processRequest(cfg);
});
