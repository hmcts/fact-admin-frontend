import { readFile } from 'node:fs/promises';

import { expect, test } from '../../fixtures';
import { createTestCourt } from '../../helpers/courtTestData';
import { withTestCourtPrefix } from '../../helpers/testSupport';

test.describe(
  'Download CSV Tests',
  {
    tag: '@functional',
  },
  () => {
    test('downloads a CSV containing court data', async ({ homePage, playwright }, testInfo) => {
      await withTestCourtPrefix(playwright, 'Download CSV Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} Court`;
        await createTestCourt(apiContext, {
          courtName,
          open: true,
          serviceCenter: false,
        });

        const downloadPromise = homePage.page.waitForEvent('download');
        await homePage.downloadNavigationLink.click();
        const download = await downloadPromise;

        await expect(download.suggestedFilename()).toMatch(/^courts-\d{4}-\d{2}-\d{2}\.csv$/);

        const downloadPath = testInfo.outputPath(download.suggestedFilename());
        await download.saveAs(downloadPath);

        const csv = await readFile(downloadPath, 'utf-8');

        expect(csv).toContain('Name,Open/Closed,Updated date,Addresses,Areas of law,Type');
        expect(csv).toContain(courtName);
      });
    });
  }
);
