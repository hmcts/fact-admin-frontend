import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class WarningNoticePage extends Base {
  public readonly errorSummary: Locator;
  public readonly warningNoticeInput: Locator;
  public readonly warningNoticeCyInput: Locator;
  public readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.warningNoticeInput = this.page.locator('#warningNotice');
    this.warningNoticeCyInput = this.page.locator('#warningNoticeCy');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildWarningNoticeUrl(courtId));
  }

  async fillWarningNotice(value: string): Promise<void> {
    await this.warningNoticeInput.fill(value);
  }

  async fillWarningNoticeCy(value: string): Promise<void> {
    await this.warningNoticeCyInput.fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  buildWarningNoticeUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/warning-notice`;
  }

  buildWarningNoticeSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/warning-notice/success`;
  }
}
