import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtAddressDeletePage extends Base {
  public readonly deleteAddressButton: Locator;
  public readonly summaryList: Locator;

  constructor(page: Page) {
    super(page);
    this.deleteAddressButton = this.page.getByRole('button', { name: 'Delete address' });
    this.summaryList = this.page.locator('.govuk-summary-list');
  }

  async goto(courtId: string, addressId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtId}/edit/address/delete/${addressId}`);
  }

  async clickDeleteAddress(): Promise<void> {
    await this.deleteAddressButton.click();
  }
}
