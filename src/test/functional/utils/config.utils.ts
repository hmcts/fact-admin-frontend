import path from 'node:path';

import { ConfigUtils } from '@hmcts/playwright-common';
import dotenv from 'dotenv';

// This needs to be placed somewhere before attempting to access any environment variables
dotenv.config({ quiet: true });

// TODO: While the admin frontend doesn't talk to the api using a specific set of user credentials,
//       once SSO is in place we will need to perform user authentication as part of the functional
//       test process. The ssoID is just a placeholder - we'll likley just need credentials to allow
//       us to perform the sso login.
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
