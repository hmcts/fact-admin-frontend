import { Page } from '@playwright/test';

import { AccessibilityPage } from './accessibility.po';
import { AddCourtPage } from './add-court.po';
import { BuildingFacilitiesPage } from './building-facilities.po';
import { CasesHeardPage } from './cases-heard.po';
import { CourtAddressDeleteSuccessPage } from './court-address-delete-success.po';
import { CourtAddressDeletePage } from './court-address-delete.po';
import { CourtAddressEditSuccessPage } from './court-address-edit-success.po';
import { CourtAddressEditPage } from './court-address-edit.po';
import { CourtAddressFindPage } from './court-address-find.po';
import { CourtAddressListPage } from './court-address-list.po';
import { CourtAddressSelectPage } from './court-address-select.po';
import { CourtContactDetailsPage } from './court-contact-details.po';
import { CourtEditPage } from './court-edit.po';
import { GeneralPage } from './general.po';
import { HomePage } from './home.po';
import { LocalAuthoritiesPage } from './local-authorities.po';
import { ProfessionalInformationPage } from './professional-information.po';
import { TranslationAndInterpretationPage } from './translation-and-interpretation.po';

export interface PageFixtures {
  determinePage: Page;
  addCourtPage: AddCourtPage;
  homePage: HomePage;
  courtEditPage: CourtEditPage;
  casesHeardPage: CasesHeardPage;
  accessibilityPage: AccessibilityPage;
  buildingFacilitiesPage: BuildingFacilitiesPage;
  translationAndInterpretationPage: TranslationAndInterpretationPage;
  courtAddressListPage: CourtAddressListPage;
  courtAddressFindPage: CourtAddressFindPage;
  courtAddressSelectPage: CourtAddressSelectPage;
  courtAddressEditPage: CourtAddressEditPage;
  courtAddressDeletePage: CourtAddressDeletePage;
  courtAddressEditSuccessPage: CourtAddressEditSuccessPage;
  courtAddressDeleteSuccessPage: CourtAddressDeleteSuccessPage;
  courtContactDetailsPage: CourtContactDetailsPage;
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
  addCourtPage: async ({ determinePage }, use): Promise<void> => {
    const addCourtPage = new AddCourtPage(determinePage);
    await use(addCourtPage);
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
  accessibilityPage: async ({ determinePage }, use): Promise<void> => {
    const accessibilityPage = new AccessibilityPage(determinePage);
    await use(accessibilityPage);
  },
  buildingFacilitiesPage: async ({ determinePage }, use): Promise<void> => {
    const buildingFacilitiesPage = new BuildingFacilitiesPage(determinePage);
    await use(buildingFacilitiesPage);
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
  courtContactDetailsPage: async ({ determinePage }, use): Promise<void> => {
    const courtContactDetailsPage = new CourtContactDetailsPage(determinePage);
    await use(courtContactDetailsPage);
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
