import { Page } from '@playwright/test';

import { CasesHeardPage } from './cases-heard.po';
import { CourtEditPage } from './court-edit.po';
import { GeneralPage } from './general.po';
import { HomePage } from './home.po';

export interface PageFixtures {
  determinePage: Page;
  homePage: HomePage;
  courtEditPage: CourtEditPage;
  casesHeardPage: CasesHeardPage;
  generalPage: GeneralPage;
}

/* Instantiates pages and provides page to the test via use()
 * can also contain steps before or after providing the page
 * this is the same behaviour as a beforeEach/afterEach hook
 */
export const pageFixtures = {
  // If a performance test is executed, use the lighthouse created page instead
  /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
  determinePage: async ({ page, lighthousePage }, use, testInfo): Promise<void> => {
    if (testInfo.tags.includes('@performance')) {
      await use(lighthousePage);
    } else {
      await use(page);
    }
  },
  homePage: async ({ determinePage }, use): Promise<void> => {
    const homePage = new HomePage(determinePage);
    await homePage.goto();
    await use(homePage);
  },
  courtEditPage: async ({ determinePage }, use): Promise<void> => {
    const courtEditPage = new CourtEditPage(determinePage);
    await use(courtEditPage);
  },
  casesHeardPage: async ({ determinePage }, use): Promise<void> => {
    const casesHeardPage = new CasesHeardPage(determinePage);
    await use(casesHeardPage);
  },
  generalPage: async ({ determinePage }, use): Promise<void> => {
    const generalPage = new GeneralPage(determinePage);
    await use(generalPage);
  },
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
};
