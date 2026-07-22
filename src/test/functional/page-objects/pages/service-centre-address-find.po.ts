import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreAddressFindPage extends Base {
  public readonly postcodeInput: Locator;
  public readonly findAddressButton: Locator;
  public readonly enterAddressManuallyButton: Locator;
  public readonly errorSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.postcodeInput = this.page.getByLabel('Postcode');
    this.findAddressButton = this.page.getByRole('button', { name: 'Find address' });
    this.enterAddressManuallyButton = this.page.getByRole('button', { name: 'Enter address manually' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
  }

  async goto(serviceCentreId: string, addressId?: string): Promise<void> {
    const suffix = addressId ? `/${addressId}` : '';
    await this.page.goto(config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/address/find${suffix}`);
  }

  async searchPostcode(postcode: string): Promise<void> {
    await this.postcodeInput.fill(postcode);
    await this.findAddressButton.click();
  }

  async clickEnterAddressManually(): Promise<void> {
    await this.enterAddressManuallyButton.click();
  }
}
