import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreAddressDeletePage extends Base {
  public readonly deleteAddressButton: Locator;
  public readonly summaryList: Locator;

  constructor(page: Page) {
    super(page);
    this.deleteAddressButton = this.page.getByRole('button', { name: 'Delete address' });
    this.summaryList = this.page.locator('.govuk-summary-list');
  }

  async goto(serviceCentreId: string, addressId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/address/delete/${addressId}`);
  }

  async clickDeleteAddress(): Promise<void> {
    await this.deleteAddressButton.click();
  }
}
