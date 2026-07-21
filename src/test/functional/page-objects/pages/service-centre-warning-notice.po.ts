import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreWarningNoticePage extends Base {
  public readonly warningNoticeInput: Locator;
  public readonly warningNoticeCyInput: Locator;
  public readonly saveButton: Locator;
  public readonly errorSummary: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.warningNoticeInput = this.page.locator('#warningNotice');
    this.warningNoticeCyInput = this.page.locator('#warningNoticeCy');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(serviceCentreId: string): Promise<void> {
    await this.page.goto(this.buildWarningNoticeUrl(serviceCentreId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  buildWarningNoticeUrl(serviceCentreId: string): string {
    return config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/warning-notice`;
  }
}
