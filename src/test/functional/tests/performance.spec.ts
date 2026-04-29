import { test } from '../fixtures';

test.describe('Performance Tests', () => {
  test(
    'Home Page Performance',
    {
      tag: '@performance',
    },
    async ({ homePage, lighthouseUtils }) => {
      await homePage.header.checkIsVisible();
      await lighthouseUtils.audit();
    }
  );
});
