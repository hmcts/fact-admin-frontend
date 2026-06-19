import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class AddCourtPage extends Base {
  public readonly nameInput: Locator;
  public readonly regionSelect: Locator;
  public readonly addCourtButton: Locator;
  public readonly errorSummary: Locator;
  public readonly continueToAddressLink: Locator;
  public readonly loadingStatus: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = this.page.getByLabel('Name');
    this.regionSelect = this.page.getByLabel('Region');
    this.addCourtButton = this.page.getByRole('button', { name: 'Add court' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.continueToAddressLink = this.page.getByRole('link', { name: /Continue to add an address for/ });
    this.loadingStatus = this.page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto(`${config.urls.homePageUrl}/add-court`);
  }

  async createCourt(courtName: string): Promise<void> {
    await this.nameInput.fill(courtName);
    await this.regionSelect.selectOption({ index: 1 });
    await this.addCourtButton.click();
  }

  async submitInvalidCourt(): Promise<void> {
    await this.addCourtButton.click();
  }

  async continueToAddress(): Promise<void> {
    await this.continueToAddressLink.click();
  }
}
