import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test',
  testIgnore: ['**/unit/**', '**/routes/**', '**/smoke/**'],
  testMatch: ['**/functional/**/*.spec.ts', '**/a11y/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 3,

  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: process.env.TEST_URL || 'https://localhost:3355',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
