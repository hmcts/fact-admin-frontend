import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreEditPage extends Base {
  public readonly sectionsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.sectionsTable = this.page.locator('table.court-edit-table');
  }

  async goto(serviceCentreId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit`);
  }

  async getSectionHref(sectionName: string): Promise<string | null> {
    return this.sectionsTable.getByRole('link', { name: sectionName, exact: true }).getAttribute('href');
  }
}

