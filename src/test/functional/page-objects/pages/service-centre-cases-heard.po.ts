import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreCasesHeardPage extends Base {
  public readonly checkboxes: Locator;
  public readonly errorSummary: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.checkboxes = this.page.locator('input[name="areasOfLaw"]');
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(serviceCentreId: string): Promise<void> {
    await this.page.goto(this.buildCasesHeardUrl(serviceCentreId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async selectFirstCaseType(): Promise<void> {
    await this.checkboxes.first().check();
  }

  async clearSelectedCaseTypes(): Promise<void> {
    const count = await this.checkboxes.count();

    for (let index = 0; index < count; index++) {
      const checkbox = this.checkboxes.nth(index);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
  }

  getCaseTypeCheckbox(index: number): Locator {
    return this.checkboxes.nth(index);
  }

  buildCasesHeardUrl(serviceCentreId: string): string {
    return config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/cases-heard`;
  }
}
