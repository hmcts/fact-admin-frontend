import { test } from '../fixtures';
import { withCreatedCourt } from '../helpers/testSupport';
import { config } from '../utils';

const LIGHTHOUSE_THRESHOLDS = {
  accessibility: 100,
  'best-practices': 100,
  performance: 80,
} as const;

test.describe('Performance Tests', () => {
  test.use({ storageState: config.users.superAdmin.sessionFile });

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

  test(
    'Cases Heard Page Performance',
    {
      tag: '@performance',
    },
    async ({ casesHeardPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'Cases Heard Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await casesHeardPage.goto(createdCourt.id);
          await casesHeardPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    }
  );

  test(
    'General Page Performance',
    {
      tag: '@performance',
    },
    async ({ generalPage, lighthouseUtils, playwright }) => {
      await withCreatedCourt(
        playwright,
        'General Performance Test',
        { serviceCenter: false },
        async ({ createdCourt }) => {
          await generalPage.goto(createdCourt.id);
          await generalPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    }
  );
});
