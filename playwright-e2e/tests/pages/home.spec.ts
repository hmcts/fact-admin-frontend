import { expect, test } from '../../fixtures';

test.describe('HomePage Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ homePage }) => {
      await homePage.heading.checkIsVisible();
      await expect(homePage.heading.heading).toContainText('Default Page Template');
    }
  );

  test('visibility test', async ({ homePage }) => {
    await homePage.expectVisibleElements();
  });
});
