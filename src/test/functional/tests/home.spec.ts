import { test } from '@playwright/test';

import { HomePage } from '../page-objects/HomePage';

test.describe('Homepage', () => {
  test('should load and display correct content @smoke', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectToBeLoaded();
  });
});
