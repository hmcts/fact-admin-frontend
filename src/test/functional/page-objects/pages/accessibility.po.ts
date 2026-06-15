import { Locator, Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class AccessibilityPage extends Base {
  public readonly errorSummary: Locator;
  public readonly successPanel: Locator;
  public readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.errorSummary = this.page.locator('.govuk-error-summary');
    this.successPanel = this.page.locator('.govuk-panel--confirmation, .govuk-notification-banner--success');
    this.saveButton = this.page.getByRole('button', { name: 'Save' });
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(this.buildAccessibilityUrl(courtId));
  }

  async selectYes(fieldName: string): Promise<void> {
    await this.page.locator(`input[name="${fieldName}"][value="true"]`).check();
  }

  async selectNo(fieldName: string): Promise<void> {
    await this.page.locator(`input[name="${fieldName}"][value="false"]`).check();
  }

  async selectHearingOption(option: 'infraredAndHearingLoop' | 'infrared' | 'hearingLoop'): Promise<void> {
    await this.page.locator(`input[name="hearingEnhancementEquipment"][value="${option}"]`).check();
  }

  async fillAccessibleToiletDescription(value: string): Promise<void> {
    await this.page.locator('#accessibleToiletDescription').fill(value);
  }

  async fillAccessibleEntrancePhoneNumber(value: string): Promise<void> {
    await this.page.locator('#accessibleEntrancePhoneNumber').fill(value);
  }

  async fillLiftDoorWidth(value: string): Promise<void> {
    await this.page.locator('#liftDoorWidth').fill(value);
  }

  async fillLiftDoorLimit(value: string): Promise<void> {
    await this.page.locator('#liftDoorLimit').fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  buildAccessibilityUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/accessibility`;
  }

  buildAccessibilitySuccessUrl(courtId: string): string {
    return config.urls.homePageUrl + `/courts/${courtId}/edit/accessibility/success`;
  }
}
