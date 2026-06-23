import { test } from '../fixtures';
import { withCreatedCourt } from '../helpers/testSupport';
import { config } from '../utils';

const LIGHTHOUSE_THRESHOLDS = {
  accessibility: 100,
  'best-practices': 100,
  performance: 80,
} as const;

test.describe(
  'Performance Tests',
  {
    tag: '@performance',
  },
  () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: config.users.superAdmin.sessionFile });

    test('Home Page Performance', async ({ homePage, lighthouseUtils }) => {
      await homePage.header.checkIsVisible();
      await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
    });

    test('Add Court Page Performance', async ({ addCourtPage, lighthouseUtils }) => {
      await addCourtPage.goto();
      await addCourtPage.header.checkIsVisible();
      await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
    });

    test('Cases Heard Page Performance', async ({ casesHeardPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Translation and Interpretation Page Performance', async ({
      lighthouseUtils,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Performance Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Address List Page Performance', async ({ lighthouseUtils, playwright, courtAddressListPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Performance Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressListPage.goto(createdCourt.id);
          await courtAddressListPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Address Find Page Performance', async ({ lighthouseUtils, playwright, courtAddressFindPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Performance Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Address Select Page Performance', async ({ lighthouseUtils, playwright, courtAddressSelectPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Performance Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, 'SW1A 1AA');
          await courtAddressSelectPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test(
      'General Page Performance',
      {
        tag: '@performance',
      },
      async ({ generalPage, lighthouseUtils, playwright }) => {
        await withCreatedCourt(
          playwright,
          'General Performance Test',
          { serviceCenter: false },
          async ({ createdCourt }) => {
            await generalPage.goto(createdCourt.id);
            await generalPage.header.checkIsVisible();
            await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
          }
        );
      }
    );

    test('Information for Professionals Page Performance', async ({
      lighthouseUtils,
      playwright,
      professionalInformationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Information for Professionals Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await professionalInformationPage.goto(createdCourt.id);
          await professionalInformationPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Local Authorities Page Performance', async ({
      lighthouseUtils,
      casesHeardPage,
      localAuthoritiesPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Local Authorities Performance Test',
        { serviceCenter: false, forceFamilyCourt: true },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.selectAllCaseTypes();
          await casesHeardPage.save();
          await casesHeardPage.header.checkIsVisible();

          await localAuthoritiesPage.goto(createdCourt.id);
          await localAuthoritiesPage.expectVisibleElements();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Court Contact List Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Contact List Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtContactDetailsPage.goto(createdCourt.id);
          await courtContactDetailsPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Court Contact Add Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Contact Add Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtContactDetailsPage.gotoAdd(createdCourt.id);
          await courtContactDetailsPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Court Contact Edit Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Contact Edit Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          const uniqueSuffix = Date.now();
          const contactEmail = `perf-contact-${uniqueSuffix}@example.test`;

          await courtContactDetailsPage.gotoAdd(createdCourt.id);
          await courtContactDetailsPage.selectFirstAvailableContactType();
          await courtContactDetailsPage.emailCheckbox.check();
          await courtContactDetailsPage.emailInput.fill(contactEmail);
          await courtContactDetailsPage.explanationInput.fill('Performance edit test contact');
          await courtContactDetailsPage.save();
          await courtContactDetailsPage.continueUpdatingLink.click();

          await courtContactDetailsPage.clickEditForRowText(contactEmail);
          await courtContactDetailsPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Court Contact Delete Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Contact Delete Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          const uniqueSuffix = Date.now();
          const contactEmail = `perf-delete-${uniqueSuffix}@example.test`;

          await courtContactDetailsPage.gotoAdd(createdCourt.id);
          await courtContactDetailsPage.selectFirstAvailableContactType();
          await courtContactDetailsPage.emailCheckbox.check();
          await courtContactDetailsPage.emailInput.fill(contactEmail);
          await courtContactDetailsPage.explanationInput.fill('Performance delete test contact');
          await courtContactDetailsPage.save();
          await courtContactDetailsPage.continueUpdatingLink.click();

          await courtContactDetailsPage.clickDeleteForRowText(contactEmail);
          await courtContactDetailsPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });
  }
);
