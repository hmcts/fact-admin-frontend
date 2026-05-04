import { Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export class CourtEditPage extends Base {
  constructor(page: Page) {
    super(page);
  }

  async goto(courtId: string): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + `/courts/${courtId}/edit`);
  }
}
