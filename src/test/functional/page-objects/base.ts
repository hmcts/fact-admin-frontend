import { Locator, Page } from '@playwright/test';

import { expect } from '../fixtures';

import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header.component';
import { MainContentComponent } from './components/main-content.component';
import { TitleComponent } from './components/title.component';

// Base page object that contains common elements expected for all pages.
export abstract class Base {
  // Structural components we'd expect to see on all pages
  public readonly header: HeaderComponent;
  public readonly mainContent: MainContentComponent;
  public readonly footer: FooterComponent;
  public readonly title: TitleComponent;

  // Value components we'd expect to see on all pages
  public readonly heading: Locator;

  protected constructor(public readonly page: Page) {
    this.header = new HeaderComponent(this.page);
    this.title = new TitleComponent(this.page);
    this.mainContent = new MainContentComponent(this.page);
    this.footer = new FooterComponent(this.page);

    this.heading = this.page.locator('h1.govuk-heading-xl');
  }

  async expectVisibleElements(): Promise<void> {
    await this.header.checkIsVisible();
    await this.title.checkIsVisible();
    await this.mainContent.checkIsVisible();
    await this.footer.checkIsVisible();

    await expect(this.heading).toBeVisible();
  }
}
