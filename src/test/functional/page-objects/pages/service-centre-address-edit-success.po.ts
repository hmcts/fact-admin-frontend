import { Locator, Page } from '@playwright/test';

import { Base } from '../base';

export class ServiceCentreAddressEditSuccessPage extends Base {
  public readonly successPanelTitle: Locator;
  public readonly backToAddressesLink: Locator;
  public readonly homeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.successPanelTitle = this.page.locator('.govuk-panel__title');
    this.backToAddressesLink = this.page.getByRole('link', { name: 'Back to address' });
    this.homeLink = this.mainContent.content.getByRole('link', { name: 'Home' });
  }
}
