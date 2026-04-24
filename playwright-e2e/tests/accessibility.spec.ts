import { test } from '../fixtures';

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
});
