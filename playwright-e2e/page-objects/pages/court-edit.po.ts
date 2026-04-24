import { Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtEditPage extends Base {
  constructor(page: Page) {
    super(page);
  }

  async goto(courtSlug: string) {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtSlug}/edit#general}`);
  }
}
