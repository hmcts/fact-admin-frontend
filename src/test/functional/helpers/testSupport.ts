import { APIRequestContext } from '@playwright/test';

import {
  type CreatedCourt,
  type CreatedServiceCentre,
  type TestCourtParams,
  type TestServiceCentreParams,
  createTestCourt,
  createTestServiceCentre,
  createTestingSupportApiContext,
  deleteTestCourtsByNamePrefix,
  deleteTestServiceCentresByNamePrefix,
} from './courtTestData';

type PlaywrightLike = Parameters<typeof createTestingSupportApiContext>[0];
const TEST_COURT_RUN_SUFFIX = process.env.PLAYWRIGHT_TEST_COURT_RUN_SUFFIX ?? generateRandomSuffix(4);
export const TEST_COURT_PREFIX = `FaCTAdminTest${TEST_COURT_RUN_SUFFIX}`;

export type TestCourtSupportContext = {
  apiContext: APIRequestContext;
  courtNamePrefix: string;
};

export type CreatedCourtSupportContext = TestCourtSupportContext & {
  createdCourt: CreatedCourt;
};

export type CreatedServiceCentreSupportContext = TestCourtSupportContext & {
  createdServiceCentre: CreatedServiceCentre;
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

export async function withTestLocationPrefix(
  playwright: PlaywrightLike,
  prefixLabel: string,
  run: (context: TestCourtSupportContext) => Promise<void>
): Promise<void> {
  const apiContext = await createTestingSupportApiContext(playwright);
  const courtNamePrefix = `${TEST_COURT_PREFIX} ${prefixLabel} ${generateRandomSuffix()}`;

  try {
    await deleteTestCourtsByNamePrefix(apiContext, courtNamePrefix);
    await deleteTestServiceCentresByNamePrefix(apiContext, courtNamePrefix);
    await run({ apiContext, courtNamePrefix });
  } finally {
    await deleteTestCourtsByNamePrefix(apiContext, courtNamePrefix);
    await deleteTestServiceCentresByNamePrefix(apiContext, courtNamePrefix);
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

export async function withCreatedServiceCentre(
  playwright: PlaywrightLike,
  prefixLabel: string,
  serviceCentreParams: Omit<TestServiceCentreParams, 'serviceCentreName'>,
  run: (context: CreatedServiceCentreSupportContext) => Promise<void>
): Promise<void> {
  await withTestLocationPrefix(playwright, prefixLabel, async ({ apiContext, courtNamePrefix }) => {
    const createdServiceCentre = await createTestServiceCentre(apiContext, {
      ...serviceCentreParams,
      serviceCentreName: courtNamePrefix,
    });

    await run({ apiContext, courtNamePrefix, createdServiceCentre });
  });
}
