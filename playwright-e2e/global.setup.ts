import { test as setup } from './fixtures';
import { requireEnvVar } from './utils';

/**
 * Login/Bearer Token creating is handled via Azure libraries within the code.
 * In order to ensure that will function, the global setup will ensure that the correct environment
 * variables are in place to allow that to function successfully.
 */
setup.describe('Global playwright setup', () => {
  /**
   * Check for essential environment variables required for the tests to run
   */
  setup.beforeAll('Check environment setup', async () => {
    // URL for the fact-data-api
    requireEnvVar('DATA_API_URL');

    // Required for Azure authentication to retrieve tokens for API access
    requireEnvVar('AZURE_TENANT_ID');
    requireEnvVar('AZURE_CLIENT_ID');
    requireEnvVar('AZURE_CLIENT_SECRET');
    requireEnvVar('API_APP_REG_ID');

    // Access URLs for Admin pages
    requireEnvVar('ADMIN_URL');
    requireEnvVar('ADMIN_DASHBOARD_URL');

    // User SSO ids
    requireEnvVar('ADMIN_SSO_ID');
    requireEnvVar('SUPER_ADMIN_SSO_ID');
  });
});
