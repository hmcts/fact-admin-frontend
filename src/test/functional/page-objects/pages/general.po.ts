import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class GeneralPage extends Base {
  public readonly errorSummary: Locator;
  public readonly nameInput: Locator;
  public readonly openRadio: Locator;
  public readonly closedRadio: Locator;
  public readonly regionSelect: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.nameInput = this.page.getByLabel('Name');
    this.openRadio = this.page.getByRole('radio', { name: 'Open' });
    this.closedRadio = this.page.getByRole('radio', { name: 'Closed' });
    this.regionSelect = this.page.getByLabel('Region');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildGeneralUrl(courtId));
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildGeneralSuccessUrl(courtId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async updateCourtName(courtName: string): Promise<void> {
    await this.nameInput.fill(courtName);
  }

  buildGeneralUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/general`;
  }

  buildGeneralSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/general/success`;
  }

  buildCourtEditUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit`;
  }
}

