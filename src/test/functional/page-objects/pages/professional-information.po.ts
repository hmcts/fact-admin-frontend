import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class ProfessionalInformationPage extends Base {
  public readonly addDxCodeButton: Locator;
  public readonly addFaxNumberButton: Locator;
  public readonly backLink: Locator;
  public readonly courtTypeCheckboxes: Locator;
  public readonly errorSummary: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;
  public readonly warningText: Locator;

  constructor(page: Page) {
    super(page);
    this.addDxCodeButton = this.page.locator('[data-professional-information-add="dxCode"]');
    this.addFaxNumberButton = this.page.locator('[data-professional-information-add="faxNumber"]');
    this.backLink = this.page.locator('.govuk-back-link');
    this.courtTypeCheckboxes = this.page.locator('input[name="courtTypes"]');
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.warningText = this.page.locator('.govuk-warning-text');
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildProfessionalInformationUrl(courtId));
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildProfessionalInformationSuccessUrl(courtId));
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async selectCourtType(name: string): Promise<void> {
    await this.page.getByRole('checkbox', { name }).check();
  }

  async deselectCourtType(name: string): Promise<void> {
    await this.page.getByRole('checkbox', { name }).uncheck();
  }

  async selectRadio(name: string, value: 'Yes' | 'No'): Promise<void> {
    await this.page.locator(`input[name="${name}"][value="${value === 'Yes' ? 'true' : 'false'}"]`).check();
  }

  async addDxCodes(count: number): Promise<void> {
    const initialCount = await this.dxCodeInputs.count();
    for (let index = initialCount; index < count; index++) {
      await this.addDxCodeButton.scrollIntoViewIfNeeded();
      await this.addDxCodeButton.click({ force: true });
      await this.dxCodeInput(index).waitFor({ state: 'visible' });
    }
  }

  async addFaxNumbers(count: number): Promise<void> {
    const initialCount = await this.faxNumberInputs.count();
    for (let index = initialCount; index < count; index++) {
      await this.addFaxNumberButton.scrollIntoViewIfNeeded();
      await this.addFaxNumberButton.click({ force: true });
      await this.faxNumberInput(index).waitFor({ state: 'visible' });
    }
  }

  get dxCodeInputs(): Locator {
    return this.page.locator('input[name^="dxCode-"]');
  }

  get faxNumberInputs(): Locator {
    return this.page.locator('input[name^="faxNumber-"]');
  }

  dxCodeInput(index: number): Locator {
    return this.page.locator(`#dxCode-${index}`);
  }

  dxCodeDescriptionInput(index: number): Locator {
    return this.page.locator(`#dxCodeDescription-${index}`);
  }

  faxNumberInput(index: number): Locator {
    return this.page.locator(`#faxNumber-${index}`);
  }

  faxNumberDescriptionInput(index: number): Locator {
    return this.page.locator(`#faxNumberDescription-${index}`);
  }

  codeInput(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  removeDxCodeButton(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove DX code ${index + 1}` });
  }

  removeFaxNumberButton(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove Fax number ${index + 1}` });
  }

  buildProfessionalInformationUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/information-for-professionals`;
  }

  buildProfessionalInformationSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/information-for-professionals/success`;
  }

  buildCourtEditUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit`;
  }
}
