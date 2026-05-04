import { expect, test } from '../../fixtures';

test.describe('Court Edit Page Tests', () => {
  test('visibility test', async ({ courtEditPage }) => {
    await courtEditPage.goto('11111111-1111-4111-8111-111111111111');
    await courtEditPage.expectVisibleElements();
    await expect(courtEditPage.heading).toContainText('Editing - Reading Crown Court');
    await expect(courtEditPage.mainContent.content).toContainText('Accessibility');
    await expect(courtEditPage.mainContent.content).toContainText('Information for professionals');
    await expect(courtEditPage.mainContent.content).toContainText('TODO');
  });
});
