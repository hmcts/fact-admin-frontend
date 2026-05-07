import { WaitUtils } from '@hmcts/playwright-common';
import { Locator, Page, expect } from '@playwright/test';

export class HeaderComponent {
  readonly header: Locator;
  readonly navigationLinks: Locator;
  private readonly waitUtils = new WaitUtils();

  constructor(private readonly page: Page) {
    this.header = this.page.locator('header');
    this.navigationLinks = this.page.locator('.govuk-service-navigation__link');
  }

  public async checkIsVisible(): Promise<void> {
    await this.waitUtils.waitForLocatorVisibility(this.header, {
      visibility: true,
    });
    await expect(this.header).toBeVisible();
  }

  public async expectNavigationLink(text: string): Promise<void> {
    await expect(this.navigationLinks.filter({ hasText: text })).toBeVisible();
  }
}
