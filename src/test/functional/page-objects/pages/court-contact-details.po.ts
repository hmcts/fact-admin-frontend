import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtContactDetailsPage extends Base {
  public readonly addContactDetailLink: Locator;
  public readonly contactTypeAutocompleteInput: Locator;
  public readonly contactTypeSelect: Locator;
  public readonly contactTypeFallbackSelect: Locator;
  public readonly emailCheckbox: Locator;
  public readonly phoneCheckbox: Locator;
  public readonly emailInput: Locator;
  public readonly phoneInput: Locator;
  public readonly explanationInput: Locator;
  public readonly explanationCyInput: Locator;
  public readonly saveButton: Locator;
  public readonly errorSummary: Locator;
  public readonly successPanel: Locator;
  public readonly continueUpdatingLink: Locator;

  constructor(page: Page) {
    super(page);
    this.addContactDetailLink = this.page.getByRole('button', { name: 'Add contact detail' });
    this.contactTypeAutocompleteInput = this.page.locator('input#contact-type[role="combobox"]');
    this.contactTypeSelect = this.page.locator('select#contact-type-select');
    this.contactTypeFallbackSelect = this.page.locator('select#contact-type');
    this.emailCheckbox = this.page.getByRole('checkbox', { name: 'Email address' });
    this.phoneCheckbox = this.page.getByRole('checkbox', { name: 'Phone number' });
    this.emailInput = this.page.locator('#contact-email');
    this.phoneInput = this.page.locator('#contact-telephone');
    this.explanationInput = this.page.locator('#contact-explanation');
    this.explanationCyInput = this.page.locator('#contact-explanation-cy');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.continueUpdatingLink = this.page.getByRole('link', { name: 'Back to contact details' });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildContactDetailsUrl(courtId));
  }

  async gotoAdd(courtId: string): Promise<void> {
    await this.page.goto(this.buildAddContactUrl(courtId));
  }

  async selectFirstAvailableContactType(): Promise<string> {
    const hasAutocomplete = (await this.contactTypeAutocompleteInput.count()) > 0;
    if (hasAutocomplete) {
      await this.contactTypeAutocompleteInput.click();
      const listboxId = await this.contactTypeAutocompleteInput.getAttribute('aria-controls');
      const firstAutocompleteOption = (
        listboxId
          ? this.page.locator(`#${listboxId} .autocomplete__option:not(.autocomplete__option--no-results)`)
          : this.page.locator('.autocomplete__menu .autocomplete__option:not(.autocomplete__option--no-results)')
      ).first();
      await firstAutocompleteOption.waitFor({ state: 'visible' });
      const selectedLabel = (await firstAutocompleteOption.textContent())?.trim() ?? '';
      if (!selectedLabel) {
        throw new Error('No contact type option is available for selection');
      }

      await firstAutocompleteOption.click();
      const selectedValue = await this.page.locator('#contact-type-select').inputValue();
      if (!selectedValue) {
        throw new Error('No contact type option was selected');
      }

      return selectedLabel;
    }

    const firstOption = this.page.locator('#contact-type option:not([value=""])').first();
    const selectedValue = await firstOption.getAttribute('value');
    const selectedLabel = (await firstOption.textContent())?.trim() ?? '';

    if (!selectedValue) {
      throw new Error('No contact type option is available for selection');
    }

    await this.contactTypeFallbackSelect.selectOption(selectedValue);
    return selectedLabel;
  }

  async openContactTypeAndBlur(): Promise<void> {
    if ((await this.contactTypeAutocompleteInput.count()) === 0) {
      return;
    }

    await this.contactTypeAutocompleteInput.click();
    await this.explanationInput.click();
  }

  async selectedContactTypeValue(): Promise<string> {
    if ((await this.contactTypeSelect.count()) > 0) {
      return this.contactTypeSelect.inputValue();
    }

    return this.contactTypeFallbackSelect.inputValue();
  }

  async clickEditForDescription(description: string): Promise<void> {
    const row = this.page.locator('tbody tr', { hasText: description }).first();
    await row.getByRole('link', { name: 'Edit', exact: true }).click();
  }

  async clickDeleteForDescription(description: string): Promise<void> {
    const row = this.page.locator('tbody tr', { hasText: description }).first();
    await row.getByRole('link', { name: 'Delete', exact: true }).click();
  }

  async clickEditForRowText(rowText: string): Promise<void> {
    const row = this.page.locator('tbody tr', { hasText: rowText }).first();
    await row.getByRole('link', { name: 'Edit', exact: true }).click();
  }

  async clickDeleteForRowText(rowText: string): Promise<void> {
    const row = this.page.locator('tbody tr', { hasText: rowText }).first();
    await row.getByRole('link', { name: 'Delete', exact: true }).click();
  }

  async confirmDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Yes, delete contact details' }).click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async fillWelshExplanation(value: string): Promise<void> {
    await this.explanationCyInput.fill(value);
  }

  buildContactDetailsUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/contact-details`;
  }

  buildAddContactUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/contact-details/add`;
  }
}
