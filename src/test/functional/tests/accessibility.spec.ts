import { test } from '../fixtures';
import { withCreatedCourt } from '../helpers/testSupport';

test.describe('Accessibility Tests', () => {
  test(
    'Home Page Accessibility',
    {
      tag: '@a11y',
    },
    async ({ homePage, axeUtils }) => {
      await homePage.expectVisibleElements();
      await axeUtils.audit();
    }
  );

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

  test('Court Not Found Page Accessibility', async ({ axeUtils, courtEditPage }) => {
    await courtEditPage.goto('not-a-uuid');
    await courtEditPage.expectVisibleElements();
    await axeUtils.audit();
  });
});
