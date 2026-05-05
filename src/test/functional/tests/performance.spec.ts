import { test } from '../fixtures';

const LIGHTHOUSE_THRESHOLDS = {
  accessibility: 100,
  'best-practices': 100,
  performance: 80,
} as const;

test.describe('Performance Tests', () => {
  test(
    'Home Page Performance',
    {
      tag: '@performance',
    },
    async ({ homePage, lighthouseUtils }) => {
      await homePage.header.checkIsVisible();
      await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
    }
  );
});
