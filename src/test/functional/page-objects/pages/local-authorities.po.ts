import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class LocalAuthoritiesPage extends Base {
  public readonly availabilityWarningText: Locator;
  public readonly errorSummary: Locator;
  public readonly saveButton: Locator;
  public readonly successPanel: Locator;
  public readonly tabs: Locator;
  public readonly warningText: Locator;

  constructor(page: Page) {
    super(page);
    this.availabilityWarningText = this.page.getByText('Local authority is only available for courts');
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.tabs = this.page.getByRole('tab');
    this.warningText = this.page.locator('.govuk-warning-text').first();
  }

  async goto(courtId: string): Promise<void> {
    const url = this.buildLocalAuthoritiesUrl(courtId);
    await this.page.goto(url);
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildLocalAuthoritiesSuccessUrl(courtId));
  }

  async selectTab(name: 'Adoption' | 'Children' | 'Divorce'): Promise<void> {
    await this.page.getByRole('tab', { name, exact: true }).click();
  }

  async selectFirstVisibleLocalAuthority(): Promise<void> {
    await this.visibleTabCheckboxes.first().check();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async isConfigurationUnavailable(): Promise<boolean> {
    return (await this.availabilityWarningText.count()) > 0;
  }

  buildLocalAuthoritiesUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/local-authorities`;
  }

  buildLocalAuthoritiesSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/local-authorities/success`;
  }

  buildCourtEditUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit`;
  }

  get visibleTabCheckboxes(): Locator {
    return this.page.locator('.govuk-tabs__panel:not([hidden]) input[type="checkbox"]');
  }

  getFirstVisibleCheckbox(): Locator {
    return this.visibleTabCheckboxes.first();
  }
}
