import { Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export enum PageSection {
  COURTS = '/courts',
  LISTS = '/lists',
  DOWNLOAD = '/download',
  ADD_COURT = '/add-court',
  BULK_UPDATE = '/bulk-update',
  AUDITS = '/audits',
}

export class HomePage extends Base {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(config.urls.homePageUrl);
  }

  async gotoSection(section: PageSection): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + section);
  }
}
