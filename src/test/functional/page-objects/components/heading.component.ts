import { WaitUtils } from '@hmcts/playwright-common';
import { Locator, Page, expect } from '@playwright/test';

export class HeadingComponent {
  readonly heading: Locator;
  private readonly waitUtils = new WaitUtils();

  constructor(private readonly page: Page) {
    this.heading = this.page.locator('h1.govuk-heading-xl');
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.heading, {
      visibility: true,
    });
    await expect(this.heading).toBeVisible();
  }
}
