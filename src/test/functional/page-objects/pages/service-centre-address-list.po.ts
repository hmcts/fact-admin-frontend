import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ServiceCentreAddressListPage extends Base {
  public readonly addAddressButton: Locator;
  public readonly addressesTable: Locator;
  public readonly noAddressesMessage: Locator;
  public readonly firstEditLink: Locator;
  public readonly firstDeleteLink: Locator;

  constructor(page: Page) {
    super(page);
    this.addAddressButton = this.page.getByRole('button', { name: 'Add address' });
    this.addressesTable = this.page.getByRole('table');
    this.noAddressesMessage = this.page.getByText('No addresses are currently configured.');
    this.firstEditLink = this.addressesTable.getByRole('link', { name: 'Edit', exact: true }).first();
    this.firstDeleteLink = this.addressesTable.getByRole('link', { name: 'Delete', exact: true }).first();
  }

  async goto(serviceCentreId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/service-centres/${serviceCentreId}/edit/address`);
  }

  async getAddressCount(): Promise<number> {
    return this.addressesTable.getByRole('link', { name: 'Edit', exact: true }).count();
  }

  async clickAddAddress(): Promise<void> {
    await this.addAddressButton.click();
  }

  async getFirstEditHref(): Promise<string | null> {
    return this.firstEditLink.getAttribute('href');
  }

  async getFirstDeleteHref(): Promise<string | null> {
    return this.firstDeleteLink.getAttribute('href');
  }

  async getSpecificAddressEditLink(postcode: string): Promise<string | null> {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: postcode }) })
      .getByRole('link', { name: 'Edit' })
      .first()
      .getAttribute('href');
  }
}
