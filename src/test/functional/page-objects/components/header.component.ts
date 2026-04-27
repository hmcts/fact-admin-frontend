import { WaitUtils } from '@hmcts/playwright-common';
import { Locator, Page, expect } from '@playwright/test';

export class HeaderComponent {
  readonly header: Locator;
  private readonly waitUtils = new WaitUtils();

  constructor(private readonly page: Page) {
    this.header = this.page.locator('header');
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.header, {
      visibility: true,
    });
    await expect(this.header).toBeVisible();
  }
}
