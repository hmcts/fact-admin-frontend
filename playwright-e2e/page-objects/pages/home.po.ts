import { Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class HomePage extends Base {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(config.urls.homePageUrl);
  }
}
