import { Locator, Page, expect } from '@playwright/test';

import { FooterComponent } from './components/footer.component';
import { HeaderComponent } from './components/header.component';
import { HeadingComponent } from './components/heading.component';
import { MainContentComponent } from './components/main-content.component';

// A base page inherited by pages & components
// can contain any additional config needed + instantiated page object
export abstract class Base {
  public readonly header: HeaderComponent;
  public readonly mainContent: MainContentComponent;
  public readonly footer: FooterComponent;
  public readonly heading: HeadingComponent;
  public readonly title: Locator;

  protected constructor(public readonly page: Page) {
    this.header = new HeaderComponent(this.page);
    this.mainContent = new MainContentComponent(this.page);
    this.footer = new FooterComponent(this.page);
    this.heading = new HeadingComponent(this.page);
    this.title = this.page.locator('section.govuk-service-navigation');
  }

  async expectVisibleElements(): Promise<void> {
    await this.header.checkIsVisible();
    await this.heading.checkIsVisible();
    await this.mainContent.checkIsVisible();
    await this.footer.checkIsVisible();
    await expect(this.title).toBeVisible();
  }
}
