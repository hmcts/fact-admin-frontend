import { APIRequestContext } from '@playwright/test';

import { expect, test } from '../../fixtures';
import {
  type CreatedCourt,
  createTestCourt,
  createTestServiceCentre,
  getTestingSupportRegions,
} from '../../helpers/courtTestData';
import {
  generateRandomSuffix,
  withCreatedServiceCentre,
  withTestCourtPrefix,
  withTestLocationPrefix,
} from '../../helpers/testSupport';
import { config } from '../../utils';

function indexToAlphabetSuffix(index: number): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let currentIndex = index;
  let suffix = '';

  do {
    suffix = `${letters[currentIndex % letters.length]}${suffix}`;
    currentIndex = Math.floor(currentIndex / letters.length) - 1;
  } while (currentIndex >= 0);

  return suffix;
}

async function createOpenTestCourts(apiContext: APIRequestContext, courtNames: string[]): Promise<CreatedCourt[]> {
  const createdCourts: CreatedCourt[] = [];

  for (const courtName of courtNames) {
    createdCourts.push(
      await createTestCourt(apiContext, {
        courtName,
        open: true,
      })
    );
  }

  return createdCourts;
}

test.describe(
  'Home Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test(
      'smoke test',
      {
        tag: '@smoke',
      },
      async ({ homePage }) => {
        await expect(homePage.heading).toContainText('Courts, tribunals and service centres');
      }
    );

    test('visibility test', async ({ homePage }) => {
      await homePage.expectVisibleElements();
      await expect(homePage.heading).toContainText('Courts, tribunals and service centres');
      await homePage.header.expectNavigationLink('Locations');
      await homePage.header.expectNavigationLink('Download csv');
      await homePage.header.expectNavigationLink('Add new court');
      await homePage.header.expectNavigationLink('Add new service centre');
      await expect(homePage.regionSelect).toBeVisible();
      await expect(homePage.onlyServiceCentresCheckbox).toBeVisible();
    });

    test.describe('Super admin role navigation', () => {
      test.use({ storageState: config.users.superAdmin.sessionFile });

      test('shows super admin navigation links', async ({ homePage }) => {
        await homePage.expectVisibleElements();
        await homePage.header.expectNavigationLink('Locations');
        await homePage.header.expectNavigationLink('Download csv');
        await homePage.header.expectNavigationLink('Add new court');
        await homePage.header.expectNavigationLink('Add new service centre');
        await homePage.header.expectNavigationLink('Audit');
        await homePage.header.expectNavigationLink('Users');
      });
    });

    test.describe('Admin role navigation', () => {
      test.use({ storageState: config.users.admin.sessionFile });

      test('does not show super admin navigation links', async ({ homePage }) => {
        await homePage.expectVisibleElements();
        await homePage.header.expectNavigationLink('Locations');
        await homePage.header.expectNavigationLink('Download csv');
        await homePage.header.expectNavigationLink('Add new court');
        await homePage.header.expectNavigationLink('Add new service centre');
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Audit' })).toHaveCount(0);
        await expect(homePage.header.navigationLinks.filter({ hasText: 'Users' })).toHaveCount(0);
      });
    });

    test('filters courts by name and only shows closed courts when requested', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const openCourtName = `${courtNamePrefix} Open`;
        const closedCourtName = `${courtNamePrefix} Closed`;

        await createTestCourt(apiContext, {
          courtName: openCourtName,
          open: true,
        });
        await createTestCourt(apiContext, {
          courtName: closedCourtName,
          open: false,
        });

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.expectCourtVisible(openCourtName);
        await homePage.expectCourtHidden(closedCourtName);

        await homePage.searchForCourt(courtNamePrefix, true);
        await homePage.expectCourtVisible(openCourtName);
        await homePage.expectCourtVisible(closedCourtName);
        await expect(homePage.table).toContainText('Open');
        await expect(homePage.table).toContainText('Closed');
      });
    });

    test('shows a no results message when no courts match the filter', async ({ homePage }) => {
      await homePage.searchForCourt(`No Matching Court ${generateRandomSuffix()}`);

      await expect(homePage.resultsMessage).toContainText('No courts, tribunals or service centres found.');
      await expect(homePage.noResultsMessage).toBeVisible();
    });

    test('clear filters resets the form and returns to the homepage URL', async ({ homePage }) => {
      await homePage.searchForCourt(`Clear Filters Test ${generateRandomSuffix()}`, true);
      await homePage.clickClearFilters();

      await expect(homePage.page).toHaveURL(/\/$/);
      await expect(homePage.partialCourtNameInput).toHaveValue('');
      await expect(homePage.includeClosedCheckbox).not.toBeChecked();
      await expect(homePage.onlyServiceCentresCheckbox).not.toBeChecked();
    });

    test('shows the status column only when include closed is selected', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        await createTestCourt(apiContext, {
          courtName: `${courtNamePrefix} Open`,
          open: true,
        });
        await createTestCourt(apiContext, {
          courtName: `${courtNamePrefix} Closed`,
          open: false,
        });

        await homePage.searchForCourt(courtNamePrefix);
        await expect(homePage.statusColumnHeader).toHaveCount(0);

        await homePage.searchForCourt(courtNamePrefix, true);
        await expect(homePage.statusColumnHeader).toBeVisible();
      });
    });

    test('edit action opens the edit page for the selected court', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} Edit`;
        const createdCourt = await createTestCourt(apiContext, {
          courtName,
          open: true,
        });

        await homePage.searchForCourt(courtName);
        await homePage.expectCourtVisible(courtName);
        await homePage.clickEditForCourt(courtName);

        await expect(homePage.heading).toContainText(`Editing - ${createdCourt.name}`);
        await expect(homePage.page).toHaveURL(new RegExp(`/courts/${createdCourt.id}/edit$`));
      });
    });

    test('view action points at the public court details page for the selected court', async ({
      homePage,
      playwright,
    }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const courtName = `${courtNamePrefix} View`;
        const createdCourt = await createTestCourt(apiContext, {
          courtName,
          open: true,
        });

        await homePage.searchForCourt(courtName);
        await homePage.expectCourtVisible(courtName);

        await expect(homePage.getViewHrefForCourt(courtName)).resolves.toMatch(
          new RegExp(`/courts/${createdCourt.slug}$`)
        );
      });
    });

    test('shows service centre rows with public view and edit actions', async ({ homePage, playwright }) => {
      await withCreatedServiceCentre(
        playwright,
        'Home Service Centre Functional Test',
        { open: true },
        async ({ createdServiceCentre }) => {
          await homePage.searchForCourt(createdServiceCentre.name);
          await homePage.expectCourtVisible(createdServiceCentre.name);

          await expect(homePage.getViewHrefForCourt(createdServiceCentre.name)).resolves.toMatch(
            new RegExp(`/service-centres/${createdServiceCentre.slug}$`)
          );

          await homePage.clickEditForCourt(createdServiceCentre.name);

          await expect(homePage.heading).toContainText(`Editing - ${createdServiceCentre.name}`);
          await expect(homePage.page).toHaveURL(new RegExp(`/service-centres/${createdServiceCentre.id}/edit$`));
          await expect(homePage.mainContent.content).toContainText('General');
          await expect(homePage.mainContent.content).toContainText('Warning notice');
          await expect(homePage.mainContent.content).toContainText('Address');
          await expect(homePage.mainContent.content).toContainText('Contact details');
          await expect(homePage.mainContent.content).toContainText('Cases heard');
        }
      );
    });

    test('filters to only service centres', async ({ homePage, playwright }) => {
      await withTestLocationPrefix(
        playwright,
        'Home Service Centre Only Functional Test',
        async ({ apiContext, courtNamePrefix }) => {
          const courtName = `${courtNamePrefix} Court`;
          const serviceCentreName = `${courtNamePrefix} Service Centre`;

          await createTestCourt(apiContext, {
            courtName,
            open: true,
          });
          await createTestServiceCentre(apiContext, {
            open: true,
            serviceCentreName,
          });

          await homePage.searchForCourt(courtNamePrefix);
          await homePage.expectCourtVisible(courtName);
          await homePage.expectCourtVisible(serviceCentreName);

          await homePage.searchForServiceCentresOnly(courtNamePrefix);
          await expect(homePage.page).toHaveURL(/onlyServiceCentres=true/);
          await homePage.expectCourtHidden(courtName);
          await homePage.expectCourtVisible(serviceCentreName);

          await homePage.clickSortByName();
          await expect(homePage.page).toHaveURL(/onlyServiceCentres=true/);
        }
      );
    });

    test('filters courts by region when a region is selected', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const regions = await getTestingSupportRegions(apiContext);
        if (regions.length < 2) {
          throw new Error('Expected at least two regions to run the homepage region filter test.');
        }

        const firstRegion = regions[0];
        const secondRegion = regions[1];
        const firstRegionCourtName = `${courtNamePrefix} ${firstRegion.name} Court`;
        const secondRegionCourtName = `${courtNamePrefix} ${secondRegion.name} Court`;

        await createTestCourt(apiContext, {
          courtName: firstRegionCourtName,
          open: true,
          regionId: firstRegion.id,
        });
        await createTestCourt(apiContext, {
          courtName: secondRegionCourtName,
          open: true,
          regionId: secondRegion.id,
        });

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.expectCourtVisible(firstRegionCourtName);
        await homePage.expectCourtVisible(secondRegionCourtName);

        await homePage.searchForCourtInRegion(courtNamePrefix, firstRegion.id);
        await homePage.expectCourtVisible(firstRegionCourtName);
        await homePage.expectCourtHidden(secondRegionCourtName);
        await expect(homePage.regionSelect).toHaveValue(firstRegion.id);
      });
    });

    test('filters service centres by region when a region is selected', async ({ homePage, playwright }) => {
      await withTestLocationPrefix(
        playwright,
        'Home Service Centre Region Functional Test',
        async ({ apiContext, courtNamePrefix }) => {
          const regions = await getTestingSupportRegions(apiContext);
          if (regions.length < 2) {
            throw new Error('Expected at least two regions to run the homepage service-centre region filter test.');
          }

          const firstRegion = regions[0];
          const secondRegion = regions[1];
          const firstRegionServiceCentreName = `${courtNamePrefix} ${firstRegion.name} Service Centre`;
          const secondRegionServiceCentreName = `${courtNamePrefix} ${secondRegion.name} Service Centre`;

          await createTestServiceCentre(apiContext, {
            open: true,
            regionId: firstRegion.id,
            serviceCentreName: firstRegionServiceCentreName,
          });
          await createTestServiceCentre(apiContext, {
            open: true,
            regionId: secondRegion.id,
            serviceCentreName: secondRegionServiceCentreName,
          });

          await homePage.searchForCourt(courtNamePrefix);
          await homePage.expectCourtVisible(firstRegionServiceCentreName);
          await homePage.expectCourtVisible(secondRegionServiceCentreName);

          await homePage.searchForCourtInRegion(courtNamePrefix, firstRegion.id);
          await homePage.expectCourtVisible(firstRegionServiceCentreName);
          await homePage.expectCourtHidden(secondRegionServiceCentreName);
          await expect(homePage.regionSelect).toHaveValue(firstRegion.id);

          await homePage.searchForCourtInRegion(courtNamePrefix, secondRegion.id);
          await homePage.expectCourtHidden(firstRegionServiceCentreName);
          await homePage.expectCourtVisible(secondRegionServiceCentreName);
          await expect(homePage.regionSelect).toHaveValue(secondRegion.id);
        }
      );
    });

    test('shows the default unsorted state before a sort is applied', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const alphaCourtName = `${courtNamePrefix} Alpha`;
        const bravoCourtName = `${courtNamePrefix} Bravo`;
        await createOpenTestCourts(apiContext, [alphaCourtName, bravoCourtName]);

        await homePage.searchForCourt(courtNamePrefix);
        await expect(homePage.page).not.toHaveURL(/sortBy=/);
        await expect(homePage.tableHeaders.nth(0)).toHaveAttribute('aria-sort', 'none');
        await expect(homePage.tableHeaders.nth(1)).toHaveAttribute('aria-sort', 'none');
        await homePage.expectCourtVisible(alphaCourtName);
        await homePage.expectCourtVisible(bravoCourtName);
      });
    });

    test('sorts courts by name in ascending and descending order', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const alphaCourtName = `${courtNamePrefix} Alpha`;
        const bravoCourtName = `${courtNamePrefix} Bravo`;
        const charlieCourtName = `${courtNamePrefix} Charlie`;
        await createOpenTestCourts(apiContext, [charlieCourtName, alphaCourtName, bravoCourtName]);

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.clickSortByName();
        await expect(homePage.page).toHaveURL(/sortBy=name&sortOrder=asc/);
        await expect.poll(() => homePage.getCourtNames()).toEqual([alphaCourtName, bravoCourtName, charlieCourtName]);

        await homePage.clickSortByName();
        await expect(homePage.page).toHaveURL(/sortBy=name&sortOrder=desc/);
        await expect.poll(() => homePage.getCourtNames()).toEqual([charlieCourtName, bravoCourtName, alphaCourtName]);
      });
    });

    test('sorts courts by last updated in ascending and descending order', async ({ homePage, page, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const olderCourtName = `${courtNamePrefix} Older`;
        const newerCourtName = `${courtNamePrefix} Newer`;
        await createTestCourt(apiContext, {
          courtName: olderCourtName,
          open: true,
        });
        await page.waitForTimeout(1100);
        await createTestCourt(apiContext, {
          courtName: newerCourtName,
          open: true,
        });

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.clickSortByLastUpdated();
        await expect(homePage.page).toHaveURL(/sortBy=lastUpdated&sortOrder=asc/);
        await expect.poll(() => homePage.getCourtNames()).toEqual([olderCourtName, newerCourtName]);

        await homePage.clickSortByLastUpdated();
        await expect(homePage.page).toHaveURL(/sortBy=lastUpdated&sortOrder=desc/);
        await expect.poll(() => homePage.getCourtNames()).toEqual([newerCourtName, olderCourtName]);
      });
    });

    test('paginates when more than one page of courts matches the filter', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const courtNames = Array.from(
          { length: 26 },
          (_, index) => `${courtNamePrefix} Page ${indexToAlphabetSuffix(index)}`
        );
        await createOpenTestCourts(apiContext, courtNames);

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.clickSortByName();
        await expect(homePage.paginationNextLink).toBeVisible();
        await homePage.expectCourtVisible(courtNames[0]);
        await homePage.expectCourtHidden(courtNames[25]);

        await homePage.paginationNextLink.click();
        await expect(homePage.page).toHaveURL(/pageNumber=1/);
        await expect(homePage.paginationPreviousLink).toBeVisible();
        await homePage.expectCourtVisible(courtNames[25]);
        await homePage.expectCourtHidden(courtNames[0]);

        await homePage.paginationPreviousLink.click();
        await expect(homePage.page).toHaveURL(/pageNumber=0/);
        await homePage.expectCourtVisible(courtNames[0]);
      });
    });

    test('restores filters and sorting from the query string', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const openCourtName = `${courtNamePrefix} Alpha`;
        const closedCourtName = `${courtNamePrefix} Bravo`;
        await createTestCourt(apiContext, {
          courtName: openCourtName,
          open: true,
        });
        await createTestCourt(apiContext, {
          courtName: closedCourtName,
          open: false,
        });

        await homePage.page.goto(
          `${homePage.page.url().replace(/\/$/, '')}/?partialCourtName=${encodeURIComponent(courtNamePrefix)}&includeClosed=true&sortBy=name&sortOrder=asc`
        );

        await expect(homePage.partialCourtNameInput).toHaveValue(courtNamePrefix);
        await expect(homePage.includeClosedCheckbox).toBeChecked();
        await expect(homePage.page).toHaveURL(/sortBy=name&sortOrder=asc/);
        await expect(homePage.tableHeaders.nth(0)).toHaveAttribute('aria-sort', 'ascending');
        await expect.poll(() => homePage.getCourtNames()).toEqual([openCourtName, closedCourtName]);
      });
    });

    test('shows a validation error when the court name contains unsupported characters', async ({ homePage }) => {
      await homePage.searchForCourt('Invalid#Court');

      await expect(homePage.mainContent.content).toContainText('There is a problem');
      await expect(homePage.mainContent.content).toContainText(
        'Court or tribunal name must only include letters, spaces, brackets, apostrophes, hyphens and ampersands.'
      );
      await expect(homePage.partialCourtNameInput).toHaveValue('Invalid#Court');
    });
  }
);
