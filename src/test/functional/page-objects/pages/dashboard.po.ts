import { Page } from '@playwright/test';

import { config } from '../../utils';
import { Base } from '../base';

export enum DashboardSection {
  COURTS = '/courts',
  LISTS = '/lists',
  DOWNLOAD = '/download',
  ADD_COURT = '/add-court',
  BULK_UPDATE = '/bulk-update',
  AUDITS = '/audits',
}

export class DashboardPage extends Base {
  constructor(page: Page) {
    super(page);
  }

  async goto(section: DashboardSection): Promise<void> {
    await this.page.goto(config.urls.homePageUrl + section);
  }
}
