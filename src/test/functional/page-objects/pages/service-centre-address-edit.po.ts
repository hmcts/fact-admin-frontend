import { Locator, Page } from '@playwright/test';

import { Base } from '../base';

export type ServiceCentreAddressFormData = {
  addressLine1: string;
  addressLine2?: string;
  townCity: string;
  county?: string;
  postcode: string;
};

export class ServiceCentreAddressEditPage extends Base {
  public readonly addressTypeVisitRadio: Locator;
  public readonly addressTypeSendDocumentsToRadio: Locator;
  public readonly addressTypeVisitAndSendDocumentsToRadio: Locator;
  public readonly addressLine1Input: Locator;
  public readonly addressLine2Input: Locator;
  public readonly townCityInput: Locator;
  public readonly countyInput: Locator;
  public readonly postcodeInput: Locator;
  public readonly saveButton: Locator;
  public readonly errorSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.addressTypeVisitRadio = this.page.getByLabel('Visit', { exact: true });
    this.addressTypeSendDocumentsToRadio = this.page.getByLabel('Send documents to', { exact: true });
    this.addressTypeVisitAndSendDocumentsToRadio = this.page.getByLabel('Visit and send documents to', { exact: true });
    this.addressLine1Input = this.page.getByLabel('Address line 1');
    this.addressLine2Input = this.page.getByLabel('Address line 2 (optional)');
    this.townCityInput = this.page.getByLabel('Town or city');
    this.countyInput = this.page.getByLabel('County (optional)');
    this.postcodeInput = this.page.getByLabel('Postcode');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
  }

  async fillAddressForm(data: ServiceCentreAddressFormData): Promise<void> {
    await this.addressTypeSendDocumentsToRadio.check();
    await this.addressLine1Input.fill(data.addressLine1);
    await this.addressLine2Input.fill(data.addressLine2 ?? '');
    await this.townCityInput.fill(data.townCity);
    await this.countyInput.fill(data.county ?? '');
    await this.postcodeInput.fill(data.postcode);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }
}
