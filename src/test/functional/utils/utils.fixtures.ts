import os from 'node:os';
import path from 'node:path';

import {
  ApiClient,
  ApiClientOptions,
  ApiLogEntry,
  AxeUtils,
  BrowserUtils,
  LighthouseUtils,
  LocaleUtils,
  SessionUtils,
  TableUtils,
  WaitUtils,
  createChildLogger,
  createLogger,
} from '@hmcts/playwright-common';
import { Page, TestInfo, chromium } from 'playwright/test';

import {
  ApiRecorder,
  buildApiAttachmentPayload,
  buildApiLogSummary,
  formatBytes,
  resolveApiAttachmentLimit,
  resolveApiLogStdoutLimit,
  resolveApiMaxFieldChars,
  resolveApiMaxLogs,
  resolveApiStdoutMode,
  resolveApiSummaryLimit,
  shouldAttachApiLogs,
  shouldEmitApiLogsToStdout,
  shouldIncludeRawBodies,
  truncateApiLogPayload,
} from './api-telemetry';
import { Config, config } from './config.utils';
import { CookieUtils } from './cookie.utils';
import { type SeedManifest, loadSeedManifest } from './seed-manifest';
import { ValidatorUtils } from './validator.utils';
import { type XsrfHeaderBuilder, buildXsrfHeaders } from './xsrf.utils';

type LoggerInstance = ReturnType<typeof createLogger>;

export type ApiClientFactory = (options: ApiClientOptions) => ApiClient;

/**
 * Helper: Attach API call logs to Playwright test report with annotations.
 */
function attachApiLogsToReport(recorder: ApiRecorder, testInfo: TestInfo, includeRawBodies: boolean): void {
  const stats = recorder.stats();
  const attachmentLimit = resolveApiAttachmentLimit(process.env);
  const attachment = buildApiAttachmentPayload(recorder, {
    includeRawBodies,
    limitBytes: attachmentLimit,
    summaryLimit: resolveApiSummaryLimit(process.env),
  });

  void testInfo.attach('api-calls.json', {
    body: attachment.payload,
    contentType: 'application/json',
  });

  const annotations: string[] = [];
  if (attachment.note) {
    annotations.push(attachment.note);
  }
  if (stats.droppedEntries > 0) {
    annotations.push(
      `${stats.droppedEntries} API entr${
        stats.droppedEntries === 1 ? 'y was' : 'ies were'
      } dropped after exceeding PW_ODHIN_API_MAX_LOGS.`
    );
  }
  if (stats.trimmedFields > 0) {
    annotations.push(
      `${stats.trimmedFields} API field${
        stats.trimmedFields === 1 ? '' : 's'
      } were truncated to respect PW_ODHIN_API_MAX_FIELD_CHARS.`
    );
  }

  for (const note of annotations) {
    testInfo.annotations.push({
      type: 'info',
      description: note,
    });
  }
}

/**
 * Helper: Emit API call logs to stdout in summary or full mode.
 */
function emitApiLogsToStdout(recorder: ApiRecorder, testInfo: TestInfo, includeRawBodies: boolean): void {
  const header = `[API CALLS][${testInfo.project.name}] ${testInfo.title}`;
  const stdoutMode = resolveApiStdoutMode(process.env);
  const logLines = [header];

  if (stdoutMode === 'summary') {
    const { summary, truncated } = buildApiLogSummary(recorder.toArray(), resolveApiSummaryLimit(process.env));
    logLines.push(summary);
    if (truncated > 0) {
      const noun = truncated === 1 ? 'entry' : 'entries';
      logLines.push(
        `[API CALLS][TRUNCATED] ${truncated} ${noun} omitted from stdout. Review the attached api-calls.json for full details or raise PW_ODHIN_API_SUMMARY_LINES.`
      );
    }
  } else {
    const payload = recorder.toJson(includeRawBodies);
    const limitBytes = resolveApiLogStdoutLimit(process.env);
    const { payload: truncatedPayload, truncatedBytes } = truncateApiLogPayload(payload, limitBytes);
    logLines.push(truncatedPayload);
    if (truncatedBytes > 0) {
      logLines.push(
        `[API CALLS][TRUNCATED] ${formatBytes(
          truncatedBytes
        )} omitted. Increase PW_ODHIN_API_STDOUT_KB or inspect api-calls.json.`
      );
    }
  }

  logLines.push('[API CALLS][END]');
  console.log(logLines.filter(Boolean).join('\n'));
}

export interface UtilsFixtures {
  config: Config;
  cookieUtils: CookieUtils;
  validatorUtils: ValidatorUtils;
  waitUtils: WaitUtils;
  tableUtils: TableUtils;
  axeUtils: AxeUtils;
  SessionUtils: typeof SessionUtils;
  browserUtils: BrowserUtils;
  lighthouseUtils: LighthouseUtils;
  lighthousePage: Page;
  localeUtils: LocaleUtils;
  logger: LoggerInstance;
  apiRecorder: ApiRecorder;
  createApiClient: ApiClientFactory;
  xsrfHeaders: XsrfHeaderBuilder;
}

export interface UtilsWorkerFixtures {
  seedManifest: SeedManifest;
}

export const utilsFixtures = {
  /**
   * Winston logger instance configured for test execution.
   * Test-scoped: creates a new logger for each test with test metadata.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  logger: async ({}, use, testInfo): Promise<void> => {
    const logger = createLogger({
      serviceName: 'fact-admin-frontend',
      defaultMeta: {
        testId: `${testInfo.project.name}::${testInfo.title}`,
      },
    });
    await use(logger);
  },
  /**
   * Records API calls for attachment to Playwright reports.
   * Test-scoped: captures all API calls during test execution.
   *
   * @remarks
   * Behaviour controlled by environment variables:
   * - `PLAYWRIGHT_ATTACH_API_LOGS`: attach logs to test report (default: failed tests only)
   * - `PLAYWRIGHT_STDOUT_API_LOGS`: emit logs to stdout
   * - `PLAYWRIGHT_API_MAX_LOGS`: max entries to record before dropping (default: 100)
   * - `PLAYWRIGHT_API_MAX_FIELD_CHARS`: max characters per field before truncation (default: 2000)
   * - `PLAYWRIGHT_DEBUG_API`: include raw request/response bodies (default: false, use only for local debugging)
   * - `PW_ODHIN_API_SUMMARY_LINES`: max lines in stdout summary mode (default: 50)
   * - `PW_ODHIN_API_STDOUT_KB`: max KB for stdout full mode (default: 100)
   *
   * @see {@link resolveApiMaxLogs} for defaults
   * @see {@link shouldAttachApiLogs} for attachment logic
   * @see {@link shouldIncludeRawBodies} for security controls
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  apiRecorder: async ({}, use, testInfo): Promise<void> => {
    const includeRawBodies = shouldIncludeRawBodies(process.env);
    const recorder = new ApiRecorder(includeRawBodies, {
      maxEntries: resolveApiMaxLogs(process.env),
      maxFieldChars: resolveApiMaxFieldChars(process.env),
    });
    await use(recorder);

    if (!recorder.hasEntries()) {
      return;
    }

    const attachLogs = shouldAttachApiLogs(process.env) && testInfo.status === 'failed';

    if (attachLogs) {
      attachApiLogsToReport(recorder, testInfo, includeRawBodies);
    }

    if (shouldEmitApiLogsToStdout(process.env, testInfo.project.name)) {
      emitApiLogsToStdout(recorder, testInfo, includeRawBodies);
    }

    recorder.clear();
  },
  /**
   * Builder function for XSRF headers from session files.
   * Test-scoped: provides fresh header builder for each test.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  xsrfHeaders: async ({}, use): Promise<void> => {
    await use(buildXsrfHeaders);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  createApiClient: async ({ logger, apiRecorder }, use, testInfo): Promise<void> => {
    const clients: ApiClient[] = [];
    await use(options => {
      const clientLogger = createChildLogger(logger, {
        testId: `${testInfo.project.name}::${testInfo.title}`,
        apiName: options.name ?? 'api-client',
      });
      const client = new ApiClient({
        logger: clientLogger,
        captureRawBodies: apiRecorder.includeRawBodies,
        onResponse: (entry: ApiLogEntry) => apiRecorder.record(entry),
        ...options,
      });
      clients.push(client);
      return client;
    });

    await Promise.all(clients.map(client => client.dispose()));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  config: async ({}, use): Promise<void> => {
    await use(config);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  cookieUtils: async ({}, use): Promise<void> => {
    await use(new CookieUtils());
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  waitUtils: async ({}, use): Promise<void> => {
    await use(new WaitUtils());
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  tableUtils: async ({}, use): Promise<void> => {
    await use(new TableUtils());
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  validatorUtils: async ({}, use): Promise<void> => {
    await use(new ValidatorUtils());
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  lighthouseUtils: async ({ lighthousePage, lighthousePort }, use): Promise<void> => {
    await use(new LighthouseUtils(lighthousePage, lighthousePort));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  axeUtils: async ({ page }, use, testInfo): Promise<void> => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
    await axeUtils.generateReport(testInfo);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, no-empty-pattern
  SessionUtils: async ({}, use): Promise<void> => {
    await use(SessionUtils);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  browserUtils: async ({ browser }, use): Promise<void> => {
    await use(new BrowserUtils(browser));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  localeUtils: async ({ page }, use): Promise<void> => {
    await use(new LocaleUtils(page));
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-shadow
  lighthousePage: async ({ lighthousePort, page, SessionUtils, logger }, use, testInfo): Promise<void> => {
    // TODO: FACT-2582: look at whether we need this
    // Prevent creating performance page if not needed
    if (testInfo.tags.includes('@performance')) {
      // Lighthouse opens a new page and as playwright doesn't share context we need to
      // explicitly create a new browser with shared context
      const userDataDir = path.join(os.tmpdir(), 'pw', String(Math.random()));
      const context = await chromium.launchPersistentContext(userDataDir, {
        args: [`--remote-debugging-port=${lighthousePort}`],
      });
      // Using the cookies from global setup, inject to the new browser
      try {
        await context.addCookies(SessionUtils.getCookies(config.users.admin.sessionFile));
      } catch {
        logger.warn('Failed to add cookies to Lighthouse browser context');
      }
      // Provide the page to the test
      await use(context.pages()[0]);
      await context.close();
    } else {
      await use(page);
    }
  },
};

export const utilsWorkerFixtures = {
  /**
   * Loads seed manifest containing deterministic test data IDs.
   * Worker-scoped: loaded once per worker process.
   * Fails fast if manifest is missing or invalid.
   */
  seedManifest: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use: (manifest: SeedManifest) => Promise<void>): Promise<void> => {
      const manifest = loadSeedManifest();
      await use(manifest);
    },
    { scope: 'worker' },
  ] as [(fixtures: object, use: (manifest: SeedManifest) => Promise<void>) => Promise<void>, { scope: 'worker' }],
};
