import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class SinglePointsOfEntryPage extends Base {
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildSinglePointsOfEntryUrl(courtId));
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildSinglePointsOfEntrySuccessUrl(courtId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  buildSinglePointsOfEntryUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/single-point-of-entry`;
  }

  buildSinglePointsOfEntrySuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/single-point-of-entry/success`;
  }

  singlePointOfEntryCheckbox(name: string): Locator {
    return this.page.getByRole('checkbox', { name });
  }
}
