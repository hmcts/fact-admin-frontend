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
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  determinePage: async ({ page, lighthousePage }, use, testInfo): Promise<void> => {
    if (testInfo.tags.includes('@performance')) {
      await use(lighthousePage);
    } else {
      await use(page);
    }
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  homePage: async ({ determinePage }, use): Promise<void> => {
    const homePage = new HomePage(determinePage);
    await homePage.goto();
    await use(homePage);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  dashboardPage: async ({ determinePage }, use): Promise<void> => {
    const adminDashboardPage = new DashboardPage(determinePage);
    await use(adminDashboardPage);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  courtEditPage: async ({ determinePage }, use): Promise<void> => {
    const courtEditPage = new CourtEditPage(determinePage);
    await use(courtEditPage);
  },
};
