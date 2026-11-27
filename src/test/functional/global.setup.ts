import { test as setup } from './fixtures';
import { createTestingSupportApiContext } from './helpers/courtTestData';
import { seedTestPostcodes } from './helpers/postcodeTestData';
import { config, createSession, requireEnvVar } from './utils';

/**
 * Seeds postcode references and creates SSO sessions before the browser projects run.
 */
setup.describe('Global playwright setup', () => {
  setup.describe.configure({ mode: 'serial' });

  /**
   * Check for essential environment variables required for the tests to run
   */
  setup.beforeAll('Check environment setup', async () => {
    // Access URLs for Admin pages
    requireEnvVar('TEST_URL');

    requireEnvVar('SSO_TEST_ADMIN_EMAIL');
    requireEnvVar('SSO_TEST_ADMIN_PASSWORD');
    requireEnvVar('SSO_TEST_SUPER_ADMIN_EMAIL');
    requireEnvVar('SSO_TEST_SUPER_ADMIN_PASSWORD');
    requireEnvVar('SSO_TEST_VIEWER_EMAIL');
    requireEnvVar('SSO_TEST_VIEWER_PASSWORD');
  });

  setup('Create admin session', async ({ page }) => {
    await createSession(page, config.users.admin);
  });

  setup('Create super admin session', async ({ page }) => {
    await createSession(page, config.users.superAdmin);
  });

  setup('Create viewer session', async ({ page }) => {
    await createSession(page, config.users.viewer);
  });

  setup('Seed postcode references', async ({ playwright }) => {
    const apiContext = await createTestingSupportApiContext(playwright);

    try {
      await seedTestPostcodes(apiContext);
    } finally {
      await apiContext.dispose();
    }
  });
});
