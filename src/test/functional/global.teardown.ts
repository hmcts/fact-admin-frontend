import fs from 'node:fs';

import { chromium, request } from '@playwright/test';

import {
  createTestingSupportApiContext,
  deleteTestCourtsByNamePrefix,
  deleteTestServiceCentresByNamePrefix,
} from './helpers/courtTestData';
import { TEST_COURT_PREFIX } from './helpers/testSupport';
import { config } from './utils';

async function globalTeardown(): Promise<void> {
  const apiContext = await createTestingSupportApiContext(request);

  try {
    await deleteTestCourtsByNamePrefix(apiContext, TEST_COURT_PREFIX);
    await deleteTestServiceCentresByNamePrefix(apiContext, TEST_COURT_PREFIX);
  } catch {
    // Ignore teardown cleanup failures so they do not mask the real test outcome.
  } finally {
    await apiContext.dispose();
  }

  if (!config.sessionPersistence.keepSessionFiles) {
    await cleanupSession(config.users.admin.sessionFile);
    await cleanupSession(config.users.superAdmin.sessionFile);
    await cleanupSession(config.users.viewer.sessionFile);
  }
}

async function cleanupSession(sessionFile: string): Promise<void> {
  try {
    if (fs.existsSync(sessionFile)) {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        storageState: sessionFile,
      });
      const page = await context.newPage();

      try {
        await page.goto(config.urls.homePageUrl);
        await page.getByRole('link', { name: /sign out/i }).click({ timeout: 10_000 });
        await page
          .waitForURL(url => !url.href.startsWith(config.urls.homePageUrl), { timeout: 10_000 })
          .catch(() => {});
      } finally {
        await context.close();
        await browser.close();
      }
    }
  } catch {
    // Ignore logout cleanup failures so they do not mask the real test outcome.
  } finally {
    fs.rmSync(sessionFile, { force: true });
  }
}

export default globalTeardown;
