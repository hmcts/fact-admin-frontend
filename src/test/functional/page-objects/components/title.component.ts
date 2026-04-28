import { WaitUtils } from '@hmcts/playwright-common';
import { Locator, Page, expect } from '@playwright/test';

export class TitleComponent {
  readonly title: Locator;
  private readonly waitUtils = new WaitUtils();

  constructor(private readonly page: Page) {
    this.title = this.page.locator('section.govuk-service-navigation');
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.title, {
      visibility: true,
    });
    await expect(this.title).toBeVisible();
  }
}
