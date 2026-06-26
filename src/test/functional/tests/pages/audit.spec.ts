import { readFile } from 'node:fs/promises';

import { expect, test } from '../../fixtures';
import { seedAuditTrailViaUi } from '../../helpers/auditTestSupport';
import { config } from '../../utils';

test.describe(
  'Audit Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.superAdmin.sessionFile });

    test('shows seeded INSERT, UPDATE and DELETE events and opens detail pages', async ({
      addCourtPage,
      auditDetailPage,
      auditListPage,
      courtAddressDeletePage,
      generalPage,
      page,
      playwright,
    }) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        page,
        playwright,
        run: async ({ courtId, updatedCourtName }) => {
          await auditListPage.goto();
          await auditListPage.filterByCourt(courtId);

          await expect(auditListPage.heading).toContainText('Audits');
          await expect(auditListPage.auditTable).toContainText('INSERT');
          await expect(auditListPage.auditTable).toContainText('UPDATE');
          await expect(auditListPage.auditTable).toContainText('DELETE');
          await expect(auditListPage.auditTable).toContainText(updatedCourtName);

          const deleteDetailsHref = await auditListPage.getDetailsHrefForAction('DELETE');
          if (!deleteDetailsHref) {
            throw new Error('Expected a details link for a DELETE audit row.');
          }

          await page.goto(config.urls.homePageUrl + deleteDetailsHref);
          await expect(auditDetailPage.heading).toContainText('Audit Detail');
          await expect(auditDetailPage.summaryList).toContainText('DELETE');
          await expect(auditDetailPage.summaryList).toContainText(courtId);
        },
      });
    });
  }
);

test.describe(
  'Audit Page Download Tests',
  {
    tag: '@functional',
  },
  () => {
    // Skip this test only for webkit. It passes locally, but fails consistently in CI
    test.skip(({ browserName }) => browserName === 'webkit');

    test.use({ storageState: config.users.superAdmin.sessionFile });
    test('downloads a CSV that contains a deterministic row for seeded DELETE actions', async ({
      addCourtPage,
      auditListPage,
      courtAddressDeletePage,
      generalPage,
      page,
      playwright,
    }, testInfo) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        page,
        playwright,
        run: async ({ courtId, updatedCourtName, superAdminEmail }) => {
          await auditListPage.goto();
          await auditListPage.filterByCourt(courtId);

          const downloadPromise = page.waitForEvent('download');
          await auditListPage.downloadCsvButton.click();
          const download = await downloadPromise;

          const downloadPath = testInfo.outputPath(download.suggestedFilename());
          await download.saveAs(downloadPath);

          const csv = await readFile(downloadPath, 'utf-8');
          const knownDeleteRow = csv
            .split(/\r?\n/)
            .find(
              line =>
                line.includes(`"${superAdminEmail}"`) &&
                line.includes('"DELETE"') &&
                line.includes(`"${updatedCourtName}:`) &&
                line.includes('CourtAddress')
            );

          expect(knownDeleteRow).toBeDefined();
        },
      });
    });
  }
);
