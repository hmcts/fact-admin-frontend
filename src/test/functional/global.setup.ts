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
    // Access URLs for Admin pages
    requireEnvVar('ADMIN_URL');

    // User SSO ids
    requireEnvVar('ADMIN_SSO_ID');
    requireEnvVar('SUPER_ADMIN_SSO_ID');
  });
});
