import { test } from '../fixtures';
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

    test('Court Edit Page Accessibility', async ({ axeUtils, courtEditPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Court Edit Accessibility Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await courtEditPage.goto(createdCourt.id);
          await courtEditPage.expectVisibleElements();
          await axeUtils.audit();
        }
      );
    });

    test('Cases Heard Page Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Accessibility Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.expectVisibleElements();
          await axeUtils.audit();
        }
      );
    });

    test('Cases Heard Validation Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Accessibility Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.clearSelectedCaseTypes();
          await casesHeardPage.save();
          await axeUtils.audit();
        }
      );
    });

    test('Cases Heard Success Page Accessibility', async ({ axeUtils, casesHeardPage, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Accessibility Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.selectFirstCaseType();
          await casesHeardPage.save();
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
        { serviceCenter: false, withTranslations: false },
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
        { serviceCenter: false, withTranslations: false },
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
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await courtAddressSelectPage.goto(createdCourt.id, 'SW1A 1AA');
          await courtAddressSelectPage.header.checkIsVisible();
          await axeUtils.audit();
        }
      );
    });
  }
);
