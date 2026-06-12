import { Page } from '@playwright/test';

import { CasesHeardPage } from './cases-heard.po';
import { CourtAddressDeleteSuccessPage } from './court-address-delete-success.po';
import { CourtAddressDeletePage } from './court-address-delete.po';
import { CourtAddressEditSuccessPage } from './court-address-edit-success.po';
import { CourtAddressEditPage } from './court-address-edit.po';
import { CourtAddressFindPage } from './court-address-find.po';
import { CourtAddressListPage } from './court-address-list.po';
import { CourtAddressSelectPage } from './court-address-select.po';
import { CourtEditPage } from './court-edit.po';
import { GeneralPage } from './general.po';
import { HomePage } from './home.po';
import { LocalAuthoritiesPage } from './local-authorities.po';
import { ProfessionalInformationPage } from './professional-information.po';
import { TranslationAndInterpretationPage } from './translation-and-interpretation.po';

export interface PageFixtures {
  determinePage: Page;
  homePage: HomePage;
  courtEditPage: CourtEditPage;
  casesHeardPage: CasesHeardPage;
  translationAndInterpretationPage: TranslationAndInterpretationPage;
  courtAddressListPage: CourtAddressListPage;
  courtAddressFindPage: CourtAddressFindPage;
  courtAddressSelectPage: CourtAddressSelectPage;
  courtAddressEditPage: CourtAddressEditPage;
  courtAddressDeletePage: CourtAddressDeletePage;
  courtAddressEditSuccessPage: CourtAddressEditSuccessPage;
  courtAddressDeleteSuccessPage: CourtAddressDeleteSuccessPage;
  generalPage: GeneralPage;
  localAuthoritiesPage: LocalAuthoritiesPage;
  professionalInformationPage: ProfessionalInformationPage;
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
  casesHeardPage: async ({ determinePage }, use): Promise<void> => {
    const casesHeardPage = new CasesHeardPage(determinePage);
    await use(casesHeardPage);
  },
  courtAddressListPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressListPage = new CourtAddressListPage(determinePage);
    await use(courtAddressListPage);
  },
  courtAddressFindPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressFindPage = new CourtAddressFindPage(determinePage);
    await use(courtAddressFindPage);
  },
  courtAddressSelectPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressSelectPage = new CourtAddressSelectPage(determinePage);
    await use(courtAddressSelectPage);
  },
  courtAddressEditPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressEditPage = new CourtAddressEditPage(determinePage);
    await use(courtAddressEditPage);
  },
  courtAddressDeletePage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressDeletePage = new CourtAddressDeletePage(determinePage);
    await use(courtAddressDeletePage);
  },
  courtAddressEditSuccessPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressEditSuccessPage = new CourtAddressEditSuccessPage(determinePage);
    await use(courtAddressEditSuccessPage);
  },
  courtAddressDeleteSuccessPage: async ({ determinePage }, use): Promise<void> => {
    const courtAddressDeleteSuccessPage = new CourtAddressDeleteSuccessPage(determinePage);
    await use(courtAddressDeleteSuccessPage);
  },
  generalPage: async ({ determinePage }, use): Promise<void> => {
    const generalPage = new GeneralPage(determinePage);
    await use(generalPage);
  },
  localAuthoritiesPage: async ({ determinePage }, use): Promise<void> => {
    const localAuthoritiesPage = new LocalAuthoritiesPage(determinePage);
    await use(localAuthoritiesPage);
  },
  professionalInformationPage: async ({ determinePage }, use): Promise<void> => {
    const professionalInformationPage = new ProfessionalInformationPage(determinePage);
    await use(professionalInformationPage);
  },
  /* eslint-enable @typescript-eslint/explicit-module-boundary-types */
};
