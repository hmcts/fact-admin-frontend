import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class AddServiceCentrePage extends Base {
  public readonly nameInput: Locator;
  public readonly regionSelect: Locator;
  public readonly serviceAreaCheckboxes: Locator;
  public readonly addServiceCentreButton: Locator;
  public readonly errorSummary: Locator;
  public readonly continueToAddressLink: Locator;
  public readonly loadingStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.page.getByLabel('Name');
    this.regionSelect = this.page.getByLabel('Region');
    this.serviceAreaCheckboxes = this.page.locator('input[name="serviceAreaIds"]');
    this.addServiceCentreButton = this.page.getByRole('button', { name: 'Add service centre' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.continueToAddressLink = this.page.getByRole('link', { name: /Continue to add an address for/ });
    this.loadingStatus = this.page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto(`${config.urls.homePageUrl}/add-service-centre`);
  }

  async createServiceCentre(serviceCentreName: string): Promise<void> {
    await this.nameInput.fill(serviceCentreName);
    await this.regionSelect.selectOption({ index: 1 });
    await this.serviceAreaCheckboxes.first().check();
    await this.addServiceCentreButton.click();
  }

  async submitInvalidServiceCentre(): Promise<void> {
    await this.addServiceCentreButton.click();
  }

  async continueToAddress(): Promise<void> {
    await this.continueToAddressLink.click();
  }
}
