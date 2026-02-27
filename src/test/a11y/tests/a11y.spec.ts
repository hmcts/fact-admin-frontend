import { expect, test } from '@playwright/test';

import { HomePage } from '../../functional/page-objects/HomePage';
import { getAccessibilityViolations } from '../utils/accessibility';

test.describe('Homepage Accessibility', () => {
  test('should be accessible @a11y', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const violations = await getAccessibilityViolations(page);

    expect(violations).toEqual([]);
  });
});
