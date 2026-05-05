import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtEditPage extends Base {
  public readonly sectionsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.sectionsTable = this.page.locator('table.court-edit-table');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtId}/edit`);
  }

  async getSectionHref(sectionName: string): Promise<string | null> {
    return this.sectionsTable.getByRole('link', { name: sectionName, exact: true }).getAttribute('href');
  }
}
