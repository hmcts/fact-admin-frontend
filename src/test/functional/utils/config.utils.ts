import path from 'node:path';

import { ConfigUtils } from '@hmcts/playwright-common';
import dotenv from 'dotenv';

// This needs to be placed somewhere before attempting to access any environment variables
dotenv.config({ quiet: true });

// TODO: FACT-2582: either continue with this or remove it. While the admin frontend doesn't talk to the api
//       using a specific set of user credentials, it does need to let the API know which user is
//       is logged in, so we may need to persist some user details in the session.
//       Most obvious use-case for this will be auditing within the API
export interface UserDetails {
  ssoId: string;
  // this is used during lighthouse (performance) config
  sessionFile: string;
}

interface Urls {
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
    // TODO: FACT-2582: again, speculation on how users might be required
    admin: {
      ssoId: getEnvVar('ADMIN_SSO_ID'),
      sessionFile: path.join(__dirname + '../../.sessions/') + `${getEnvVar('ADMIN_SSO_ID')}.json`,
    },
    superAdmin: {
      ssoId: getEnvVar('SUPER_ADMIN_SSO_ID'),
      sessionFile: path.join(__dirname + '../../.sessions/') + `${getEnvVar('SUPER_ADMIN_SSO_ID')}.json`,
    },
  },
  urls: {
    homePageUrl: getEnvVar('ADMIN_URL', getEnvVar('TEST_URL', 'https://fact-admin-frontend.aat.platform.hmcts.net')),
  },
};

function getEnvVar(name: string, fallback = ''): string {
  const value = process.env[name];
  if (!value) {
    if (fallback) {
      return fallback;
    }
    console.warn(`Warning: ${name} environment variable is not set; using empty string.`);
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
