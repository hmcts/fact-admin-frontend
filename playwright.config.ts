import { CommonConfig, ProjectsConfig } from '@hmcts/playwright-common';
import { defineConfig, ReporterDescription } from '@playwright/test';
import { cpus } from 'node:os';
const { version: appVersion, name: appName } = require('./package.json') as { version: string; name: string };
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config({ quiet: true });

// Helper to safely serialize config (removes functions and unserializable values)
function safeSerialize(obj: any, depth = 0) {
  if (depth > 6) return '[MaxDepth]';
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => safeSerialize(item, depth + 1));
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'function') continue;
    try {
      result[key] = safeSerialize(value, depth + 1);
    } catch {
      result[key] = '[Unserializable]';
    }
  }
  return result;
}

const TRUTHY_FLAGS = new Set(['1', 'true', 'yes', 'on', 'all']);
const FALSY_FLAGS = new Set(['0', 'false', 'no', 'off']);

const resolveDefaultReporterNames = () => {
  const override = process.env.PLAYWRIGHT_DEFAULT_REPORTER;
  if (override?.trim()) {
    return override
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);
  }
  return [process.env.CI ? 'dot' : 'list'];
};

const safeBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue;
  const normalised = value.trim().toLowerCase();
  if (TRUTHY_FLAGS.has(normalised)) return true;
  if (FALSY_FLAGS.has(normalised)) return false;
  return defaultValue;
};

const resolveOdhinTestOutput = (): boolean | 'only-on-failure' => {
  const configured = process.env.PW_ODHIN_TEST_OUTPUT;
  if (configured?.trim()) {
    const normalised = configured.trim().toLowerCase();
    if (normalised === 'only-on-failure') {
      return 'only-on-failure';
    }
    if (TRUTHY_FLAGS.has(normalised)) {
      return true;
    }
    if (FALSY_FLAGS.has(normalised)) {
      return false;
    }
  }

  return 'only-on-failure';
};

const resolveWorkerCount = () => {
  const configured = process.env.PLAYWRIGHT_WORKERS;
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const logical = cpus()?.length ?? 1;
  if (process.env.CI) {
    return 1;
  }
  if (logical <= 2) return 1;
  const approxPhysical = Math.max(1, Math.round(logical / 2));
  return Math.min(8, Math.max(2, approxPhysical));
};

const resolveReporters = (): ReporterDescription[] => {
  const configured = process.env.PLAYWRIGHT_REPORTERS?.split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const reporterNames = configured?.length ? configured : resolveDefaultReporterNames();
  const normalizedNames = new Set(reporterNames.map(name => name.toLowerCase()));
  const shouldEmitHtmlLinks = normalizedNames.has('html');
  const shouldEmitOdhinLinks = normalizedNames.has('odhin') || normalizedNames.has('odhin-reports-playwright');
  const reporters: ReporterDescription[] = [];

  for (const name of reporterNames) {
    const normalised = name.toLowerCase();
    switch (normalised) {
      case 'list':
        reporters.push(['list']);
        break;
      case 'dot':
        reporters.push(['dot']);
        break;
      case 'html':
        reporters.push([
          'html',
          {
            open: process.env.PLAYWRIGHT_HTML_OPEN ?? 'never',
            outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT ?? 'playwright-report',
          },
        ]);
        break;
      case 'line':
        reporters.push(['line']);
        break;
      case 'junit':
        reporters.push([
          'junit',
          {
            outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT ?? 'playwright-junit.xml',
          },
        ]);
        break;
      case 'odhin':
      case 'odhin-reports-playwright':
        reporters.push([
          'odhin-reports-playwright',
          {
            outputFolder: process.env.PW_ODHIN_OUTPUT ?? './test-results/odhin-report',
            indexFilename: process.env.PW_ODHIN_INDEX ?? 'index.html',
            title: process.env.PW_ODHIN_TITLE ?? `${appName} Playwright`,
            testEnvironment:
              process.env.PW_ODHIN_ENV ??
              `${process.env.TEST_ENVIRONMENT ?? (process.env.CI ? 'ci' : 'local')} | workers=${resolveWorkerCount()}`,
            project: process.env.PW_ODHIN_PROJECT ?? appName,
            release: process.env.PW_ODHIN_RELEASE ?? `${appVersion} | branch=${process.env.GIT_BRANCH ?? 'local'}`,
            testFolder: process.env.PW_ODHIN_TEST_FOLDER ?? './src/test/functional',
            startServer: safeBoolean(process.env.PW_ODHIN_START_SERVER, false),
            consoleLog: safeBoolean(process.env.PW_ODHIN_CONSOLE_LOG, false),
            consoleError: safeBoolean(process.env.PW_ODHIN_CONSOLE_ERROR, true),
            consoleTestOutput: safeBoolean(process.env.PW_ODHIN_TEST_CONSOLE_OUTPUT, false),
            testOutput: resolveOdhinTestOutput(),
          },
        ]);
        break;
      default:
        reporters.push([name]);
        break;
    }
  }

  if (shouldEmitHtmlLinks || shouldEmitOdhinLinks) {
    reporters.push([
      './scripts/report-links-reporter.mjs',
      {
        emitHtml: shouldEmitHtmlLinks,
        emitOdhin: shouldEmitOdhinLinks,
        htmlOutput: process.env.PLAYWRIGHT_HTML_OUTPUT ?? 'playwright-report',
        htmlIndex: 'index.html',
        odhinOutput: process.env.PW_ODHIN_OUTPUT ?? './test-results/odhin-report',
        odhinIndex: process.env.PW_ODHIN_INDEX ?? 'index.html',
      },
    ]);
  }

  return reporters;
};

const resolveVideoMode = (): 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' => {
  const configured = process.env.PLAYWRIGHT_VIDEO_MODE?.trim().toLowerCase();
  switch (configured) {
    case 'on':
    case 'retain-on-failure':
    case 'on-first-retry':
      return configured;
    case 'true':
    case '1':
      return 'retain-on-failure';
    default:
      return 'off';
  }
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config = defineConfig({
  testDir: './src/test/functional',
  snapshotDir: './src/test/functional/snapshots',
  ...CommonConfig.recommended,
  reporter: resolveReporters(),
  workers: resolveWorkerCount(),
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: resolveVideoMode(),
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      ...ProjectsConfig.chrome,
      dependencies: ['setup'],
    },
    {
      ...ProjectsConfig.edge,
      dependencies: ['setup'],
    },
    {
      ...ProjectsConfig.firefox,
      dependencies: ['setup'],
    },
    {
      ...ProjectsConfig.webkit,
      dependencies: ['setup'],
    },
  ],
});

if (safeBoolean(process.env.PW_DUMP_CONFIG, false)) {
  console.log('[playwright.config.ts] Loaded configuration:', JSON.stringify(safeSerialize(config), null, 2));
}

export default config;
