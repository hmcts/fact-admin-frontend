import { readFile } from 'node:fs/promises';

import { expect, test } from '../../fixtures';
import { createTestCourt, createTestServiceCentre } from '../../helpers/courtTestData';
import { withTestLocationPrefix } from '../../helpers/testSupport';

test.describe(
  'Download CSV Tests',
  {
    tag: '@functional',
  },
  () => {
    test('downloads a CSV containing court and service-centre data', async ({ homePage, playwright }, testInfo) => {
      await withTestLocationPrefix(
        playwright,
        'Download CSV Functional Test',
        async ({ apiContext, courtNamePrefix }) => {
          const courtName = `${courtNamePrefix} Court`;
          const serviceCentreName = `${courtNamePrefix} Service Centre`;
          await createTestCourt(apiContext, {
            courtName,
            open: true,
          });
          await createTestServiceCentre(apiContext, {
            serviceCentreName,
            open: true,
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
          expect(csv).toContain(serviceCentreName);
        }
      );
    });
  }
);
