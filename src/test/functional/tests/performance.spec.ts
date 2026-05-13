import { test } from '../fixtures';
import { withCreatedCourt } from '../helpers/testSupport';

const LIGHTHOUSE_THRESHOLDS = {
  accessibility: 100,
  'best-practices': 100,
  performance: 80,
} as const;

test.describe('Performance Tests', () => {
  test.describe.configure({ mode: 'serial' });

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
    'Translation and Interpretation Page Performance',
    {
      tag: '@performance',
    },
    async ({ lighthouseUtils, playwright, translationAndInterpretationPage }) => {
      await withCreatedCourt(
        playwright,
        'Translation Performance Test',
        { serviceCenter: false, withTranslations: false },
        async ({ createdCourt }) => {
          await translationAndInterpretationPage.goto(createdCourt.id);
          await translationAndInterpretationPage.header.checkIsVisible();
          await lighthouseUtils.audit(LIGHTHOUSE_THRESHOLDS);
        }
      );
    }
  );
});
