import { Browser, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { type UserDetails, config, loginAs, logout } from '../utils';

test.describe(
  'Authentication Tests',
  {
    tag: '@functional',
  },
  () => {
    async function withLoggedOutPage(browser: Browser, run: (page: Page) => Promise<void>): Promise<void> {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();

      try {
        await run(page);
      } finally {
        await context.close();
      }
    }

    async function expectCanLogin(browser: Browser, user: UserDetails): Promise<void> {
      await withLoggedOutPage(browser, async page => {
        await loginAs(page, user);
        await expect(page.getByRole('heading', { name: 'Courts and tribunals' })).toBeVisible();
      });
    }

    async function expectCanLogout(browser: Browser, user: UserDetails): Promise<void> {
      await withLoggedOutPage(browser, async page => {
        await loginAs(page, user);
        await logout(page);
        await page.goto(config.urls.homePageUrl);
        await expect(page.getByRole('link', { name: /sign out/i })).toHaveCount(0);
        await expect(page).not.toHaveURL(config.urls.homePageUrl);
      });
    }

    test('admin can log in', async ({ browser }) => {
      await expectCanLogin(browser, config.users.admin);
    });

    test('admin can log out', async ({ browser }) => {
      await expectCanLogout(browser, config.users.admin);
    });

    test('super admin can log in', async ({ browser }) => {
      await expectCanLogin(browser, config.users.superAdmin);
    });

    test('super admin can log out', async ({ browser }) => {
      await expectCanLogout(browser, config.users.superAdmin);
    });
  }
);
