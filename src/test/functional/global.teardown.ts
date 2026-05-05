import { request } from '@playwright/test';

import { createTestingSupportApiContext, deleteTestCourtsByNamePrefix } from './helpers/courtTestData';
import { TEST_COURT_PREFIX } from './helpers/testSupport';

async function globalTeardown(): Promise<void> {
  const apiContext = await createTestingSupportApiContext(request);

  try {
    await deleteTestCourtsByNamePrefix(apiContext, TEST_COURT_PREFIX);
  } catch {
    // Ignore teardown cleanup failures so they do not mask the real test outcome.
  } finally {
    await apiContext.dispose();
  }
}

export default globalTeardown;
