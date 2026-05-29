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
  }
);
