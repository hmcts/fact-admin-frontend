import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class BuildingFacilitiesPage extends Base {
  public readonly errorSummary: Locator;
  public readonly successPanel: Locator;
  public readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.successPanel = this.page.locator('.govuk-panel--confirmation');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildBuildingFacilitiesUrl(courtId));
  }

  async gotoSuccess(courtId: string): Promise<void> {
    await this.page.goto(this.buildBuildingFacilitiesSuccessUrl(courtId));
  }

  async selectYes(fieldName: string): Promise<void> {
    await this.page.locator(`input[name="${fieldName}"][value="true"]`).check();
  }

  async selectNo(fieldName: string): Promise<void> {
    await this.page.locator(`input[name="${fieldName}"][value="false"]`).check();
  }

  async selectFoodOption(option: string): Promise<void> {
    await this.page.locator(`input[name="foodAndDrink"][value="${option}"]`).check();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  buildBuildingFacilitiesUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/building-facilities`;
  }

  buildBuildingFacilitiesSuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/building-facilities/success`;
  }
}
