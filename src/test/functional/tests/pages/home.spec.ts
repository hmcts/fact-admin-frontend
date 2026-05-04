import { expect, test } from '../../fixtures';

test.describe('Home Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ homePage }) => {
      await expect(homePage.heading).toContainText('Courts and tribunals');
    }
  );

  test('visibility test', async ({ homePage }) => {
    await homePage.expectVisibleElements();
    await expect(homePage.heading).toContainText('Courts and tribunals');
    await homePage.header.expectNavigationLink('Courts');
    await homePage.header.expectNavigationLink('Download csv');
    await homePage.header.expectNavigationLink('Add new court');
    await homePage.header.expectNavigationLink('Audit');
    await homePage.header.expectNavigationLink('Users');
  });
});
