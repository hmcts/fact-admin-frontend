import { expect, test } from '../fixtures';
import { seedAuditTrailViaUi } from '../helpers/auditTestSupport';
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
      const breadcrumb = addCourtPage.page.getByLabel('Breadcrumb');
      await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
    });

    test('Court Edit Page Performance', async ({ courtEditPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Court Edit Performance Test', {}, async ({ createdCourt }) => {
        await courtEditPage.goto(createdCourt.id);
        const breadcrumb = courtEditPage.page.getByLabel('Breadcrumb');

        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb).toContainText(createdCourt.name);
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Accessibility Page Performance', async ({ accessibilityPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Accessibility Performance Test', {}, async ({ createdCourt }) => {
        await accessibilityPage.goto(createdCourt.id);
        const breadcrumb = accessibilityPage.page.getByLabel('Breadcrumb');

        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Building Facilities Page Performance', async ({ buildingFacilitiesPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Building Facilities Performance Test', {}, async ({ createdCourt }) => {
        await buildingFacilitiesPage.goto(createdCourt.id);
        const breadcrumb = buildingFacilitiesPage.page.getByLabel('Breadcrumb');

        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Add Service Centre Page Performance', async ({ addServiceCentrePage, lighthouseUtils }) => {
      await addServiceCentrePage.goto();
      await addServiceCentrePage.header.checkIsVisible();
      await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
    });

    test('Cases Heard Page Performance', async ({ casesHeardPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Cases Heard Performance Test', {}, async ({ createdCourt }) => {
        await casesHeardPage.goto(createdCourt.id);
        await casesHeardPage.header.checkIsVisible();
        const breadcrumb = casesHeardPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Translation and Interpretation Page Performance', async ({
      lighthouseUtils,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Performance Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.header.checkIsVisible();
          const breadcrumb = translationAndInterpretationPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit`
          );
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Address List Page Performance', async ({ lighthouseUtils, playwright, courtAddressListPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Performance Test',
        { withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressListPage.goto(createdCourt.id);
          await courtAddressListPage.header.checkIsVisible();
          const breadcrumb = courtAddressListPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit`
          );
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Court Opening Hours Page Performance', async ({ courtOpeningHoursPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Opening Hours Performance Test', {}, async ({ createdCourt }) => {
        await courtOpeningHoursPage.goto(createdCourt.id);
        const breadcrumb = courtOpeningHoursPage.page.getByLabel('Breadcrumb');

        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Address Find Page Performance', async ({ lighthouseUtils, playwright, courtAddressFindPage }) => {
      await withCreatedCourt(
        playwright,
        'Address Edit Performance Test',
        { withTranslations: false },
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
        { withTranslations: false },
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
        await withCreatedCourt(playwright, 'General Performance Test', {}, async ({ createdCourt }) => {
          await generalPage.goto(createdCourt.id);
          await generalPage.header.checkIsVisible();
          const breadcrumb = generalPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        });
      }
    );

    test('General Breadcrumb Performance', async ({ generalPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'General Performance Test', {}, async ({ createdCourt }) => {
        await generalPage.goto(createdCourt.id);
        const breadcrumb = generalPage.page.getByLabel('Breadcrumb');

        await expect(breadcrumb).toBeVisible();
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Information for Professionals Page Performance', async ({
      lighthouseUtils,
      playwright,
      professionalInformationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Information for Professionals Performance Test',
        {},
        async ({ createdCourt }) => {
          await professionalInformationPage.goto(createdCourt.id);
          await professionalInformationPage.header.checkIsVisible();
          const breadcrumb = professionalInformationPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit`
          );
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
        { forceFamilyCourt: true },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.selectAllCaseTypes();
          await casesHeardPage.save();
          await casesHeardPage.header.checkIsVisible();

          await localAuthoritiesPage.goto(createdCourt.id);
          await localAuthoritiesPage.expectVisibleElements();
          const breadcrumb = localAuthoritiesPage.page.getByLabel('Breadcrumb');
          await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
          await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
            'href',
            `/courts/${createdCourt.id}/edit`
          );
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    });

    test('Single Points of Entry Page Performance', async ({
      lighthouseUtils,
      playwright,
      singlePointsOfEntryPage,
    }) => {
      await withCreatedCourt(playwright, 'Single Points Of Entry Performance Test', {}, async ({ createdCourt }) => {
        await singlePointsOfEntryPage.goto(createdCourt.id);
        await singlePointsOfEntryPage.header.checkIsVisible();
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Audit List Page Performance', async ({
      addCourtPage,
      auditListPage,
      courtAddressDeletePage,
      generalPage,
      lighthouseUtils,
      page,
      playwright,
    }) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        includeDelete: false,
        page,
        playwright,
        prefixLabel: 'Audit Performance Test',
        run: async ({ courtId }) => {
          await auditListPage.goto();
          await auditListPage.filterByCourt(courtId);
          await auditListPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        },
      });
    });

    test('Audit Detail Page Performance', async ({
      addCourtPage,
      auditListPage,
      courtAddressDeletePage,
      generalPage,
      lighthouseUtils,
      page,
      playwright,
    }) => {
      await seedAuditTrailViaUi({
        addCourtPage,
        courtAddressDeletePage,
        generalPage,
        includeDelete: false,
        page,
        playwright,
        prefixLabel: 'Audit Detail Performance Test',
        run: async ({ courtId }) => {
          await auditListPage.goto();
          await auditListPage.filterByCourt(courtId);

          const detailHref = await auditListPage.getDetailsHrefForAction('UPDATE');
          if (!detailHref) {
            throw new Error('Expected a details link for an UPDATE audit row.');
          }

          await page.goto(config.urls.homePageUrl + detailHref);
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        },
      });
    });

    test('Court Contact List Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact List Performance Test', {}, async ({ createdCourt }) => {
        await courtContactDetailsPage.goto(createdCourt.id);
        await courtContactDetailsPage.header.checkIsVisible();
        const breadcrumb = courtContactDetailsPage.page.getByLabel('Breadcrumb');
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
        await expect(breadcrumb.getByRole('link', { name: createdCourt.name })).toHaveAttribute(
          'href',
          `/courts/${createdCourt.id}/edit`
        );
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Court Contact Add Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Add Performance Test', {}, async ({ createdCourt }) => {
        await courtContactDetailsPage.gotoAdd(createdCourt.id);
        await courtContactDetailsPage.header.checkIsVisible();
        await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
      });
    });

    test('Court Contact Edit Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Edit Performance Test', {}, async ({ createdCourt }) => {
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
      });
    });

    test('Court Contact Delete Page Performance', async ({ courtContactDetailsPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(playwright, 'Court Contact Delete Performance Test', {}, async ({ createdCourt }) => {
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
      });
    });
  }
);
