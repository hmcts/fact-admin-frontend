import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class AuditListPage extends Base {
  public readonly searchButton: Locator;
  public readonly downloadCsvButton: Locator;
  public readonly auditTable: Locator;
  public readonly searchTextInput: Locator;
  public readonly errorSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.searchButton = this.page.getByRole('button', { name: 'Search' });
    this.downloadCsvButton = this.page.getByRole('button', { name: 'Download CSV' });
    this.auditTable = this.page.locator('table.govuk-table');
    this.searchTextInput = this.page.getByLabel('Search text');
    this.errorSummary = this.page.locator('.govuk-error-summary');
  }

  async goto(): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + '/audits');
  }

  async filterByCourt(courtId: string, searchText?: string): Promise<void> {
    await this.page.getByRole('radio', { name: 'Court', exact: true }).check();
    await this.page.locator('#courtId').selectOption(courtId);
    if (searchText) {
      await this.searchTextInput.fill(searchText);
    }
    await this.searchButton.click();
  }

  async getDetailsHrefForAction(actionType: string): Promise<string | null> {
    return this.auditTable
      .locator('tr')
      .filter({ hasText: actionType })
      .getByRole('link', { name: 'Details', exact: true })
      .first()
      .getAttribute('href');
  }

  async searchByText(searchText: string): Promise<void> {
    await this.searchTextInput.fill(searchText);
    await this.searchButton.click();
  }
}
