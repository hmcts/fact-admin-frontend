import { expect, test } from '../fixtures';
import { seedAuditTrailViaUi } from '../helpers/auditTestSupport';
import { withCreatedCourt } from '../helpers/testSupport';
import { config } from '../utils';

test.describe(
  'Accessibility Tests',
  {
    tag: '@a11y',
  },
  () => {
    test.use({ storageState: config.users.superAdmin.sessionFile });

    test('Home Page Accessibility', async ({ homePage, axeUtils }) => {
      await homePage.expectVisibleElements();
      await axeUtils.audit();
    });

    test('Add Court Page Accessibility', async ({ addCourtPage, axeUtils }) => {
      await addCourtPage.goto();
      await addCourtPage.expectVisibleElements();
      await axeUtils.audit();
    });

    test('Add Court Validation Accessibility', async ({ addCourtPage, axeUtils }) => {
      await addCourtPage.goto();
      await addCourtPage.submitInvalidCourt();
      await expect(addCourtPage.mainContent.content).toContainText('There is a problem');
      await axeUtils.audit();
    });

    test('Court Edit Page Accessibility', async ({ axeUtils, courtEditPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Edit Accessibility Test', {}, async ({ createdCourt }) => {
        await courtEditPage.goto(createdCourt.id);
        await courtEditPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('Cases Heard Page Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(playwright, 'Cases Heard Accessibility Test', {}, async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('Cases Heard Validation Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(playwright, 'Cases Heard Accessibility Test', {}, async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.clearSelectedCaseTypes();
        await casesHeardPage.save();
        await casesHeardPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('Cases Heard Success Page Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(playwright, 'Cases Heard Accessibility Test', {}, async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.selectFirstCaseType();
        await casesHeardPage.save();
        await casesHeardPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('General Page Accessibility', async ({ axeUtils, generalPage, playwright }) => {
      await withCreatedCourt(playwright, 'General Accessibility Test', {}, async ({ createdCourt }) => {
        await generalPage.goto(createdCourt.id);
        await generalPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('General Validation Accessibility', async ({ axeUtils, generalPage, playwright }) => {
      await withCreatedCourt(playwright, 'General Accessibility Test', {}, async ({ createdCourt }) => {
        await generalPage.goto(createdCourt.id);
        await generalPage.nameInput.clear();
        await generalPage.save();
        await generalPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('General Success Page Accessibility', async ({ axeUtils, generalPage, playwright }) => {
      await withCreatedCourt(playwright, 'General Accessibility Test', {}, async ({ createdCourt }) => {
        await generalPage.goto(createdCourt.id);
        await generalPage.save();
        await generalPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('Translation and Interpretation Page Accessibility', async ({
      axeUtils,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Accessibility Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.expectVisibleElements();
          await expect(translationAndInterpretationPage.heading).toContainText('Translation and interpretation');
          await axeUtils.audit();
        }
      );
    });

    test('Translation and Interpretation Validation Error Accessibility', async ({
      axeUtils,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Accessibility Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.emailCheckbox.check();
          await translationAndInterpretationPage.phoneNumberCheckbox.check();
          await translationAndInterpretationPage.save();
          await expect(translationAndInterpretationPage.mainContent.content).toContainText('There is a problem');
          await axeUtils.audit();
        }
      );
    });

    test('Court Not Found Page Accessibility', async ({ axeUtils, courtEditPage }) => {
      await courtEditPage.goto('not-a-uuid');
      await courtEditPage.expectVisibleElements();
      await axeUtils.audit();
    });

    test('Address List Page Accessibility', async ({ axeUtils, courtAddressListPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Accessibility Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressListPage.goto(createdCourt.id);
          await courtAddressListPage.header.checkIsVisible();
          await axeUtils.audit();
        }
      );
    });

    test('Address Find Page Accessibility', async ({ axeUtils, playwright, courtAddressFindPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Accessibility Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressFindPage.goto(createdCourt.id);
          await courtAddressFindPage.header.checkIsVisible();
          await axeUtils.audit();
        }
      );
    });

    test('Address Select Page Accessibility', async ({ axeUtils, playwright, courtAddressSelectPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Accessibility Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, 'SW1A 1AA');
          await courtAddressSelectPage.header.checkIsVisible();
          await axeUtils.audit();
        }
      );
    });

    test('Court Opening Hours List Page Accessibility', async ({ axeUtils, courtOpeningHoursPage, playwright }) => {
      await withCreatedCourt(playwright, 'Opening Hours Accessibility Test', {}, async ({ createdCourt }) => {
        await courtOpeningHoursPage.goto(createdCourt.id);
        await courtOpeningHoursPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('Court Opening Hours Validation Accessibility', async ({ axeUtils, courtOpeningHoursPage, playwright }) => {
      await withCreatedCourt(playwright, 'Opening Hours Accessibility Test', {}, async ({ createdCourt }) => {
        await courtOpeningHoursPage.gotoAdd(createdCourt.id);
        await courtOpeningHoursPage.save();
        await expect(courtOpeningHoursPage.mainContent.content).toContainText('There is a problem');
        await axeUtils.audit();
      });
    });

    test('Court Opening Hours Success Page Accessibility', async ({ axeUtils, courtOpeningHoursPage, playwright }) => {
      await withCreatedCourt(playwright, 'Opening Hours Accessibility Test', {}, async ({ createdCourt }) => {
        await courtOpeningHoursPage.gotoAdd(createdCourt.id);
        await courtOpeningHoursPage.selectOpeningHoursType('Court open');
        await courtOpeningHoursPage.selectSameTime();
        await courtOpeningHoursPage.fillSameOpeningTimes('9', '00', '17', '00');
        await courtOpeningHoursPage.save();
        await courtOpeningHoursPage.header.checkIsVisible();
        await axeUtils.audit();
      });
    });

    test('Local Authorities Page Accessibility', async ({ axeUtils, localAuthoritiesPage, playwright }) => {
      await withCreatedCourt(playwright, 'Local Authorities Accessibility Test', {}, async ({ createdCourt }) => {
        await localAuthoritiesPage.goto(createdCourt.id);
        await localAuthoritiesPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('Information for Professionals Page Accessibility', async ({
      axeUtils,
      playwright,
      professionalInformationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Information for Professionals Accessibility Test',
        {},
        async ({ createdCourt }) => {
          await professionalInformationPage.goto(createdCourt.id);
          await professionalInformationPage.expectVisibleElements();
          await axeUtils.audit();
        }
      );
    });

    test('Local Authorities Success Page Accessibility', async ({
      axeUtils,
      casesHeardPage,
      localAuthoritiesPage,
      playwright,
    }) => {
      await withCreatedCourt(
        playwright,
        'Local Authorities Accessibility Test',
        { forceFamilyCourt: true },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.selectAllCaseTypes();
          await casesHeardPage.save();
          await casesHeardPage.header.checkIsVisible();

          await localAuthoritiesPage.goto(createdCourt.id);
          await localAuthoritiesPage.expectVisibleElements();
          await localAuthoritiesPage.save();
          await localAuthoritiesPage.header.checkIsVisible();

          await axeUtils.audit();
        }
      );
    });

    test('Audit List Page Accessibility', async ({
      addCourtPage,
      auditListPage,
      axeUtils,
      courtAddressDeletePage,
      generalPage,
      page,
      playwright,
    }) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        page,
        playwright,
        prefixLabel: 'Audit Accessibility Test',
        run: async () => {
          await auditListPage.goto();
          await axeUtils.audit();
        },
      });
    });

    test('Audit Detail Page Accessibility', async ({
      addCourtPage,
      auditDetailPage,
      auditListPage,
      axeUtils,
      courtAddressDeletePage,
      generalPage,
      page,
      playwright,
    }) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        page,
        playwright,
        prefixLabel: 'Audit Detail Accessibility Test',
        run: async ({ courtId }) => {
          await auditListPage.goto();
          await auditListPage.filterByCourt(courtId);

          const detailHref = await auditListPage.getDetailsHrefForAction('DELETE');
          if (!detailHref) {
            throw new Error('Expected a details link for a DELETE audit row.');
          }

          await page.goto(config.urls.homePageUrl + detailHref);
          await auditDetailPage.expectVisibleElements();
          await axeUtils.audit();
        },
      });
    });

    test('Court Contact List Page Accessibility', async ({ axeUtils, courtContactDetailsPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact List Accessibility Test', {}, async ({ createdCourt }) => {
        await courtContactDetailsPage.goto(createdCourt.id);
        await courtContactDetailsPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('Court Contact Add Page Accessibility', async ({ axeUtils, courtContactDetailsPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Add Accessibility Test', {}, async ({ createdCourt }) => {
        await courtContactDetailsPage.gotoAdd(createdCourt.id);
        await courtContactDetailsPage.expectVisibleElements();
        await axeUtils.audit();
      });
    });

    test('Court Contact Edit Page Accessibility', async ({ axeUtils, courtContactDetailsPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Edit Accessibility Test', {}, async ({ createdCourt }) => {
        const uniqueSuffix = Date.now();
        const contactEmail = `a11y-contact-${uniqueSuffix}@example.test`;

        await courtContactDetailsPage.gotoAdd(createdCourt.id);
        await courtContactDetailsPage.selectFirstAvailableContactType();
        await courtContactDetailsPage.emailCheckbox.check();
        await courtContactDetailsPage.emailInput.fill(contactEmail);
        await courtContactDetailsPage.explanationInput.fill('Accessibility edit test contact');
        await courtContactDetailsPage.save();

        await expect(courtContactDetailsPage.successPanel).toContainText('Contact details added:');
        await courtContactDetailsPage.continueUpdatingLink.click();
        await courtContactDetailsPage.clickEditForRowText(contactEmail);

        await courtContactDetailsPage.expectVisibleElements();
        await expect(courtContactDetailsPage.heading).toContainText('Edit contact details');
        await axeUtils.audit();
      });
    });

    test('Court Contact Delete Page Accessibility', async ({ axeUtils, courtContactDetailsPage, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Delete Accessibility Test', {}, async ({ createdCourt }) => {
        const uniqueSuffix = Date.now();
        const contactEmail = `a11y-delete-${uniqueSuffix}@example.test`;

        await courtContactDetailsPage.gotoAdd(createdCourt.id);
        await courtContactDetailsPage.selectFirstAvailableContactType();
        await courtContactDetailsPage.emailCheckbox.check();
        await courtContactDetailsPage.emailInput.fill(contactEmail);
        await courtContactDetailsPage.explanationInput.fill('Accessibility delete test contact');
        await courtContactDetailsPage.save();

        await expect(courtContactDetailsPage.successPanel).toContainText('Contact details added:');
        await courtContactDetailsPage.continueUpdatingLink.click();
        await courtContactDetailsPage.clickDeleteForRowText(contactEmail);

        await courtContactDetailsPage.expectVisibleElements();
        await expect(courtContactDetailsPage.heading).toContainText(
          'Are you sure you want to delete these contact details?'
        );
        await axeUtils.audit();
      });
    });
  }
);
