import { Locator, Page, expect } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class TranslationAndInterpretationPage extends Base {
  public readonly emailCheckbox: Locator;
  public readonly emailInput: Locator;
  public readonly phoneNumberCheckbox: Locator;
  public readonly phoneNumberInput: Locator;
  public readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailCheckbox = this.page.getByRole('checkbox', { name: 'Email address' });
    this.emailInput = this.page.getByLabel('Enter email address');
    this.phoneNumberCheckbox = this.page.getByRole('checkbox', { name: 'Phone number' });
    this.phoneNumberInput = this.page.getByLabel('Enter phone number');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtId}/edit/translation-and-interpretation`);
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtId}/edit/translation-and-interpretation/success`);
  }

  async selectEmail(email: string): Promise<void> {
    await this.emailCheckbox.check();
    await this.emailInput.fill(email);
  }

  async selectPhoneNumber(phoneNumber: string): Promise<void> {
    await this.phoneNumberCheckbox.check();
    await this.phoneNumberInput.fill(phoneNumber);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async expectSuccessPage(courtName: string): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Translation and interpretation saved' })
    ).toBeVisible();
    await expect(this.mainContent.content).toContainText(
      `Translation and interpretation contact for ${courtName} has been saved successfully.`
    );
    await expect(this.mainContent.content).toContainText('What do you want to do next?');
    await expect(this.page.getByRole('link', { name: `Continue updating ${courtName}` })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Home' })).toBeVisible();
  }
}
