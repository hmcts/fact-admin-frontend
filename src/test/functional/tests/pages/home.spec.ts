import { expect, test } from '../../fixtures';
import { PageSection } from '../../page-objects/pages';

test.describe('Home Page Tests', () => {
  test(
    'smoke test',
    {
      tag: '@smoke',
    },
    async ({ homePage }) => {
      await expect(homePage.heading).toContainText('Default Page Template');
    }
  );

  test('visibility test', async ({ homePage }) => {
    await homePage.expectVisibleElements();
    await expect(homePage.heading).toContainText('Default Page Template');
    await homePage.header.expectNavigationLink('Courts');
    await homePage.header.expectNavigationLink('Download csv');
    await homePage.header.expectNavigationLink('Add new court');
    await homePage.header.expectNavigationLink('Audit');
    await homePage.header.expectNavigationLink('Users');
    // FIXME: This is currently not implemented, so we're expecting a not found
    await homePage.gotoSection(PageSection.COURTS);
    await expect(homePage.heading).toContainText('Page Not Found');
  });
});
