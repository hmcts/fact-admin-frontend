import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CasesHeardPage extends Base {
  public readonly backLink: Locator;
  public readonly checkboxes: Locator;
  public readonly errorSummary: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;
  public readonly warningText: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = this.page.locator('.govuk-back-link');
    this.checkboxes = this.page.locator('input[name="areasOfLaw"]');
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.warningText = this.page.locator('.govuk-warning-text');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildCasesHeardUrl(courtId));
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildCasesHeardSuccessUrl(courtId));
  }

  async selectFirstCaseType(): Promise<void> {
    await this.checkboxes.first().check();
  }

  async selectAllCaseTypes(): Promise<void> {
    const checkboxCount = await this.checkboxes.count();

    for (let index = 0; index < checkboxCount; index++) {
      await this.checkboxes.nth(index).check();
    }
  }

  async clearSelectedCaseTypes(): Promise<void> {
    const checkboxCount = await this.checkboxes.count();

    for (let index = 0; index < checkboxCount; index++) {
      const checkbox = this.checkboxes.nth(index);

      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  getCaseTypeCheckbox(index: number): Locator {
    return this.checkboxes.nth(index);
  }

  buildCasesHeardUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/cases-heard`;
  }

  buildCasesHeardSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/cases-heard/success`;
  }
}
