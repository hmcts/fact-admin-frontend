import { APIRequestContext } from '@playwright/test';

import {
  type CreatedCourt,
  type TestCourtParams,
  createTestCourt,
  createTestingSupportApiContext,
  deleteTestCourtsByNamePrefix,
} from './courtTestData';

type PlaywrightLike = Parameters<typeof createTestingSupportApiContext>[0];
export const TEST_COURT_PREFIX = 'FaCTAdminTest';

export type TestCourtSupportContext = {
  apiContext: APIRequestContext;
  courtNamePrefix: string;
};

export type CreatedCourtSupportContext = TestCourtSupportContext & {
  createdCourt: CreatedCourt;
};

export function generateRandomSuffix(length = 8): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';

  return Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
}

export async function withTestCourtPrefix(
  playwright: PlaywrightLike,
  prefixLabel: string,
  run: (context: TestCourtSupportContext) => Promise<void>
): Promise<void> {
  const apiContext = await createTestingSupportApiContext(playwright);
  const courtNamePrefix = `${TEST_COURT_PREFIX} ${prefixLabel} ${generateRandomSuffix()}`;

  try {
    await deleteTestCourtsByNamePrefix(apiContext, courtNamePrefix);
    await run({ apiContext, courtNamePrefix });
  } finally {
    await deleteTestCourtsByNamePrefix(apiContext, courtNamePrefix);
    await apiContext.dispose();
  }
}

export async function withCreatedCourt(
  playwright: PlaywrightLike,
  prefixLabel: string,
  courtParams: Omit<TestCourtParams, 'courtName'>,
  run: (context: CreatedCourtSupportContext) => Promise<void>
): Promise<void> {
  await withTestCourtPrefix(playwright, prefixLabel, async ({ apiContext, courtNamePrefix }) => {
    const createdCourt = await createTestCourt(apiContext, {
      ...courtParams,
      courtName: courtNamePrefix,
    });

    await run({ apiContext, courtNamePrefix, createdCourt });
  });
}
