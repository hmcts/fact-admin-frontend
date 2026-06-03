import { APIRequestContext } from '@playwright/test';

import { config } from '../utils';

type PlaywrightLike = {
  request: {
    newContext: (options: { baseURL: string; extraHTTPHeaders: { Accept: string } }) => Promise<APIRequestContext>;
  };
};
type ApiRequestLike = {
  newContext: (options: { baseURL: string; extraHTTPHeaders: { Accept: string } }) => Promise<APIRequestContext>;
};

type CourtResponse = {
  id: string;
  name: string;
  slug: string;
};

export type CreatedCourt = {
  body: CourtResponse;
  id: string;
  name: string;
  slug: string;
};

export type TestingSupportRegion = {
  country: string;
  id: string;
  name: string;
};

export type TestCourtParams = {
  addWarningNotice?: boolean;
  courtName: string;
  open?: boolean;
  regionId?: string;
  serviceCenter?: boolean;
  withEnquiriesContact?: boolean;
  withServiceAreaAssociation?: boolean;
  withTranslations?: boolean;
  forceFamilyCourt?: boolean;
};

export async function createTestingSupportApiContext(
  playwrightOrRequest: PlaywrightLike | ApiRequestLike
): Promise<APIRequestContext> {
  const requestContextFactory = 'request' in playwrightOrRequest ? playwrightOrRequest.request : playwrightOrRequest;

  return requestContextFactory.newContext({
    baseURL: config.urls.dataApiUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  });
}

export async function createTestCourt(
  apiContext: APIRequestContext,
  {
    addWarningNotice = false,
    courtName,
    open = true,
    regionId,
    serviceCenter = false,
    withEnquiriesContact = true,
    withServiceAreaAssociation = false,
    withTranslations = true,
    forceFamilyCourt = false,
  }: TestCourtParams
): Promise<CreatedCourt> {
  const params = {
    addWarningNotice,
    courtName,
    open,
    serviceCenter,
    withEnquiriesContact,
    withServiceAreaAssociation,
    withTranslations,
    forceFamilyCourt,
    ...(regionId ? { regionId } : {}),
  };
  const response = await apiContext.get('/testing-support/courts', {
    params,
  });
  const responseText = await response.text();

  if (!response.ok()) {
    throw new Error(`Failed to create test court (${response.status()}): ${responseText}`);
  }

  if (!responseText) {
    throw new Error(`Failed to create test court (${response.status()}): empty response body`);
  }

  const responseBody = JSON.parse(responseText) as CourtResponse;

  return {
    body: responseBody,
    id: responseBody.id,
    name: responseBody.name,
    slug: responseBody.slug,
  };
}

export async function getTestingSupportRegions(apiContext: APIRequestContext): Promise<TestingSupportRegion[]> {
  const response = await apiContext.get('/testing-support/regions');
  const responseText = await response.text();

  if (!response.ok()) {
    throw new Error(`Failed to fetch testing-support regions (${response.status()}): ${responseText}`);
  }

  if (!responseText) {
    throw new Error(`Failed to fetch testing-support regions (${response.status()}): empty response body`);
  }

  return JSON.parse(responseText) as TestingSupportRegion[];
}

export async function deleteTestCourtsByNamePrefix(
  apiContext: APIRequestContext,
  courtNamePrefix: string
): Promise<void> {
  const response = await apiContext.delete(
    `/testing-support/courts/name-prefix/${encodeURIComponent(courtNamePrefix)}`
  );

  if (!response.ok()) {
    throw new Error(`Failed to delete test courts for prefix ${courtNamePrefix}: ${await response.text()}`);
  }
}
