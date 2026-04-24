import { WaitUtils } from '@hmcts/playwright-common';
import { Locator, Page, expect } from '@playwright/test';

export class FooterComponent {
  readonly footer: Locator;
  private readonly waitUtils = new WaitUtils();

  constructor(private readonly page: Page) {
    this.footer = this.page.locator('footer');
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.footer, {
      visibility: true,
    });
    await expect(this.footer).toBeVisible();
  }
}
