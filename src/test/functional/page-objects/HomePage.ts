import { expect } from '@playwright/test';

import { Base } from './base';

export class HomePage extends Base {
  private readonly heading = this.page.locator('h1.govuk-heading-xl');
  private readonly mainContent = this.page.locator('#main-content');

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async expectPageTitle(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(pattern);
  }

  async expectHeadingToContain(text: string): Promise<void> {
    await expect(this.heading).toContainText(text);
  }

  async expectMainContentVisible(): Promise<void> {
    await expect(this.mainContent).toBeVisible();
  }

  async expectToBeLoaded(): Promise<void> {
    await this.expectHeadingToContain('Default Page Template');
    await this.expectMainContentVisible();
  }
}
