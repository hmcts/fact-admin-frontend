import { ChainedTokenCredential, EnvironmentCredential, WorkloadIdentityCredential } from '@azure/identity';
import { Logger } from '@hmcts/nodejs-logging';
import { Mutex } from 'async-mutex';
import axios, { InternalAxiosRequestConfig } from 'axios';
import config from 'config';

const tokenMutex = new Mutex();

const OPEN_URLS = new Set<string>(['/health']);

const clientAppRegId: string = config.get('secrets.fact-kv.FRONTEND_APP_REG_ID');
const apiAppRegId: string = config.get('secrets.fact-kv.API_APP_REG_ID');
const federatedTokenPath: string = config.get('auth.azure-identity-token-path');

const logger = Logger.getLogger('server');

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = axios.create({
  baseURL: dataApiUrl,
  timeout: 20000,
});

let cachedTokenRefreshTS: number = 0;
let cachedToken: string | null = null;

let authDetailsLogged = false;

function logAuthDetails() {
  if (!authDetailsLogged) {
    authDetailsLogged = true;
    logger.info(`AUTH: using api app reg id ending: ${apiAppRegId.slice(-4)}`);

    logger.info(`AUTH: using client app reg id ending: ${clientAppRegId.slice(-4)}`);
    logger.info(`AUTH: using azure-identity-token path: ${federatedTokenPath}`);

    logger.info(`AUTH: env.AZURE_TENANT_ID (ending): ${process.env.AZURE_TENANT_ID?.slice(-4)}`);
    logger.info(`AUTH: env.AZURE_CLIENT_ID (ending): ${process.env.AZURE_CLIENT_ID?.slice(-4)}`);
    if (process.env.AZURE_CLIENT_SECRET) {
      logger.info('AUTH: env.AZURE_CLIENT_SECRET is set');
    } else {
      logger.info('AUTH: env.AZURE_CLIENT_SECRET is NOT set');
    }
    logger.info(`AUTH: env.AZURE_FEDERATED_TOKEN_FILE: ${process.env.AZURE_FEDERATED_TOKEN_FILE}`);
  }
}

function getToken(): Promise<string> {
  return tokenMutex.runExclusive(async () => {
    if (!cachedToken || Date.now() > cachedTokenRefreshTS) {
      logAuthDetails();

      const cred = new ChainedTokenCredential(
        new WorkloadIdentityCredential({
          clientId: clientAppRegId,
          tokenFilePath: federatedTokenPath,
        }),
        new EnvironmentCredential()
      );

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

      logger.info('Bearer token created or refreshed');
    }
    return cachedToken;
  });
}

export async function processRequest(cfg: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const url = cfg.url ?? '';
  // don't add a bearer token for open paths
  if (!OPEN_URLS.has(url)) {
    const token = await getToken();
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
}

dataApi.interceptors.request.use(async cfg => {
  return processRequest(cfg);
});
