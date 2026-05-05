import { readFile } from 'node:fs/promises';

import { APIRequestContext } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { type CreatedCourt, createTestCourt, getTestingSupportRegions } from '../../helpers/courtTestData';
import { generateRandomSuffix, withTestCourtPrefix } from '../../helpers/testSupport';

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

function getExpectedCsvFilename(today = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/London',
    year: 'numeric',
  }).formatToParts(today);
  const day = parts.find(part => part.type === 'day')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const year = parts.find(part => part.type === 'year')?.value;

  return `courts-${year}-${month}-${day}.csv`;
}

async function createOpenTestCourts(apiContext: APIRequestContext, courtNames: string[]): Promise<CreatedCourt[]> {
  const createdCourts: CreatedCourt[] = [];

  for (const courtName of courtNames) {
    createdCourts.push(
      await createTestCourt(apiContext, {
        courtName,
        open: true,
        serviceCenter: false,
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
        await expect(homePage.heading).toContainText('Courts and tribunals');
      }
    );

    test('visibility test', async ({ homePage }) => {
      await homePage.expectVisibleElements();
      await expect(homePage.heading).toContainText('Courts and tribunals');
      await homePage.header.expectNavigationLink('Courts');
      await homePage.header.expectNavigationLink('Download csv');
      await homePage.header.expectNavigationLink('Add new court');
      await homePage.header.expectNavigationLink('Audit');
      await homePage.header.expectNavigationLink('Users');
      await expect(homePage.regionSelect).toBeVisible();
    });

    test('filters courts by name and only shows closed courts when requested', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const openCourtName = `${courtNamePrefix} Open`;
        const closedCourtName = `${courtNamePrefix} Closed`;

        await createTestCourt(apiContext, {
          courtName: openCourtName,
          open: true,
          serviceCenter: false,
        });
        await createTestCourt(apiContext, {
          courtName: closedCourtName,
          open: false,
          serviceCenter: false,
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

      await expect(homePage.resultsMessage).toContainText('No courts found.');
      await expect(homePage.noResultsMessage).toBeVisible();
    });

    test('clear filters resets the form and returns to the homepage URL', async ({ homePage }) => {
      await homePage.searchForCourt(`Clear Filters Test ${generateRandomSuffix()}`, true);
      await homePage.clickClearFilters();

      await expect(homePage.page).toHaveURL(/\/$/);
      await expect(homePage.partialCourtNameInput).toHaveValue('');
      await expect(homePage.includeClosedCheckbox).not.toBeChecked();
    });

    test('shows the status column only when include closed is selected', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        await createTestCourt(apiContext, {
          courtName: `${courtNamePrefix} Open`,
          open: true,
          serviceCenter: false,
        });
        await createTestCourt(apiContext, {
          courtName: `${courtNamePrefix} Closed`,
          open: false,
          serviceCenter: false,
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
          serviceCenter: false,
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
          serviceCenter: false,
        });

        await homePage.searchForCourt(courtName);
        await homePage.expectCourtVisible(courtName);

        await expect(homePage.getViewHrefForCourt(courtName)).resolves.toMatch(
          new RegExp(`/courts/${createdCourt.slug}$`)
        );
      });
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
          serviceCenter: false,
        });
        await createTestCourt(apiContext, {
          courtName: secondRegionCourtName,
          open: true,
          regionId: secondRegion.id,
          serviceCenter: false,
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

    test('downloads a csv file containing the filtered test courts', async ({ homePage, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const firstCourtName = `${courtNamePrefix} Download Alpha`;
        const secondCourtName = `${courtNamePrefix} Download Beta`;
        const [firstCourt, secondCourt] = await createOpenTestCourts(apiContext, [firstCourtName, secondCourtName]);

        const [download] = await Promise.all([
          homePage.page.waitForEvent('download'),
          homePage.downloadNavigationLink.click(),
        ]);
        const downloadPath = await download.path();

        expect(download.suggestedFilename()).toBe(getExpectedCsvFilename());
        expect(downloadPath).toBeTruthy();

        const csvContents = await readFile(downloadPath as string, 'utf-8');

        expect(csvContents).toContain(firstCourtName);
        expect(csvContents).toContain(secondCourtName);
        expect(csvContents).toContain('Name,Open/Closed,Updated date');
        expect(csvContents).toContain('Open');
        expect(csvContents).toContain(`/courts/${firstCourt.slug}`);
        expect(csvContents).toContain(`/courts/${secondCourt.slug}`);
      });
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
        await expect(homePage.getCourtNames()).resolves.toEqual([alphaCourtName, bravoCourtName, charlieCourtName]);

        await homePage.clickSortByName();
        await expect(homePage.page).toHaveURL(/sortBy=name&sortOrder=desc/);
        await expect(homePage.getCourtNames()).resolves.toEqual([charlieCourtName, bravoCourtName, alphaCourtName]);
      });
    });

    test('sorts courts by last updated in ascending and descending order', async ({ homePage, page, playwright }) => {
      await withTestCourtPrefix(playwright, 'Home Functional Test', async ({ apiContext, courtNamePrefix }) => {
        const olderCourtName = `${courtNamePrefix} Older`;
        const newerCourtName = `${courtNamePrefix} Newer`;
        await createTestCourt(apiContext, {
          courtName: olderCourtName,
          open: true,
          serviceCenter: false,
        });
        await page.waitForTimeout(1100);
        await createTestCourt(apiContext, {
          courtName: newerCourtName,
          open: true,
          serviceCenter: false,
        });

        await homePage.searchForCourt(courtNamePrefix);
        await homePage.clickSortByLastUpdated();
        await expect(homePage.page).toHaveURL(/sortBy=lastUpdated&sortOrder=asc/);
        await expect(homePage.getCourtNames()).resolves.toEqual([olderCourtName, newerCourtName]);

        await homePage.clickSortByLastUpdated();
        await expect(homePage.page).toHaveURL(/sortBy=lastUpdated&sortOrder=desc/);
        await expect(homePage.getCourtNames()).resolves.toEqual([newerCourtName, olderCourtName]);
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
          serviceCenter: false,
        });
        await createTestCourt(apiContext, {
          courtName: closedCourtName,
          open: false,
          serviceCenter: false,
        });

        await homePage.page.goto(
          `${homePage.page.url().replace(/\/$/, '')}/?partialCourtName=${encodeURIComponent(courtNamePrefix)}&includeClosed=true&sortBy=name&sortOrder=asc`
        );

        await expect(homePage.partialCourtNameInput).toHaveValue(courtNamePrefix);
        await expect(homePage.includeClosedCheckbox).toBeChecked();
        await expect(homePage.page).toHaveURL(/sortBy=name&sortOrder=asc/);
        await expect(homePage.tableHeaders.nth(0)).toHaveAttribute('aria-sort', 'ascending');
        await expect(homePage.getCourtNames()).resolves.toEqual([openCourtName, closedCourtName]);
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
