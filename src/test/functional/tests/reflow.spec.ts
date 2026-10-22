import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { withCreatedCourt, withCreatedServiceCentre } from '../helpers/testSupport';
import { config } from '../utils';

// WCAG 1.4.10 Reflow: 320 CSS px is equivalent to 1280px at 400% zoom.
const REFLOW_VIEWPORT = { width: 320, height: 256 };

async function expectNoPageHorizontalScroll(page: Page, path: string): Promise<void> {
  await page.goto(config.urls.homePageUrl + path);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `${path} should not scroll horizontally`).toBeLessThanOrEqual(clientWidth);

  const tableRegions = page.locator('.app-table-scroll');
  for (const region of await tableRegions.all()) {
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region).toHaveAttribute('aria-label', /.+/);
  }
}

test.describe(
  'Reflow',
  {
    tag: '@a11y',
  },
  () => {
    test.use({ storageState: config.users.superAdmin.sessionFile, viewport: REFLOW_VIEWPORT });

    for (const path of ['/', '/approvals', '/audits', '/users']) {
      test(`${path} does not scroll horizontally at 320px`, async ({ page }) => {
        await expectNoPageHorizontalScroll(page, path);
      });
    }

    test('court edit pages with tables do not scroll horizontally at 320px', async ({ page, playwright }) => {
      await withCreatedCourt(playwright, 'Reflow Test', {}, async ({ createdCourt }) => {
        for (const section of [
          '',
          '/address',
          '/contact-details',
          '/court-opening-hours',
          '/counter-service-opening-hours',
        ]) {
          await expectNoPageHorizontalScroll(page, `/courts/${createdCourt.id}/edit${section}`);
        }
      });
    });

    test('service centre edit pages with tables do not scroll horizontally at 320px', async ({ page, playwright }) => {
      await withCreatedServiceCentre(playwright, 'Reflow Test', {}, async ({ createdServiceCentre }) => {
        for (const section of ['', '/address', '/contact-details']) {
          await expectNoPageHorizontalScroll(page, `/service-centres/${createdServiceCentre.id}/edit${section}`);
        }
      });
    });
  }
);
