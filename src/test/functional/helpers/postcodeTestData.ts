import type { APIRequestContext } from '@playwright/test';

type TestPostcodeReference = {
  coordinateQuality: number;
  coordinatesAvailable: boolean;
  introducedYearMonth: string;
  latitude: number;
  longitude: number;
  postcode: string;
  terminatedYearMonth?: string;
} & ({ status: 'current'; largeUser: true } | { status: 'terminated'; largeUser: boolean });

export const TEST_POSTCODE_REFERENCES: TestPostcodeReference[] = [
  {
    coordinateQuality: 1,
    coordinatesAvailable: true,
    introducedYearMonth: '201802',
    largeUser: true,
    latitude: 52.245285,
    longitude: -0.898231,
    postcode: 'ZZ99 1AB',
    status: 'current',
  },
  {
    coordinateQuality: 1,
    coordinatesAvailable: true,
    introducedYearMonth: '198001',
    largeUser: false,
    latitude: 52.202802,
    longitude: -0.887677,
    postcode: 'ZZ99 1AC',
    status: 'terminated',
    terminatedYearMonth: '199405',
  },
  {
    coordinateQuality: 1,
    coordinatesAvailable: true,
    introducedYearMonth: '201012',
    largeUser: true,
    latitude: 52.232949,
    longitude: -0.912681,
    postcode: 'ZZ99 1AD',
    status: 'terminated',
    terminatedYearMonth: '201212',
  },
];

export async function seedTestPostcodes(apiContext: Pick<APIRequestContext, 'post'>): Promise<void> {
  const response = await apiContext.post('/testing-support/postcodes/terminated', {
    data: TEST_POSTCODE_REFERENCES,
  });

  if (!response.ok()) {
    throw new Error(`Failed to seed test postcodes (${response.status()}): ${await response.text()}`);
  }
}
