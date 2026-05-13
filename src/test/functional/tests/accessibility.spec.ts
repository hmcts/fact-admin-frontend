import { test } from '../fixtures';
import { withCreatedCourt } from '../helpers/testSupport';

test.describe(
  'Accessibility Tests',
  {
    tag: '@a11y',
  },
  () => {
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

    test('Translation and Interpretation Page Accessibility', async ({
      axeUtils,
      playwright,
      translationAndInterpretationPage,
    }) => {
      await withCreatedCourt(
        playwright,
        'Translation Accessibility Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.expectVisibleElements();
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
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.emailCheckbox.check();
          await translationAndInterpretationPage.phoneNumberCheckbox.check();
          await translationAndInterpretationPage.save();
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
