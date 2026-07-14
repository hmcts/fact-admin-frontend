import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreGeneralPage extends Base {
  public readonly errorSummary: Locator;
  public readonly nameInput: Locator;
  public readonly openRadio: Locator;
  public readonly closedRadio: Locator;
  public readonly serviceAreaCheckboxes: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.nameInput = this.page.getByLabel('Service centre name');
    this.openRadio = this.page.getByRole('radio', { name: 'Open' });
    this.closedRadio = this.page.getByRole('radio', { name: 'Closed' });
    this.serviceAreaCheckboxes = this.page.locator('input[name="serviceAreaIds"]');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(serviceCentreId: string): Promise<void> {
    await this.page.goto(this.buildGeneralUrl(serviceCentreId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async updateServiceCentreName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async selectFirstServiceArea(): Promise<void> {
    await this.serviceAreaCheckboxes.first().check();
  }

  async clearSelectedServiceAreas(): Promise<void> {
    const count = await this.serviceAreaCheckboxes.count();

    for (let index = 0; index < count; index++) {
      const checkbox = this.serviceAreaCheckboxes.nth(index);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
  }

  async clearOpenStatusSelection(): Promise<void> {
    await this.page.locator('input[name="open"]').evaluateAll(elements => {
      for (const element of elements) {
        (element as HTMLInputElement).checked = false;
      }
    });
  }

  buildGeneralUrl(serviceCentreId: string): string {
    return config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/general`;
  }
}
