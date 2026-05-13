import { Page } from '@playwright/test';

import { CourtEditPage } from './court-edit.po';
import { HomePage } from './home.po';
import { TranslationAndInterpretationPage } from './translation-and-interpretation.po';

export interface PageFixtures {
  determinePage: Page;
  homePage: HomePage;
  courtEditPage: CourtEditPage;
  translationAndInterpretationPage: TranslationAndInterpretationPage;
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
  translationAndInterpretationPage: async ({ determinePage }, use): Promise<void> => {
    const translationAndInterpretationPage = new TranslationAndInterpretationPage(determinePage);
    await use(translationAndInterpretationPage);
  },
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
};
