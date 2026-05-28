import path from 'node:path';

import { Logger } from '@hmcts/nodejs-logging';
import { ConfigUtils } from '@hmcts/playwright-common';
import dotenv from 'dotenv';

// This needs to be placed somewhere before attempting to access any environment variables
dotenv.config({ quiet: true });

const logger = Logger.getLogger('functional-tests');

export interface UserDetails {
  email: string;
  password: string;
  sessionFile: string;
}

interface Urls {
  dataApiUrl: string;
  homePageUrl: string;
}

export interface Config {
  users: {
    admin: UserDetails;
    superAdmin: UserDetails;
  };
  urls: Urls;
}

export const config: Config = {
  users: {
    admin: {
      email: getEnvVar('SSO_TEST_ADMIN_EMAIL'),
      password: getEnvVar('SSO_TEST_ADMIN_PASSWORD'),
      sessionFile: path.join(__dirname, '..', '.sessions', 'admin.json'),
    },
    superAdmin: {
      email: getEnvVar('SSO_TEST_SUPER_ADMIN_EMAIL'),
      password: getEnvVar('SSO_TEST_SUPER_ADMIN_PASSWORD'),
      sessionFile: path.join(__dirname, '..', '.sessions', 'super-admin.json'),
    },
  },
  urls: {
    dataApiUrl: getEnvVar('DATA_API_URL', 'http://localhost:8989'),
    homePageUrl: getEnvVar('ADMIN_URL', getEnvVar('TEST_URL', 'https://localhost:3355')),
  },
};

function getEnvVar(name: string, fallback = ''): string {
  const value = process.env[name];
  if (!value) {
    if (fallback) {
      return fallback;
    }
    logger.warn(`Warning: ${name} environment variable is not set; using empty string.`);
    return '';
  }
  return value;
}

export function requireEnvVar(name: string): string {
  const value = ConfigUtils.getEnvVar(name);
  if (!value.trim()) {
    throw new Error(`Missing required environment variable: ${name}. Ensure it is set before running the test suite.`);
  }
  return value;
}
