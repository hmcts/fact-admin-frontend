import { Locator, Page, expect } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class UsersPage extends Base {
  public readonly applyFiltersButton: Locator;
  public readonly clearFiltersButton: Locator;
  public readonly paginationNextLink: Locator;
  public readonly resultsMessage: Locator;
  public readonly searchInput: Locator;
  public readonly table: Locator;
  public readonly tableHeaders: Locator;
  public readonly tableRows: Locator;

  constructor(page: Page) {
    super(page);
    this.applyFiltersButton = this.page.getByRole('button', { name: 'Apply filters' });
    this.clearFiltersButton = this.page.getByRole('button', { name: 'Clear filters' });
    this.paginationNextLink = this.page.getByRole('link', { name: 'Next' });
    this.resultsMessage = this.page.locator('#main-content .govuk-body').first();
    this.searchInput = this.page.getByLabel('Search by email or SSO ID');
    this.table = this.page.locator('table.homepage-courts-table');
    this.tableHeaders = this.page.locator('table.homepage-courts-table thead th');
    this.tableRows = this.page.locator('table.homepage-courts-table tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + '/users');
  }

  async gotoWithQuery(query: string): Promise<void> {
    await this.page.goto(`${config.urls.homePageUrl}/users?${query}`);
  }

  async search(searchText: string): Promise<void> {
    await this.searchInput.fill(searchText);
    await this.applyFiltersButton.click();
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
  }

  async clickSortByLastLogin(): Promise<void> {
    await this.tableHeaders.getByRole('link', { name: /Last login/ }).click();
  }

  async expectTableHeadings(): Promise<void> {
    await expect(this.tableHeaders).toContainText(['Email', 'SSO ID', 'Last login', 'Role']);
  }

  async expectUserVisible(email: string): Promise<void> {
    await expect(this.table.getByRole('cell', { exact: true, name: email })).toBeVisible();
  }

  async expectSsoIdVisible(ssoId: string): Promise<void> {
    await expect(this.table.getByRole('cell', { exact: true, name: ssoId })).toBeVisible();
  }

  async getFirstRowSsoId(): Promise<string> {
    const ssoIdCell = this.tableRows.first().locator('td').nth(1);
    await expect(ssoIdCell).toBeVisible();
    return ((await ssoIdCell.textContent()) ?? '').trim();
  }
}
