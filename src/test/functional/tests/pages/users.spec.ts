import { expect, test } from '../../fixtures';
import { generateRandomSuffix } from '../../helpers/testSupport';
import { config } from '../../utils';

test.describe(
  'Users Page Tests',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.superAdmin.sessionFile });

    test('shows users page chrome, search, and table headings', async ({ usersPage }) => {
      await usersPage.goto();

      await usersPage.expectVisibleElements();
      await expect(usersPage.heading).toContainText('Users');
      await usersPage.header.expectNavigationLink('Users');
      await expect(usersPage.searchInput).toBeVisible();
      await expect(usersPage.table).toBeVisible();
      await usersPage.expectTableHeadings();
    });

    test('searches by email and clears the filter', async ({ usersPage }) => {
      await usersPage.goto();
      await usersPage.search(config.users.superAdmin.email);

      await expect(usersPage.page).toHaveURL(/\/users\?search=/);
      await expect(usersPage.searchInput).toHaveValue(config.users.superAdmin.email);
      await usersPage.expectUserVisible(config.users.superAdmin.email);

      await usersPage.clearFilters();

      await expect(usersPage.page).toHaveURL(/\/users$/);
      await expect(usersPage.searchInput).toHaveValue('');
      await expect(usersPage.table).toBeVisible();
    });

    test('shows a no results state when no users match the filter', async ({ usersPage }) => {
      const searchText = `no-user-${generateRandomSuffix()}`;

      await usersPage.goto();
      await usersPage.search(searchText);

      await expect(usersPage.page).toHaveURL(/\/users\?search=/);
      await expect(usersPage.searchInput).toHaveValue(searchText);
      await expect(usersPage.resultsMessage).toContainText('No users found.');
      await expect(usersPage.mainContent.content).toContainText('No users match the current filters.');
    });

    test('shows a validation error when search contains unsupported characters', async ({ usersPage }) => {
      await usersPage.goto();
      await usersPage.search('invalid#search');

      await expect(usersPage.mainContent.content).toContainText('There is a problem');
      await expect(usersPage.mainContent.content).toContainText(
        'Search must only include letters, numbers, @ symbols, dots, underscores, plus signs and hyphens.'
      );
      await expect(usersPage.searchInput).toHaveValue('invalid#search');
    });

    test('searches by SSO ID', async ({ usersPage }) => {
      await usersPage.goto();

      const rowCount = await usersPage.tableRows.count();
      test.skip(rowCount === 0, 'Requires at least one user row to verify SSO ID search.');

      const ssoId = await usersPage.getFirstRowSsoId();
      expect(ssoId).not.toBe('');

      await usersPage.search(ssoId);

      await expect(usersPage.page).toHaveURL(/\/users\?search=/);
      await expect(usersPage.searchInput).toHaveValue(ssoId);
      await usersPage.expectSsoIdVisible(ssoId);
    });

    test('orders by last login using API query params', async ({ usersPage }) => {
      await usersPage.goto();

      await usersPage.clickSortByLastLogin();
      await expect(usersPage.page).toHaveURL(/sortBy=lastLogin/);
      await expect(usersPage.page).toHaveURL(/sortOrder=asc/);
      await expect(usersPage.tableHeaders.getByRole('link', { name: /Last login/ })).toHaveAttribute(
        'href',
        /sortOrder=desc/
      );
      await expect(usersPage.tableHeaders.filter({ hasText: 'Last login' })).toHaveAttribute('aria-sort', 'ascending');

      await usersPage.clickSortByLastLogin();
      await expect(usersPage.page).toHaveURL(/sortBy=lastLogin/);
      await expect(usersPage.page).toHaveURL(/sortOrder=desc/);
      await expect(usersPage.tableHeaders.filter({ hasText: 'Last login' })).toHaveAttribute('aria-sort', 'descending');
    });

    test('clear filters resets search and sort state', async ({ usersPage }) => {
      await usersPage.goto();
      await usersPage.search(config.users.superAdmin.email);
      await usersPage.clickSortByLastLogin();

      await expect(usersPage.page).toHaveURL(/search=/);
      await expect(usersPage.page).toHaveURL(/sortBy=lastLogin/);
      await expect(usersPage.page).toHaveURL(/sortOrder=asc/);

      await usersPage.clearFilters();

      await expect(usersPage.page).toHaveURL(/\/users$/);
      await expect(usersPage.searchInput).toHaveValue('');
      await expect(usersPage.tableHeaders.filter({ hasText: 'Last login' })).toHaveAttribute('aria-sort', 'none');
    });

    const invalidQueryCases = [
      { errorText: 'pageSize must be greater than 0', query: 'pageSize=0' },
      { errorText: 'pageNumber must be greater than or equal to 0', query: 'pageNumber=-1' },
      { errorText: 'sortOrder cannot be provided without sortBy', query: 'sortOrder=asc' },
    ];

    for (const { errorText, query } of invalidQueryCases) {
      test(`shows a validation error for invalid query params: ${query}`, async ({ usersPage }) => {
        await usersPage.gotoWithQuery(query);

        await expect(usersPage.mainContent.content).toContainText('There is a problem');
        await expect(usersPage.mainContent.content).toContainText(errorText);
      });
    }
  }
);

test.describe(
  'Users Page Access Control Tests',
  {
    tag: '@functional',
  },
  () => {
    test.use({ storageState: config.users.admin.sessionFile });

    test('denies admin users access to the users page', async ({ usersPage }) => {
      await usersPage.goto();

      await usersPage.expectVisibleElements();
      await expect(usersPage.heading).toContainText('Access Denied');
      await expect(usersPage.mainContent.content).toContainText('You do not have permission to view this page.');
      await expect(usersPage.searchInput).toHaveCount(0);
      await expect(usersPage.table).toHaveCount(0);
    });
  }
);
