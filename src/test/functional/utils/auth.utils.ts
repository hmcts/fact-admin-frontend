import fs from 'node:fs';
import path from 'node:path';

import { type Page, expect } from '@playwright/test';

import { type UserDetails, config } from './config.utils';

const APP_SESSION_COOKIE = 'appSession';

export async function loginAs(page: Page, user: UserDetails): Promise<void> {
  await page.goto(config.urls.homePageUrl);

  if (
    await page
      .getByRole('link', { name: /sign out/i })
      .isVisible()
      .catch(() => false)
  ) {
    return;
  }

  await page.locator('input[type="email"], input[name="loginfmt"]').first().fill(user.email);
  await submitMicrosoftForm(page, /next/i);

  await page.locator('input[type="password"], input[name="passwd"]').first().fill(user.password);
  await submitMicrosoftForm(page, /sign in/i);

  await answerStaySignedInPrompt(page);

  const appUrl = new URL(config.urls.homePageUrl);
  await page.waitForURL(url => url.origin === appUrl.origin && !url.pathname.startsWith('/sso/'), {
    timeout: 60_000,
  });
  await expect(page.getByRole('link', { name: /sign out/i })).toBeVisible();
}

export async function createSession(page: Page, user: UserDetails): Promise<void> {
  if (isSessionFileCurrent(user.sessionFile)) {
    return;
  }

  await loginAs(page, user);
  fs.mkdirSync(path.dirname(user.sessionFile), { recursive: true });
  await page.context().storageState({ path: user.sessionFile });
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('link', { name: /sign out/i }).click();
  await expect(page.getByRole('link', { name: /sign out/i })).toHaveCount(0);
}

function isSessionFileCurrent(sessionFile: string): boolean {
  try {
    const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const cookies = Array.isArray(data?.cookies) ? data.cookies : [];
    const appSession = cookies.find(
      (cookie: { name?: string; expires?: number }) => cookie.name === APP_SESSION_COOKIE
    );

    if (!appSession || typeof appSession.expires !== 'number') {
      return false;
    }

    return appSession.expires * 1_000 - Date.now() > 2 * 60 * 60 * 1_000;
  } catch {
    return false;
  }
}

async function submitMicrosoftForm(page: Page, name: RegExp): Promise<void> {
  const button = page.getByRole('button', { name }).first();

  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return;
  }

  await page.locator('input[type="submit"]').first().click();
}

async function answerStaySignedInPrompt(page: Page): Promise<void> {
  const noButton = page.getByRole('button', { name: /^no$/i }).first();

  try {
    await noButton.waitFor({ state: 'visible', timeout: 5_000 });
    await noButton.click();
  } catch {
    // The prompt is tenant-dependent and does not always appear.
  }
}
