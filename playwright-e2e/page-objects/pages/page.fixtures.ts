import { Page } from '@playwright/test';

import { CourtEditPage } from './court-edit.po';
import { DashboardPage } from './dashboard.po';
import { HomePage } from './home.po';

export interface PageFixtures {
  determinePage: Page;
  homePage: HomePage;
  dashboardPage: DashboardPage;
  courtEditPage: CourtEditPage;
}

/* Instantiates pages and provides page to the test via use()
 * can also contain steps before or after providing the page
 * this is the same behaviour as a beforeEach/afterEach hook
 */
export const pageFixtures = {
  // If a performance test is executed, use the lighthouse created page instead
  determinePage: async ({ page, lighthousePage }, use, testInfo) => {
    if (testInfo.tags.includes('@performance')) {
      await use(lighthousePage);
    } else {
      await use(page);
    }
  },
  homePage: async ({ determinePage }, use) => {
    const homePage = new HomePage(determinePage);
    await homePage.goto();
    await use(homePage);
  },
  dashboardPage: async ({ determinePage }, use) => {
    const adminDashboardPage = new DashboardPage(determinePage);
    await use(adminDashboardPage);
  },
  courtEditPage: async ({ determinePage }, use) => {
    const courtEditPage = new CourtEditPage(determinePage);
    await use(courtEditPage);
  },
};
