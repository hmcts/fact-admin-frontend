import { expect, test } from '../../fixtures';

test.describe('Court Edit Page Tests', () => {
  // FIXME: court-edit page is not currently present, so we are assuming a 404 for now
  test('visibility test (expect 404 until implemented)', async ({ courtEditPage }) => {
    await courtEditPage.goto('imaginary-court');
    await courtEditPage.expectVisibleElements();
    await expect(courtEditPage.heading).toContainText('Page Not Found');
  });
});
