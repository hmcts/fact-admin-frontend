import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class AuditDetailPage extends Base {
  public readonly summaryList: Locator;
  public readonly changeLogHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.summaryList = this.page.locator('.govuk-summary-list');
    this.changeLogHeading = this.page.getByRole('heading', { name: 'Change Log' });
  }

  async goto(auditId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/audits/${auditId}`);
  }
}
